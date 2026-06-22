#!/usr/bin/env bash
set -euo pipefail
TARGET_URL="${1:-}"
if [[ -z "${TARGET_URL}" ]]; then
  echo "usage: run-clickjacking.sh <url>" >&2
  exit 2
fi
TOOL="/tools/vendor/Clickjacking-Tester/Clickjacking_Tester.py"
if [[ -f "${TOOL}" ]]; then
  python "${TOOL}" "${TARGET_URL}" 2>/dev/null || true
fi
python - <<'PY' "${TARGET_URL}"
import sys
import urllib.request
url = sys.argv[1]
try:
    req = urllib.request.Request(url, headers={"User-Agent": "ION-DEX-Sentinel/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        print(f"HTTP status: {resp.status}")
        for key in ("X-Frame-Options", "Content-Security-Policy"):
            value = resp.headers.get(key)
            if value:
                print(f"{key}: {value}")
            else:
                print(f"{key}: missing")
except Exception as exc:
    print(f"fetch-error: {exc}")
PY
