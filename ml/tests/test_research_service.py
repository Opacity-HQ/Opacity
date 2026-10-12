"""Integration checks against the real frozen model, not a fake classifier."""
import hashlib
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
import joblib
import numpy as np
import pandas as pd

from ml.research.rello.features import QUESTIONS, build_features
from ml.service.app import create_app
from ml.service.contracts import PredictionInput, synthetic_example
from ml.service.model import ARTIFACT_PATH, ResearchModel

KEY = "test-service-key-not-for-deployment-123456"
HEADERS = {"X-ML-API-Key": KEY}


class ResearchServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.environment = patch.dict(os.environ, {"ML_SERVICE_API_KEY": KEY})
        cls.environment.start()
        cls.client = TestClient(create_app())
        cls.client.__enter__()
        cls.original = joblib.load(ARTIFACT_PATH)

    @classmethod
    def tearDownClass(cls):
        cls.client.__exit__(None, None, None)
        cls.environment.stop()

    def predict(self, payload):
        return self.client.post("/v1/research/rello/predict", json=payload, headers=HEADERS)

    def test_health_metadata_and_stable_release(self):
        self.assertEqual(self.client.get("/health").json()["status"], "ready")
        response = self.client.get("/v1/research/rello/metadata", headers=HEADERS)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["questions"], [f"Q{q}" for q in QUESTIONS])
        self.assertEqual(data["feature_count"], 42)
        self.assertEqual(data["model_sha256"], hashlib.sha256(ARTIFACT_PATH.read_bytes()).hexdigest())
        self.assertAlmostEqual(data["evaluation"]["desktop_holdout"]["roc_auc"], .7710613437195717)
        PredictionInput.model_validate(data["examples"]["complete"])

    def test_scores_match_original_pipeline_complete_and_missing(self):
        for partial in (False, True):
            with self.subTest(partial=partial):
                payload = synthetic_example(partial)
                # Independently reconstruct the source CSV shape, then use the original saved pipeline.
                row = {f"{prefix}{q}": (np.nan if payload["tasks"][f"Q{q}"][field] is None
                                         else payload["tasks"][f"Q{q}"][field])
                       for q in QUESTIONS for prefix, field in (("Clicks", "clicks"), ("Hits", "hits"), ("Misses", "misses"))}
                features = build_features(pd.DataFrame([row]))
                expected = self.original["pipeline"].predict_proba(features)[0, 1]
                response = self.predict(payload)
                self.assertEqual(response.status_code, 200, response.text)
                data = response.json()
                self.assertAlmostEqual(data["score"], expected, places=14)
                self.assertEqual(data["above_threshold"], expected >= self.original["threshold"])
                self.assertEqual(data["missing_feature_count"], int(features.isna().sum().sum()))
                self.assertEqual(data["scope"], "research_only")
                self.assertNotIn("risk_band", data)
                self.assertEqual(self.predict(payload).json(), data)

    def test_partial_count_tuple_is_missing_not_zero(self):
        payload = synthetic_example()
        payload["tasks"]["Q1"]["hits"] = None
        result = self.predict(payload).json()
        self.assertEqual(result["missing_feature_count"], 3)
        self.assertEqual(result["complete_task_count"], 18)
        self.assertEqual(result["active_task_count"], 18)

    def test_rejects_invalid_counts_and_foreign_vectors(self):
        for value in (-1, 1.5, "20", True, 1_000_001):
            payload = synthetic_example()
            payload["tasks"]["Q1"]["clicks"] = value
            with self.subTest(value=value):
                self.assertEqual(self.predict(payload).status_code, 422)
        invalid = []
        payload = synthetic_example(); payload["tasks"]["Q1"]["hits"] = 21; invalid.append(payload)
        payload = synthetic_example(); payload["tasks"]["Q1"]["misses"] = 21; invalid.append(payload)
        payload = synthetic_example(); del payload["tasks"]["Q30"]; invalid.append(payload)
        payload = synthetic_example(); payload["schema_version"] = "opacity-games-v1"; invalid.append(payload)
        payload = synthetic_example(); payload["Dyslexia"] = "Yes"; invalid.append(payload)
        payload = synthetic_example(); payload["child_id"] = "some-child"; invalid.append(payload)
        payload = synthetic_example(); payload["tasks"]["Q1"]["accuracy"] = .8; invalid.append(payload)
        for payload in invalid:
            self.assertEqual(self.predict(payload).status_code, 422)

    def test_rejects_all_empty_or_unattempted(self):
        for value in (None, 0):
            payload = synthetic_example()
            for counts in payload["tasks"].values():
                counts.update(clicks=value, hits=value, misses=value)
            self.assertEqual(self.predict(payload).status_code, 422)

    def test_no_prediction_without_service_key(self):
        for headers in ({}, {"X-ML-API-Key": "wrong"}):
            self.assertEqual(self.client.post("/v1/research/rello/predict", json=synthetic_example(), headers=headers).status_code, 401)
            self.assertEqual(self.client.get("/v1/research/rello/metadata", headers=headers).status_code, 401)

    def test_model_integrity_checked_before_deserialization(self):
        with tempfile.TemporaryDirectory() as directory:
            corrupt = Path(directory) / "corrupt.joblib"
            corrupt.write_bytes(b"not a trusted model")
            with patch("ml.service.model.joblib.load") as load:
                with self.assertRaisesRegex(RuntimeError, "checksum"):
                    ResearchModel(corrupt)
                load.assert_not_called()
            with self.assertRaisesRegex(RuntimeError, "Model missing"):
                ResearchModel(Path(directory) / "absent.joblib")

    def test_startup_requires_service_secret(self):
        with patch.dict(os.environ, {"ML_SERVICE_API_KEY": ""}):
            with self.assertRaisesRegex(RuntimeError, "ML_SERVICE_API_KEY"):
                with TestClient(create_app()):
                    pass


if __name__ == "__main__":
    unittest.main()
