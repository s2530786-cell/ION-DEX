#!/usr/bin/env bash
# ION DEX — UI round verification: preflight + full verify (non-interactive).
set -euo pipefail
cd "$(dirname "$0")/.."
export ION_VERIFY_NONINTERACTIVE=1

echo "=== ION DEX UI round verify ==="
node scripts/dev-preflight.mjs
node scripts/security-preflight.mjs
bash scripts/verify-full.sh
echo "OK — UI round verify passed."
