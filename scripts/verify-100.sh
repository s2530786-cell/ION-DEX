#!/usr/bin/env bash
# POSIX 100-pass gate: runs verify-full.sh N times (default 100).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ITERATIONS="${1:-100}"
STAMP="$(date +%Y%m%d-%H%M%S)"
SUMMARY="${TMPDIR:-/tmp}/ion-verify-100-summary-${STAMP}.txt"
LOG="${TMPDIR:-/tmp}/ion-verify-100-${STAMP}.log"

cd "$ROOT"
: >"$LOG"
{
  echo "ION DEX 100-pass verification (POSIX)"
  echo "ITERATIONS=$ITERATIONS"
  echo "LOG=$LOG"
} >"$SUMMARY"

passed=0
failed=0

for ((i = 1; i <= ITERATIONS; i++)); do
  echo "[$(date -Iseconds)] PASS $i/$ITERATIONS" | tee -a "$LOG"
  if bash scripts/verify-full.sh >>"$LOG" 2>&1; then
    passed=$((passed + 1))
    echo "PASS $i OK" >>"$SUMMARY"
  else
    failed=$((failed + 1))
    echo "PASS $i FAILED" >>"$SUMMARY"
    echo "RESULT=FAILED" >>"$SUMMARY"
    echo "PASSED=$passed" >>"$SUMMARY"
    echo "FAILED=$failed" >>"$SUMMARY"
    echo "FAILED at pass $i — see $LOG"
    exit 1
  fi
done

{
  echo "PASSED=$passed"
  echo "FAILED=$failed"
  echo "RESULT=GREEN"
} >>"$SUMMARY"

echo "RESULT=GREEN — $SUMMARY"
exit 0
