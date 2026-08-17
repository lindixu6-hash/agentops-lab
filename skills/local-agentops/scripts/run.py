"""Cross-platform fixed entry point for the Local AgentOps skill."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    client = script_dir / "client.py"
    environment = os.environ.copy()
    environment.pop("PYTHONHOME", None)
    environment.pop("PYTHONPATH", None)
    runtime_home = Path(
        environment.get("AGENTOPS_RUNTIME_HOME", Path.cwd() / ".agentops-runtime")
    ).resolve()
    runtime_home.mkdir(parents=True, exist_ok=True)
    environment["AGENTOPS_RUNTIME_HOME"] = str(runtime_home)
    environment["HOME"] = str(runtime_home)
    environment["OPENVINO_TELEMETRY_DISABLED"] = "1"

    completed = subprocess.run(
        [sys.executable, str(client), *sys.argv[1:]],
        env=environment,
        check=False,
    )
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
