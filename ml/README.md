# Opacity ML

The implemented model is an **external-data research benchmark**, not an Opacity gameplay classifier.

## Implemented

`research/rello/` contains the audited Rello/MusVis/DGames source pipeline, the first Rello Logistic Regression/Random Forest comparison, and aggregate results. The selected model is Random Forest. Its 42 inputs are derived from 19 Rello questions; those question variables are not emitted by Opacity's five games.

```bash
cd ml/research/rello
python -m venv .venv
# Activate the environment for your shell, then:
pip install -r requirements.txt
python download_data.py
python audit.py
python train_baseline.py
python verify.py
python build_report.py
```

The scripts resolve data, result and model paths relative to their own folder, so they also work when invoked from the repository root. Raw participant data, trained binary models, row-level predictions and split identifiers are ignored by git. Audit statistics, model comparison and the feature contract are tracked.

## Product integration boundary

The web backend lives in `frontend/app/api/`. It stores trials, typed score columns and game-specific `session_scores.raw_features`. It has no Python prediction call and no report-generation service yet. A future server-to-server Python service may live under `backend/`; do not load this research model into the web app or convert its scores into `screening_reports.risk_band`.

Read [FEATURE_ALIGNMENT.md](FEATURE_ALIGNMENT.md) for the actual game contract and pending collection work. XGBoost/SHAP remain proposed experiments, not implemented dependencies or validated product behavior.
