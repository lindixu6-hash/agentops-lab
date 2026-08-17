#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV="${AGENTOPS_VENV:-$ROOT/.venv}"

for argument in "$@"; do
  if [[ "$argument" == "--no-model" ]]; then
    unset PYTHONHOME PYTHONPATH
    exec "${AGENTOPS_PYTHON:-python3}" "$ROOT/scripts/run.py" "$@"
  fi
done

unset PYTHONHOME PYTHONPATH

if [[ ! -x "$VENV/bin/python" ]]; then
  PYTHON="${AGENTOPS_PYTHON:-$(command -v python3.11 || true)}"
  if [[ -z "$PYTHON" ]]; then
    echo "Python 3.11 is required for OpenVINO model mode." >&2
    exit 1
  fi
  "$PYTHON" -m venv "$VENV"
  "$VENV/bin/python" -m pip install --upgrade pip
  "$VENV/bin/python" -m pip install -r "$ROOT/requirements.txt"
fi

if ! "$VENV/bin/python" -c 'import sys; raise SystemExit(sys.version_info[:2] < (3, 11))'; then
  echo "The AgentOps environment must use Python 3.11 or newer: $VENV" >&2
  exit 1
fi

exec "$VENV/bin/python" "$ROOT/scripts/run.py" "$@"
