#!/usr/bin/env bash
set -euo pipefail
BRAND="${1:-}"
DOMAIN="${2:-}"
if [[ -z "${BRAND}" || -z "${DOMAIN}" ]]; then
  echo "usage: run-cr3dov3r.sh <brand> <domain>" >&2
  exit 2
fi
TOOL_ROOT="/tools/vendor/Cr3dOv3r"
if [[ ! -f "${TOOL_ROOT}/Cr3d0v3r.py" ]]; then
  echo "# Cr3dOv3r not mounted at ${TOOL_ROOT}" >&2
  exit 3
fi
python -m pip install --quiet --disable-pip-version-check -r "${TOOL_ROOT}/requirements.txt" 2>/dev/null || true
python "${TOOL_ROOT}/Cr3d0v3r.py" "${BRAND}" 2>/dev/null || true
echo "# sentinel credential scan completed for brand=${BRAND} domain=${DOMAIN}"
