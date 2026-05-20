#!/usr/bin/env bash
# Non-interactive full verification for POSIX Cloud Agents (same as agent-verify.cmd).

set -euo pipefail
export ION_VERIFY_NONINTERACTIVE=1
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
exec node scripts/agent-workflow.mjs --tier verify --execute
