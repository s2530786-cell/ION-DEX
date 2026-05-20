#!/usr/bin/env bash
# Full verification for POSIX agents: preflight + encoding + backend + frontend + audits.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "VERIFY-FULL starting"
echo "========================================"
echo "ion-dex : verify-full (POSIX)"
echo "========================================"
echo "Repo root: $ROOT"
echo

echo "=== 0) Development preflight ==="
node scripts/dev-preflight.mjs

echo
echo "=== 1) Encoding check ==="
bash scripts/check-encoding.sh

echo
echo "=== 2) Backend verify (build + API tests) ==="
(
  cd backend
  npm run verify
  npm run audit:high
  npm run stress
)

echo
echo "=== 3) Frontend verify (build + Playwright) ==="
(
  cd frontend
  npm run verify
)

echo
echo "=== 4) Frontend npm audit (high) ==="
(
  cd frontend
  npm run audit:high
)

echo
echo "OK - verify-full completed."
