"""Checks reproducibility/provenance of the synthetic model, not diagnostic accuracy."""
import hashlib
import json
import unittest

import numpy as np

from ml.gameplay.train import ROOT, OUTPUT, synthetic_dataset, train


class GameplayTrainingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.artifact, cls.report, cls.fixtures, cls.model = train()

    def test_committed_weights_are_reproducible(self):
        self.assertEqual(self.artifact, json.loads((OUTPUT / "model.json").read_text()))
        report = json.loads((ROOT / "ml/gameplay/training_report.json").read_text())
        self.assertEqual(report["artifact_sha256"], hashlib.sha256((OUTPUT / "model.json").read_bytes()).hexdigest())

    def test_synthetic_provenance_and_participant_separation(self):
        self.assertEqual(self.artifact["training_source"], "synthetic")
        self.assertTrue(self.artifact["simulated"])
        self.assertEqual(self.report["participant_overlap"], 0)
        self.assertEqual(self.artifact["training_participants"], 960)
        self.assertEqual(self.artifact["evaluation_participants"], 240)

    def test_fixture_predictions_are_from_the_fitted_pipeline(self):
        fixtures = json.loads((ROOT / "frontend/tests/gameplay-parity.json").read_text())
        values = np.array([[np.nan if v is None else v for v in row["features"]] for row in fixtures])
        expected = self.model.predict_proba(values)[:, 1]
        np.testing.assert_allclose(expected, [row["score"] for row in fixtures], rtol=0, atol=1e-12)

    def test_generated_labels_never_appear_in_feature_vector(self):
        x, y, groups, labels = synthetic_dataset(30)
        self.assertEqual(x.shape, (60, 25))
        self.assertEqual(len(set(groups)), 30)
        np.testing.assert_array_equal(y, labels[groups])
        self.assertTrue(all("diagnosis" not in name and "label" not in name for name in self.artifact["feature_names"]))

    def test_training_includes_partial_game_coverage_without_zero_filling(self):
        x, _, _, _ = synthetic_dataset()
        self.assertEqual(set(x[:, 20:].sum(axis=1)), {1, 2, 3, 4, 5})
        for game in range(5):
            absent = x[:, 20 + game] == 0
            self.assertTrue(np.isnan(x[absent, game * 4:game * 4 + 4]).all())


if __name__ == "__main__":
    unittest.main()
