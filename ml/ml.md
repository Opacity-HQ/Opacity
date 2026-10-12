# ML entry point

See [README.md](README.md) for the implemented research baseline and [FEATURE_ALIGNMENT.md](FEATURE_ALIGNMENT.md) for the live-game feature contract. Training code is in `research/rello/train_baseline.py`; generated model files are under `research/rello/models/` after training.

The preliminary website API and setup instructions are in [service/README.md](service/README.md). Serving installs the original frozen model into ignored `service/artifacts/`; it does not rerun training.
