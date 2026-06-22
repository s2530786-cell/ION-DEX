# Doubao DEX Integration Audit

**Date:** 2026-05-22  
**Branch:** `cursor-work-2026-05-23`  
**Canonical bundle:** `reference/doubao-dex/`

## Summary

Doubao architecture is **partially integrated**. Live stack is **React + Vite frontend**, **TypeScript Express backend**, and **BSC Solidity contracts**. Vue/Python runtime paths from the bundle are reference-only.

| Layer | Status |
|-------|--------|
| Contracts (`contracts/bsc/`) | Integrated (prior work); forge not available in this agent shell |
| Backend live API (`backend/src/`) | Partial — quotes/tokens/staking/bridge use live helpers where implemented; burn/bridge/domain remain mocked with explicit provenance |
| Frontend (`frontend/src/`) | Partial — Doubao trade/approve/vault surfaces + compliance UI; many flows scaffold/demo |
| Python OpenClaw (`reference/doubao-dex/backend-python/`) | Reference only (moved out of `backend/openclaw/`) |

## Integration commits (this wave)

| Stage | Commit | Message |
|-------|--------|---------|
| 1 | `34ad82f1` | feat(backend): replace hardcoded quotes with geckoterminal live data |
| 2 | `265fc434` | fix(frontend): audit doubao react integration and mark scaffold boundaries |
| 3 | `21093087` | feat(frontend): add risk confirm and legal surfaces from doubao bundle |
| 4 | `89a38b3d` | chore(config): centralize required integration values and remove silent placeholders |
| 5 | `5bdb05e0` | refactor(backend): separate live integration from doubao reference code |
| 6 | _(this doc)_ | docs(audit): summarize doubao integration status and remaining blockers |

## Truly integrated (live behavior)

### Backend
- **Quotes:** `backend/src/services/quotes.ts` → `backend/src/services/live/quotes-live.ts` (GeckoTerminal ION/BNB pool, provenance `geckoterminal` or explicit `test-mock` in tests)
- **Env/config:** `backend/src/config/load-env.ts`, `server-config.ts`, official addresses in `backend/src/constants/official-ion-addresses.ts`
- **Live modules (TASK 1):** `backend/src/services/live/tokens-live.ts`, `staking-live.ts`, `bridge-live.ts`
- **Upstream:** `backend/src/upstream/geckoterminal.ts`

### Frontend
- **Routing/pages:** Trade Pro, Approve Manager, Vault Stake (`frontend/src/pages/TradeProPage.tsx`, etc.)
- **Wallet aggregation:** `frontend/src/hooks/useWalletAggregator.ts` (EVM live when connected)
- **Central config:** `frontend/src/lib/integrationConfig.ts` — BSC chain id, official ION/burn, demo fallbacks, API base default `8788`
- **Compliance UI:** `RiskModal`, `TradeConfirm`, `FooterLegal`
- **USDT address fix:** `frontend/src/lib/bridgeContracts.ts` checksum corrected to `...6099027B3197955`

### Contracts
- BSC contracts under `contracts/bsc/` (verified historically with forge; see verification section)

## Scaffold / demo only (honest boundaries)

### Frontend
- **TradeProPage:** demo depth book, preview order submit (no chain tx)
- **ApproveManagerPage:** `DEMO_APPROVAL_CONTRACTS` — not on-chain allowance scan
- **VaultStakePage:** requires `VITE_VAULT_CONTRACT_ADDRESS`; no deposit tx wiring
- **useWalletAggregator:** `ION_CHAIN_ID_SCAFFOLD` (2026) for ION wallet branch
- **DEMO_TICKER_FALLBACK:** labeled `(demo)` in display strings when API unavailable
- **BusinessPages trade desk / grid / burn copy:** explicit demo/local-seed labels in UI
- **RiskModal / TradeConfirm:** preview-only trade confirm default

### Backend
- **Burn summary:** `backend/src/services/burn.ts` — Phase 3 mock with `provenance[].status: "mocked"`
- **Bridge routes / domain / profile:** mock adapters with provenance (see gateway tests)
- **Market tickers:** may use cache/mock adapters depending on env/upstream

### Reference (not runtime)
- `reference/doubao-dex/backend-python/openclaw/*.py` — imports missing `core.*`, `spiders.*`
- `reference/doubao-dex/backend-python/api/stats_api.py` — FastAPI + SQL, hardcoded TVL default

