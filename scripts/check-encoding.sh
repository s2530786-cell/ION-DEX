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

echo
echo "===== ION DEX Encoding Check ====="
echo "Root: $PATH_ROOT"
echo "Mode: $([[ $DO_FIX -eq 1 ]] && echo FIX || echo VERIFY-ONLY)"
echo

python3 - "$PATH_ROOT" "$DO_FIX" <<'PY'
import os
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
do_fix = sys.argv[2] == "1"

include_exts = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".json", ".jsonc", ".yml", ".yaml", ".toml",
    ".md", ".txt", ".html", ".css", ".scss",
    ".sol", ".fc", ".tact", ".func",
    ".py", ".go", ".rs",
    ".sh", ".ps1",
}
exclude_dirs = {
    "node_modules", "dist", "build", ".next", ".turbo",
    "out", "coverage", ".vite", ".cache",
    "target", "artifacts", "cache",
    "__pycache__", ".venv", "venv",
    "ion", ".git",
}

def included(path: Path) -> bool:
    return path.suffix in include_exts or path.name == ".env" or path.name.startswith(".env.")

def decode_for_fix(data: bytes) -> str:
    if data.startswith(b"\xff\xfe"):
        return data[2:].decode("utf-16le")
    if data.startswith(b"\xfe\xff"):
        return data[2:].decode("utf-16be")
    if data.startswith(b"\xef\xbb\xbf"):
        return data[3:].decode("utf-8")
    if b"\x00" in data:
        try:
            return data.decode("utf-16le").replace("\x00", "")
        except UnicodeDecodeError:
            return data.replace(b"\x00", b"").decode("utf-8", errors="replace")
    return data.decode("utf-8")

violations = []
fixed = []
scanned = 0

for current, dirnames, filenames in os.walk(root):
    dirnames[:] = [name for name in dirnames if name not in exclude_dirs]
    for filename in filenames:
        path = Path(current) / filename
        if not included(path):
            continue
        scanned += 1
        data = path.read_bytes()
        if not data:
            continue
        issues = []
        if data.startswith(b"\xff\xfe"):
            issues.append("UTF-16 LE BOM")
        elif data.startswith(b"\xfe\xff"):
            issues.append("UTF-16 BE BOM")
        elif data.startswith(b"\xef\xbb\xbf"):
            issues.append("UTF-8 BOM")
        if b"\x00" in data:
            issues.append("Contains NUL bytes")
        if not issues:
            continue

        rel = path.relative_to(root).as_posix()
        violations.append((rel, issues))
        print(f"  FAIL  {rel}  [{', '.join(issues)}]")

        if do_fix:
            text = decode_for_fix(data).replace("\r\n", "\n").replace("\r", "\n")
            path.write_text(text, encoding="utf-8", newline="\n")
            fixed.append(rel)
            print("        -> FIXED")

print()
print(f"Scanned: {scanned} files")

if not violations:
    print("OK - All files are UTF-8 without BOM, no NUL bytes.")
    raise SystemExit(0)

if do_fix:
    print()
    print(f"FIXED {len(fixed)} files.")
    raise SystemExit(0)

print(f"Violations: {len(violations)}")
print("Run with --fix to auto-correct.")
raise SystemExit(1)
PY
