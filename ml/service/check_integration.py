"""Start the real Python service and exercise Next's forwarding handlers."""
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[2]


def main():
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Install Node.js 20.9+ and run npm ci in frontend first")
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    key = secrets.token_urlsafe(32)
    environment = {**os.environ, "ML_SERVICE_API_KEY": key,
                   "ML_TEST_SERVICE_KEY": key, "ML_TEST_SERVICE_URL": f"http://127.0.0.1:{port}"}
    with tempfile.TemporaryFile() as logs:
        server = subprocess.Popen([sys.executable, "-m", "uvicorn", "ml.service.app:app",
                                   "--host", "127.0.0.1", "--port", str(port)],
                                  cwd=ROOT, env=environment, stdout=logs, stderr=logs)
        try:
            for _ in range(100):
                if server.poll() is not None:
                    logs.seek(0)
                    raise RuntimeError(logs.read().decode())
                try:
                    with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=1) as response:
                        if response.status == 200:
                            break
                except OSError:
                    time.sleep(.1)
            else:
                raise RuntimeError("Python service did not become ready")
            return subprocess.call([node, "--test", "tests/letter-detective-features.test.mjs",
                                    "tests/rello-research.test.mjs"], cwd=ROOT / "frontend", env=environment)
        finally:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()


if __name__ == "__main__":
    sys.exit(main())
