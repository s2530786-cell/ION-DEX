#!/usr/bin/env bash
# Start ION DEX backend + frontend (latest dev) on Linux/macOS/cloud shell.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== ION DEX local dev (branch: $(git -C "$ROOT" branch --show-current)) ==="
echo "HEAD: $(git -C "$ROOT" rev-parse --short HEAD)"

cd "$ROOT/frontend" && npm install --no-audit --no-fund
cd "$ROOT/backend" && npm install --no-audit --no-fund

pkill -f "vite --host=127.0.0.1" 2>/dev/null || true
sleep 1

if ! curl -sf http://127.0.0.1:8787/api/health >/dev/null 2>&1; then
  echo "Starting backend :8787 ..."
  cd "$ROOT/backend" && npm run start -- --port 8787 &
  sleep 2
fi

echo "Starting frontend :3001 ..."
cd "$ROOT/frontend" && exec npm run dev:local
