#!/usr/bin/env bash
# Linux Cloud Agent / Cursor Automation verification (parity with scripts/verify-full.cmd).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export PATH="${HOME}/.foundry/bin:${PATH}"
export ION_VERIFY_NONINTERACTIVE=1
export CI=1

echo ""
echo "AGENT-CLOUD-VERIFY starting"
echo "Repo root: $ROOT"
echo ""

echo "=== 0) Automation preflight ==="
if [ -f scripts/automation-preflight.mjs ]; then
  node scripts/automation-preflight.mjs
else
  echo "WARN: scripts/automation-preflight.mjs missing — running inline checks"
  command -v node >/dev/null || { echo "ERROR: node missing"; exit 1; }
  command -v npm >/dev/null || { echo "ERROR: npm missing"; exit 1; }
  test -f SESSION_STATE.md || { echo "ERROR: SESSION_STATE.md missing"; exit 1; }
  test -f .memory-bank/architecture-audit.md || { echo "ERROR: architecture-audit.md missing"; exit 1; }
fi

echo ""
echo "=== 1) FunC + contract test gate ==="
node scripts/func-contract-test.mjs

echo ""
echo "=== 2) Backend verify ==="
(
  cd backend
  npm run verify
  npm run audit:high
  npm run stress
)

echo ""
echo "=== 3) Frontend verify ==="
(
  cd frontend
  npm run verify
  npm run audit:high
)

echo ""
echo "=== 4) Dual-chain audit (ION 1500 + BSC 1500) ==="
if command -v forge >/dev/null 2>&1 && [ -f scripts/dual-chain-audit.mjs ]; then
  node scripts/dual-chain-audit.mjs
else
  echo "SKIP: forge or dual-chain-audit.mjs unavailable — run foundryup in cloud environment"
fi

echo ""
echo "OK - agent-cloud-verify completed."
