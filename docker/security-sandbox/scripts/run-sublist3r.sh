#!/usr/bin/env bash
set -euo pipefail
DOMAIN="${1:-}"
if [[ -z "${DOMAIN}" ]]; then
  echo "usage: run-sublist3r.sh <domain>" >&2
  exit 2
fi
TOOL_ROOT="/tools/vendor/Sublist3r"
if [[ ! -f "${TOOL_ROOT}/sublist3r.py" ]]; then
  echo "# Sublist3r not mounted at ${TOOL_ROOT}" >&2
  exit 3
fi
python -m pip install --quiet --disable-pip-version-check -r "${TOOL_ROOT}/requirements.txt" 2>/dev/null || true
OUT="/tmp/sublist3r-${DOMAIN}.txt"
python "${TOOL_ROOT}/sublist3r.py" -d "${DOMAIN}" -o "${OUT}" 2>/dev/null || true
if [[ -f "${OUT}" ]]; then
  cat "${OUT}"
fi
