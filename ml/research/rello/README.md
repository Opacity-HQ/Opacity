# Opacity — first external-data ML benchmark

Completed 2026-10-09. This is a Rello-specific research baseline. It is not a trained or validated Opacity five-game screening model.

## Run

Use Python 3.12 and a virtual environment:

```bash
pip install -r requirements.txt
python download_data.py
python audit.py
python train_baseline.py
python verify.py
python build_report.py
```

See `Opacity_ML_Audit_Report.html` for findings and interpretation. All paths resolve relative to these scripts. Scripts only retrieve source releases or write local outputs; they do not send participant data anywhere.

## Artifacts

- `source_manifest.json`: exact downloaded-byte hashes and provenance; Kaggle's unversioned endpoint may change, so compare hashes against this manifest when reproducing.
- `results/audit.json`, `results/column_profiles.csv`: all four CSV audits, class mappings, repeated IDs, per-column distributions and count/rate consistency.
- `results/feature_contract.csv`: explicit 42-feature definition using 19 shared Rello questions.
- `results/cv_comparison.csv`, `results/baseline_metrics.json`: development model selection and locked evaluation, confidence intervals, age breakdowns and limitations.
- `results/split_manifest.csv`: deterministic source-row and vector-fingerprint partition/fold assignment. Source rows and fingerprints are linkage metadata, not authentic participant IDs.
- `results/predictions.csv`, `results/development_oof.csv`: reproducible scores; handle these as participant-linked research outputs.
- `models/rello_baseline.joblib`: fitted development-only pipeline, ordered input features, threshold, and labels. Load only a trusted joblib file; serialization can execute code.

Source participant CSVs are downloaded separately and excluded from the deliverable archive. Original data ownership/license is retained by its publishers.

## Baseline

42 deterministic features: log click exposure and rebuilt hit rates for Q1–Q12, Q14–Q17, Q22–Q23, Q30; rebuilt miss rates for Q1–Q3 and Q30. Zero-click rates are missing, not zero performance. Raw Accuracy/Missrate and Score are excluded. Median imputation plus missingness indicators, variance filtering and scaling are fitted inside development folds. Split strata are label × age band; model-vector duplicates are grouped.

Random Forest beats Logistic Regression in five-fold development ROC-AUC. Model and an OOF threshold targeting 80% sensitivity are selected without desktop test or tablet labels. Saved model is fit on the desktop development partition only. Do not refit on holdout or retune on the tablet cohort while continuing to call them untouched evaluation sets.

Rello exports lack participant and site IDs. The one-row-per-participant assumption follows the publication; duplicate-vector safeguards cannot establish hidden participant/site independence. MusVis has repeated IDs and DGames malformed derived numeric columns; datasets are not pooled. No equivalent input interface with Opacity has been validated.
