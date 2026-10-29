# Opacity ML

There are two separate model paths: the **Rello external-data research benchmark**
and an **Opacity gameplay prototype trained on synthetic data**. Neither is a
validated diagnostic model.

## Gameplay prototype

Each game's completion screen and the dashboard classify completed Opacity gameplay into the simulated
classes "Dyslexia" / "No dyslexia", with confidence in the selected class. One complete game is sufficient. It uses a separate 25-feature logistic model,
trained with `python -m ml.gameplay.train --synthetic`, and serves the exported
JSON weights inside Next.js. See [gameplay/README.md](gameplay/README.md) for local
usage, the feature contract, checks and the path to training on real labeled data.

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

The web backend lives in `frontend/app/api/`. It stores trials, typed score columns and game-specific `session_scores.raw_features`. The optional `/research/rello` page now calls a frozen-model FastAPI service through `/api/research/rello`. It accepts Rello counts only, requires an existing user session and a server secret, and creates no child screening reports. See [service/README.md](service/README.md) for Windows setup, model installation, tests and hosting.

Validated Opacity gameplay screening and report generation still require labeled
Opacity data. The new synthetic prototype does not write screening reports.
Do not convert the Rello research score into `screening_reports.risk_band`.

Read [FEATURE_ALIGNMENT.md](FEATURE_ALIGNMENT.md) for the actual game contract and pending collection work. XGBoost/SHAP remain proposed experiments, not implemented dependencies or validated product behavior.
