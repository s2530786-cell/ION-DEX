# Doubao backend Python reference (non-runtime)

These modules were extracted from the Doubao DEX bundle for architecture reference only.

**They are not imported by the live Node.js backend** (`backend/src/server.ts`, port 8787/8788).

## Why not in `backend/openclaw/`?

| Issue | Detail |
|-------|--------|
| Missing Python app shell | Imports `core.*`, `spiders.*` modules that do not exist in this repo |
| Wrong stack | Live API is TypeScript/Express; these expect FastAPI + SQLAlchemy |
| Placeholder config | `config.py` defaults include `0x你的主钱包地址` and empty contract fields |
| Fake / hardcoded data | `stats_api.py` uses `tvl = 1000000  # 临时默认值` |
| No deployment path | No `requirements.txt`, no process supervisor, no tests in this tree |

## Layout

- `openclaw/` — OpenClaw ops sketch (alert, emergency pause watch, price oracle, chain settle)
- `api/stats_api.py` — FastAPI stats routes (IL calculator, LP APY, treasury) requiring DB tables not present here

## Smallest validation performed

```bash
python -m py_compile reference/doubao-dex/backend-python/openclaw/*.py
python -m py_compile reference/doubao-dex/backend-python/api/stats_api.py
```

Syntax may pass; **imports will fail** until the original Python monolith dependencies are restored.

## Live equivalents (TypeScript)

| Reference module | Live direction |
|------------------|----------------|
| `price_oracle.py` | `backend/src/services/live/quotes-live.ts` + GeckoTerminal |
| `config.py` wallets/contracts | `backend/src/constants/official-ion-addresses.ts` + `.env` |
| `stats_api.py` IL math | Can port formula to TS when LP indexer exists |
| `chain_settle.py` | Future: BSC order book contract + indexer (not wired) |
