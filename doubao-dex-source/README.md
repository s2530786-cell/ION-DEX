# Doubao DEX Source Bundle

Canonical in-repo location for the imported Doubao DEX architecture sources.

## Paths
- `backend-python/` — extracted Python backend reference
- `frontend-vue/` — extracted Vue frontend reference
- `doubao-vue-prototype/` — junction to the original Vue prototype directory in this repo
- `over---deduped.txt` — original deduped source bundle copied into the repo

## Purpose
Keep all Doubao source artifacts under one top-level repo path so Cursor can read/call them at any time while live code continues to be integrated into:
- `contracts/`
- `backend/`
- `frontend/`

## Canonical rule
Use `doubao-dex-source/` as the primary source/reference path for future integration tasks.
