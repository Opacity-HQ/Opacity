"""Verify and copy the original benchmark artifact without deserializing it."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent


def install(source: Path):
    manifest = json.loads((ROOT / "model_manifest.json").read_text())
    if hashlib.sha256(source.read_bytes()).hexdigest() != manifest["sha256"]:
        raise ValueError("Wrong model checksum. Use the original Opacity ML Baseline artifact.")
    destination = ROOT / "artifacts" / manifest["model_file"]
    destination.parent.mkdir(parents=True, exist_ok=True)
    if source.resolve() != destination.resolve():
        shutil.copyfile(source, destination)
    return destination


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    print(f"Verified model installed: {install(args.source)}")
