"""Load a trusted, pinned artifact once. Never train in the request path."""
import hashlib
import importlib.metadata
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from ml.research.rello.features import QUESTIONS, build_features
from ml.service.contracts import PredictionInput, PredictionOutput, SCHEMA_VERSION, synthetic_example

ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / "model_manifest.json"
ARTIFACT_PATH = ROOT / "artifacts" / "rello_baseline.joblib"
LIMITATIONS = [
    "Rello research benchmark only. Opacity game sessions are not compatible inputs.",
    "The score is not a calibrated clinical probability or a diagnosis.",
    "The cutoff was selected on development predictions; it is not a validated clinical cutoff.",
]


def count_frame(payload: PredictionInput):
    row = {}
    for q in QUESTIONS:
        counts = payload.tasks[f"Q{q}"]
        for source, field in (("Clicks", "clicks"), ("Hits", "hits"), ("Misses", "misses")):
            value = getattr(counts, field)
            row[f"{source}{q}"] = np.nan if value is None else value
    return pd.DataFrame([row])


class ResearchModel:
    def __init__(self, artifact_path=ARTIFACT_PATH):
        self.manifest = json.loads(MANIFEST_PATH.read_text())
        for package, expected in self.manifest["versions"].items():
            if importlib.metadata.version(package) != expected:
                raise RuntimeError(f"Install pinned service dependencies: {package} must be {expected}")
        path = Path(artifact_path)
        if not path.is_file():
            raise RuntimeError("Model missing. Run python -m ml.service.install_model <trusted-model-path>")
        self.sha256 = hashlib.sha256(path.read_bytes()).hexdigest()
        if self.sha256 != self.manifest["sha256"]:
            raise RuntimeError("Model checksum differs from the frozen benchmark; refusing to load")
        bundle = joblib.load(path)
        example = PredictionInput.model_validate(synthetic_example())
        columns = build_features(count_frame(example)).columns.tolist()
        if (bundle["feature_names"] != columns or bundle["questions"] != QUESTIONS
                or bundle["model"] != "random_forest" or bundle["label_mapping"] != {"No": 0, "Yes": 1}
                or bundle["training_partition"] != "desktop development partition only; desktop holdout and tablet excluded"):
            raise RuntimeError("Model does not match the audited feature/training contract")
        self.pipeline = bundle["pipeline"]
        if self.pipeline.feature_names_in_.tolist() != columns or self.pipeline.classes_.tolist() != [0, 1]:
            raise RuntimeError("Unexpected pipeline feature order or class order")
        self.pipeline.set_params(classifier__n_jobs=1)
        self.threshold = float(bundle["threshold"])
        self.model_id = self.manifest["model_id"]
        self.feature_names = columns
        self.metrics = json.loads((ROOT.parent / "research/rello/results/baseline_metrics.json").read_text())
        if self.threshold != self.metrics["threshold"] or not 0 < self.threshold < 1:
            raise RuntimeError("Threshold differs from the locked report")

    def predict(self, payload: PredictionInput):
        features = build_features(count_frame(payload)).loc[:, self.feature_names]
        score = float(self.pipeline.predict_proba(features)[0, 1])
        missing = int(features.isna().sum().sum())
        complete = sum(all(v is not None for v in (t.clicks, t.hits, t.misses))
                       for t in payload.tasks.values())
        active = sum(t.clicks is not None and t.clicks > 0 and t.hits is not None
                     and t.misses is not None for t in payload.tasks.values())
        warnings = list(LIMITATIONS)
        if missing:
            warnings.append(f"{missing} of 42 features are missing; the frozen training imputer handles them.")
        if active < 19:
            warnings.append("Some tasks are incomplete or unattempted. Sparse input can make this score unreliable.")
        return PredictionOutput(
            model_id=self.model_id, model_sha256=self.sha256, schema_version=SCHEMA_VERSION,
            score=score, threshold=self.threshold, above_threshold=score >= self.threshold,
            feature_count=42, missing_feature_count=missing, complete_task_count=complete,
            active_task_count=active, warnings=warnings,
        )

    def metadata(self):
        evaluations = self.metrics["evaluations"]
        return dict(
            model_id=self.model_id, model_sha256=self.sha256, schema_version=SCHEMA_VERSION,
            scope="research_only", threshold=self.threshold, feature_count=42,
            questions=[f"Q{q}" for q in QUESTIONS], warnings=LIMITATIONS,
            examples={"complete": synthetic_example(), "partial": synthetic_example(partial=True)},
            evaluation={
                cohort: {k: evaluations[cohort]["at_oof_threshold"][k]
                         for k in ("n", "roc_auc", "sensitivity", "specificity", "precision")}
                for cohort in ("desktop_holdout", "tablet_external")
            },
        )
