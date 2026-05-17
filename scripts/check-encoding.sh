#!/usr/bin/env bash
# ION DEX - Encoding Verifier (POSIX)
# Enforces: UTF-8 without BOM, no NUL bytes, no UTF-16 LE/BE.
# Usage:
#   bash scripts/check-encoding.sh                # verify only
#   bash scripts/check-encoding.sh --fix          # auto re-encode any violations
#   bash scripts/check-encoding.sh --path frontend/src
# Exit code 0 = clean, 1 = violations found.

set -euo pipefail

PATH_ROOT="."
DO_FIX=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --fix) DO_FIX=1; shift ;;
    --path) PATH_ROOT="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

EXCLUDE_DIRS=(
  "node_modules" "dist" "build" ".next" ".turbo"
  "out" "coverage" ".vite" ".cache"
  "target" "artifacts" "cache"
  "__pycache__" ".venv" "venv"
  ".git"
)

INCLUDE_EXTS=(
  "ts" "tsx" "js" "jsx" "mjs" "cjs"
  "json" "jsonc" "yml" "yaml" "toml"
  "md" "txt" "html" "css" "scss"
  "sol" "fc" "tact" "func"
  "py" "go" "rs"
  "sh" "ps1"
)

# Build find expression
EXCLUDE_EXPR=()
for d in "${EXCLUDE_DIRS[@]}"; do
  EXCLUDE_EXPR+=( -path "*/$d" -prune -o )
done

INCLUDE_EXPR=()
first=1
for ext in "${INCLUDE_EXTS[@]}"; do
  if [[ $first -eq 1 ]]; then
    INCLUDE_EXPR+=( -name "*.$ext" )
    first=0
  else
    INCLUDE_EXPR+=( -o -name "*.$ext" )
  fi
done

echo
echo "===== ION DEX Encoding Check ====="
echo "Root: $PATH_ROOT"
echo "Mode: $([[ $DO_FIX -eq 1 ]] && echo FIX || echo VERIFY-ONLY)"
echo

violations=0
scanned=0

# shellcheck disable=SC2068
while IFS= read -r -d '' f; do
  scanned=$((scanned + 1))

  # Read up to first 4 bytes for BOM detection
  read -r b0 b1 b2 b3 < <(od -An -N4 -tx1 "$f" | tr -s ' ' | sed 's/^ //')
  b0=${b0:-00}; b1=${b1:-00}; b2=${b2:-00}; b3=${b3:-00}

  issues=()

  if [[ "$b0" == "ff" && "$b1" == "fe" ]]; then
    issues+=("UTF-16 LE BOM")
  elif [[ "$b0" == "fe" && "$b1" == "ff" ]]; then
    issues+=("UTF-16 BE BOM")
  elif [[ "$b0" == "ef" && "$b1" == "bb" && "$b2" == "bf" ]]; then
    issues+=("UTF-8 BOM")
  fi

  if grep -lq $'\x00' "$f" 2>/dev/null; then
    issues+=("Contains NUL bytes")
  fi

  if [[ ${#issues[@]} -gt 0 ]]; then
    violations=$((violations + 1))
    echo "  FAIL  $f  [${issues[*]}]"

    if [[ $DO_FIX -eq 1 ]]; then
      tmp=$(mktemp)
      if [[ "$b0" == "ff" && "$b1" == "fe" ]]; then
        iconv -f UTF-16LE -t UTF-8 "$f" > "$tmp"
      elif [[ "$b0" == "fe" && "$b1" == "ff" ]]; then
        iconv -f UTF-16BE -t UTF-8 "$f" > "$tmp"
      elif [[ "$b0" == "ef" && "$b1" == "bb" && "$b2" == "bf" ]]; then
        tail -c +4 "$f" > "$tmp"
      else
        # NUL pattern: try UTF-16LE no-BOM
        iconv -f UTF-16LE -t UTF-8 "$f" 2>/dev/null > "$tmp" || tr -d '\000' < "$f" > "$tmp"
      fi
      # Normalize line endings
      tr -d '\r' < "$tmp" > "$f"
      rm -f "$tmp"
      echo "        -> FIXED"
    fi
  fi
done < <(find "$PATH_ROOT" \( ${EXCLUDE_EXPR[@]} \) -type f \( ${INCLUDE_EXPR[@]} \) -print0)

echo
echo "Scanned: $scanned files"

if [[ $violations -eq 0 ]]; then
  echo "OK - All files are UTF-8 without BOM, no NUL bytes."
  exit 0
fi

echo "Violations: $violations"
[[ $DO_FIX -eq 0 ]] && echo "Run with --fix to auto-correct."
exit 1
