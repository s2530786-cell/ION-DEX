# Doubao DEX Reference

This folder keeps the imported Doubao DEX reference assets inside the main repository so Cursor can find them by opening only this workspace.

## Paths
- `reference/doubao-dex/source/over---deduped.txt` — full original extracted source bundle
- `reference/doubao-dex/backend-python/` — backend Python reference code
- `reference/doubao-dex/frontend-vue/` — Vue frontend reference code
- `reference/doubao-dex/doubao-vue-prototype/` — original Vue prototype snapshot

## Live integration paths
The current live repo code is merged into:
- `contracts/bsc/`
- `backend/src/` (Node.js / TypeScript API)
- `frontend/src/` (React + Vite)

Python reference modules live under `reference/doubao-dex/backend-python/` only — not production runtime.

Use this folder as reference source, not as production runtime code.
