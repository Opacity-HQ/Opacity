"""Train a reproducible synthetic Opacity prototype and export portable JSON weights.

The synthetic class relationship below is invented for software testing. It is
not a dyslexia hypothesis supported by participant data, or an accuracy study.
"""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path

import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "frontend/lib/gameplay"
CONTRACT = json.loads((OUTPUT / "contract.json").read_text())
SEED = 20261013
FEATURE_NAMES = ([f"{game['id']}.{metric}" for game in CONTRACT["games"] for metric in CONTRACT["metrics"]]
                 + [f"{game['id']}.available" for game in CONTRACT["games"]])


def synthetic_dataset(participants=1200):
    rng = np.random.default_rng(SEED)
    labels = rng.integers(0, 2, size=participants)
    rows, targets, groups = [], [], []
    # Milliseconds differ by interaction; these are simulation choices, not norms.
    base_rt = [1200, 2200, 6000, 4500, 900]
    for participant, label in enumerate(labels):
        latent = float(label) + rng.normal(0, .35)
        for _ in range(2):
            row = []
            for game, timing in zip(CONTRACT["games"], base_rt):
                level = int(rng.integers(1, game["max_difficulty"] + 1))
                level_fraction = (level - 1) / (game["max_difficulty"] - 1)
                accuracy = np.clip(.94 - .30 * latent - .12 * level_fraction + rng.normal(0, .10), 0, 1)
                mean_rt = timing * np.exp(.35 * latent + .18 * level_fraction + rng.normal(0, .3))
                cv = np.clip(.22 + .19 * latent + rng.normal(0, .12), 0, 2)
                row.extend([float(accuracy), float(np.log1p(mean_rt)), float(cv), level])
            rows.append(row)
            targets.append(int(label))
            groups.append(participant)
    x = np.asarray(rows)
    # Missing timing is distinct from zero. Available games retain accuracy/level.
    for i in range(x.shape[1]):
        if i % 4 in (1, 2):
            x[rng.random(len(x)) < .05, i] = np.nan
    # Train on 1-5 completed games, chosen independently of the synthetic label.
    # Entire missing games are explicit, not disguised as zero performance.
    available = np.zeros((len(x), len(CONTRACT["games"])))
    for row in range(len(x)):
        selected = rng.choice(5, size=int(rng.integers(1, 6)), replace=False)
        available[row, selected] = 1
        for game in range(5):
            if not available[row, game]:
                x[row, game * 4:(game + 1) * 4] = np.nan
    x = np.column_stack((x, available))
    return x, np.asarray(targets), np.asarray(groups), labels


def train():
    x, y, groups, participant_labels = synthetic_dataset()
    train_groups, test_groups = train_test_split(np.arange(len(participant_labels)),
        test_size=.2, random_state=SEED, stratify=participant_labels)
    train_mask, test_mask = np.isin(groups, train_groups), np.isin(groups, test_groups)
    assert not set(train_groups) & set(test_groups)
    model = make_pipeline(SimpleImputer(strategy="median"), StandardScaler(),
                          LogisticRegression(C=1.0, max_iter=1000, random_state=SEED))
    model.fit(x[train_mask], y[train_mask])
    imputer, scaler, classifier = model.steps[0][1], model.steps[1][1], model.steps[2][1]
    artifact = {
        "model_id": "opacity-logistic-synthetic-v2",
        "schema_version": CONTRACT["schema_version"],
        "training_source": "synthetic",
        "simulated": True,
        "seed": SEED,
        "feature_names": FEATURE_NAMES,
        "classes": ["no_dyslexia", "dyslexia"],
        "threshold": .5,
        "imputer_medians": imputer.statistics_.tolist(),
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_scale": scaler.scale_.tolist(),
        "coefficients": classifier.coef_[0].tolist(),
        "intercept": float(classifier.intercept_[0]),
        "training_participants": len(train_groups),
        "evaluation_participants": len(test_groups),
        "limitations": "Invented synthetic labels and feature distributions. No demonstrated dyslexia detection."
    }
    heldout = model.predict_proba(x[test_mask])[:, 1]
    metrics = {
        "scope": "synthetic generator holdout only; not clinical or real-world accuracy",
        "participant_overlap": 0,
        "training_rows": int(train_mask.sum()), "evaluation_rows": int(test_mask.sum()),
        "synthetic_accuracy": float(accuracy_score(y[test_mask], heldout >= .5)),
        "synthetic_roc_auc": float(roc_auc_score(y[test_mask], heldout)),
        "versions": {name: importlib.metadata.version(name) for name in ("numpy", "scikit-learn")},
    }
    # Cross-language fixtures include missingness, both classes and extreme values.
    fixture_x = x[test_mask][:24].copy()
    fixtures = [{"features": [None if np.isnan(v) else float(v) for v in row],
                 "score": float(score)} for row, score in zip(fixture_x, model.predict_proba(fixture_x)[:, 1])]
    return artifact, metrics, fixtures, model


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--synthetic", action="store_true", required=True,
                        help="Explicit acknowledgement: outputs learn invented synthetic labels")
    parser.parse_args()
    artifact, metrics, fixtures, _ = train()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(artifact, indent=2, allow_nan=False) + "\n"
    (OUTPUT / "model.json").write_text(encoded, encoding="utf-8", newline="\n")
    metrics["artifact_sha256"] = hashlib.sha256(encoded.encode()).hexdigest()
    (ROOT / "ml/gameplay/training_report.json").write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    (ROOT / "frontend/tests/gameplay-parity.json").write_text(json.dumps(fixtures, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(f"Trained {artifact['model_id']} on synthetic data. Real-world performance is unknown.")
    print(f"Artifact SHA-256: {metrics['artifact_sha256']}")


if __name__ == "__main__":
    main()