## Files changed (integration wave)

### Stage 1
- `backend/src/services/quotes.ts`
- `backend/src/services/live/quotes-live.ts` (new)
- `backend/tests/gateway.test.ts`

### Stage 2
- `frontend/src/components/ui/ScaffoldNotice.tsx` (new)
- `frontend/src/pages/TradeProPage.tsx`, `ApproveManagerPage.tsx`, `VaultStakePage.tsx`
- `frontend/src/hooks/useWalletAggregator.ts`, `App.tsx`, `AppShell.tsx`, `BusinessPages.tsx`, `EvmWalletProvider.tsx`

### Stage 3
- `frontend/src/components/compliance/RiskModal.tsx`, `TradeConfirm.tsx` (new)
- `frontend/src/components/layout/FooterLegal.tsx` (new)
- `frontend/src/App.tsx`, `AppShell.tsx`, `TradeProPage.tsx`

### Stage 4
- `frontend/src/lib/integrationConfig.ts`, `integrationConfig.types.ts` (new)
- `frontend/src/lib/ionApi.ts`, `bridgeContracts.ts`
- `frontend/src/pages/SwapPage.tsx`, `PoolPage.tsx`, `DashboardPage.tsx`, `BusinessPages.tsx`, `ApproveManagerPage.tsx`, `VaultStakePage.tsx`
- `frontend/src/components/layout/AppShell.tsx`, `hooks/useWalletAggregator.ts`

### Stage 5
- Moved: `backend/openclaw/*` → `reference/doubao-dex/backend-python/openclaw/`
- Moved: `backend/api/stats_api.py` → `reference/doubao-dex/backend-python/api/stats_api.py`
- `reference/doubao-dex/backend-python/README.md`, `reference/doubao-dex/README.md`

## Reference bundle sources used

- `reference/doubao-dex/source/over---deduped.txt` — RiskModal, TradeConfirm, FooterLegal, trade/vault/approve UX
- `reference/doubao-dex/backend-python/` — relocated OpenClaw + stats API sketches (originally under `backend/`)

## Verification commands and results

| Command | Result |
|---------|--------|
| `cd frontend && npm run build` | **PASS** (tsc + vite build) |
| `cd backend && npm run build` | **PASS** |
| `cd backend && npx tsc --noEmit` | **PASS** |
| `cd backend && npm run test` | **PASS** — 26/26 tests |
| `cd contracts/bsc && forge build` | **SKIP** — `forge` not installed on this Windows agent shell |
| `cd contracts/bsc && forge test` | **SKIP** — same |
| `python -m py_compile reference/doubao-dex/backend-python/**/*.py` | **PASS** (syntax only; imports not validated) |
| Grep live frontend for `0x你的`, `ion-mainnet-burn-source-placeholder`, `8787` | **PASS** — no matches in `frontend/src` |

## Remaining blockers

1. **Forge unavailable** in current shell — re-run `forge build` / `forge test` on a machine with Foundry installed.
2. **ION mainnet burn indexer** — `backend/src/services/burn.ts` still returns mock totals; `ionBurnSource` string should become a real indexer id when available.
3. **Vault / order book contracts** — `VITE_VAULT_CONTRACT_ADDRESS`, BSC vault/bridge env vars unset → vault/trade remain preview.
4. **Orphan Python monolith dumps** — `backend/config.py` and `backend/utils/scheduler_task.py` (~20k lines each) remain in repo root `backend/` but are **not** used by Node `backend/src/`; should be relocated to `reference/doubao-dex/backend-python/` in a follow-up.
5. **Bridge / staking live wiring** — partial; gateway tests accept mock provenance for several routes.
6. **100-pass full verify gate** — project rule requires extended green runs before next feature tranche (not executed in this audit session).

## Recommended next steps

1. Install Foundry and confirm `contracts/bsc` green.
2. Move `backend/config.py` + `backend/utils/scheduler_task.py` to reference tree or delete if duplicate of bundle.
3. Wire burn API to BSC indexer + official ION burn source per `docs/ion-official-burn-reference.md`.
4. Set production env: `VITE_ION_API_BASE_URL`, `VITE_VAULT_CONTRACT_ADDRESS`, bridge vault addresses.
5. Run `scripts\verify-full-save-log.cmd --no-pause` after env is stable.
