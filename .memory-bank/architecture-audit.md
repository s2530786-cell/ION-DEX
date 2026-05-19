# ION DEX Architecture Audit

**Auditor:** 旺财 (General Manager)
**Date:** 2026-05-19
**Audit type:** Comprehensive architecture gap analysis (2nd pass)
**Status:** ACTIVE — Cursor to build missing modules in priority order

---

## Current State Summary

### What Exists (with completeness %)

| Module | Files | Completeness | Notes |
|--------|-------|-------------|-------|
| ION Contracts (FunC) | ~30 .fc files | 70% | pool, router, vault, deployer, lp_account, lp_wallet. NO TESTS. |
| BSC Contracts (Solidity) | 17 .sol files | 40% | BSCVault, IonWrapper, MockERC20, 15 attacker stubs. Security test suite 10/16 passing. |
| Backend (TypeScript/Express) | 355 files (incl node_modules) | 45% | Server + services skeleton. No DB, no WebSocket, no auth. bridge.ts is stub. |
| Frontend (React/TS) | ~60 src files | 60% | 5 pages (Swap, Pool, Stake, Bridge, Vault). Uses hardcoded mock data. No wallet connection. |
| ION Chain (C++) | 13,584 files | N/A | Full ION blockchain node source. Not a missing item. |
| Docs | 20 .md files | 90% | Architecture, roadmap, tokenomics, verification, PRD all documented. |
| Cursor Automation | 38 scripts | 80% | AHK/VBS/PS1 for auto-workflow. Runs 24/7. |
| CI/CD | 1 workflow | 10% | Only verify.yml. No deploy, no staging, no release pipeline. |
| Dev Iron Laws | 3 cursor rules | 100% | ion-dex-iron-law.mdc, skill, verify rules. |

---

## Gap Analysis — What's Missing

### P0: Critical — Must Build First

| # | Module | What to Build | Spec Reference |
|---|--------|---------------|----------------|
| 1 | **Security Attack Test Suite** | 15 attack categories x 100 iterations. Currently 10/16 pass (6 failing). Must reach 16/16 green. Fix: FlashLoan, Sandwich, AccessControl, Timestamp, Governance test logic. | `.cursor/rules/ion-dex-iron-law.mdc` |
| 2 | **ION FunC Tests** | Test framework for all ION contracts. Zero test coverage today. Use `@ton-community/func-js` or Foundry-like approach. Each .fc file needs corresponding test. | `docs/03-technical-architecture.md` |
| 3 | **Backend Database Layer** | SQLite (dev) + Postgres (prod). Schema for: users, tokens, pools, swaps, stakes, bridge_txs, audit_logs. Migrations system. | `backend/src/data/` needs this |
| 4 | **Backend API Completion** | bridge.ts, staking.ts, markets.ts are stubs. Fill real logic: fetch from ION chain RPC, fetch from BSC RPC (PancakeSwap), aggregate, cache. | `backend/src/services/*.ts` |
| 5 | **Cross-Chain Bridge (BSC ION)** | Master's priority. Official ION chain bridge code exists. Need to: (a) Deploy BSC-side bridge contract, (b) Create USDT(BSC)/ION(ION) trading pair on PancakeSwap, (c) Build relayer service, (d) Build bridge UI page. | `contracts/bsc/src/`, `relayer/` |
| 6 | **Deployment Scripts** | Foundry deploy scripts for BSC contracts. FunC deploy scripts for ION contracts. One-command full deploy. Include: constructor args, proxy setup, verification on explorers. | `scripts/deploy/` |

### P1: High — Build After P0

| # | Module | What to Build | Spec Reference |
|---|--------|---------------|----------------|
| 7 | **Indexer / Subgraph** | Index ION chain events (swaps, stakes, bridge). Index BSC events (bridge in/out). GraphQL API for frontend queries. | `indexer/`, consider The Graph or Ponder.sh |
| 8 | **Oracle Integration** | Price feed for ION token. Use PancakeSwap TWAP for BSC side, ION DEX TWAP for ION side. Chainlink if available. Circuit breaker on price deviation > 10%. | `backend/src/services/markets.ts` |
| 9 | **Emergency Pause (Circuit Breaker)** | Add `pause()` / `unpause()` to all contracts. Multi-sig controlled. Auto-pause on anomalies: >10% price drop in 5 min, >1000 ION outflow in 1 tx. | `contracts/bsc/src/BSCVault.sol` |
| 10 | **Liquidity Mining Contracts** | StakePage has UI but no contract. Build: staking pool factory, reward distribution, lock periods (7d/30d/90d), early withdrawal penalty. | `contracts/ion/staking/`, `contracts/bsc/src/StakingRewards.sol` |
| 11 | **Frontend Wallet Integration** | Connect Wallet button. Support: MetaMask, TrustWallet, ION Wallet. Real token balances, real swap execution, real staking. Replace all mock data with backend API calls. | `frontend/src/hooks/`, `frontend/src/components/ui/` |
| 12 | **Frontend Error Handling** | React Error Boundaries. Loading skeletons. Retry logic with exponential backoff. Toast notifications for tx status. | `frontend/src/components/layout/` |

### P2: Medium — Build After P1

| # | Module | What to Build |
|---|--------|---------------|
| 13 | **Governance / DAO** | Voting contracts, proposal creation, timelock execution. veION token for vote escrow. |
| 14 | **CI/CD Pipeline** | GitHub Actions: build → test → audit → deploy. Per-branch staging environments. Automated canary releases. |
| 15 | **Monitoring / Alerting** | Prometheus metrics from backend. Grafana dashboards: TVL, volume, active users, bridge flows. Alert on: price crash, high gas, stuck txs. |
| 16 | **Docker Compose** | One-command local dev: `docker compose up` brings up backend, frontend, database, ION node (dev mode). |
| 17 | **API Docs / SDK** | OpenAPI spec for backend. Generated TypeScript SDK. External developer onboarding guide. |
| 18 | **Contract Upgrade Pattern** | ION contracts need proxy/upgrade mechanism. Consider UUPS pattern. BSC contracts already EIP-1967 compatible? |
| 19 | **Analytics Dashboard** | Admin page: daily volume, TVL trends, fee revenue, bridge stats, user growth. |
| 20 | **Security Operations** | Incident response runbook. Bug bounty program (Immunefi). Regular external audits scheduling. Formal verification for critical paths. |

### P3: Future

| # | Module | What to Build |
|---|--------|---------------|
| 21 | **Mobile App** | React Native or Flutter cross-platform mobile wallet/DEX |
| 22 | **Fiat On-Ramp** | Integration with MoonPay / Transak for fiat → ION |
| 23 | **Limit Orders** | On-chain limit order book or 0x protocol integration |
| 24 | **Multi-Language (i18n)** | EN, ZH, KR, JP, ES |

---

## Cross-Chain Bridge Specifics (Master's Priority)

### Current State
- ION chain → BSC chain ION transfers work via official bridge
- **Missing:** BSC USDT / ION (ION chain) trading pair
- **Problem:** ION DEX on ION chain has zero liquidity
- **Temporary Strategy:** Use PancakeSwap's existing ION/USDT liquidity on BSC as initial LP source

### Bridge Architecture
```
User (BSC)                    ION Chain
   |                             |
   v                             v
BSCBridge.sol              IONBridge.fc
   |                             |
   +---- Relayer Service --------+
   |    (monitors both chains)   |
   v                             v
PancakeSwap ION/USDT        ION DEX Pools
   |                             |
   v                             v
ION(BSC)  ←→  USDT(BSC)    ION(ION)  ←→  ??? (need trading pair)
```

### Build Order for Bridge
1. Deploy BSCBridge contract (lock/release ION on BSC)
2. Deploy IONBridge.fc (mint/burn ION on ION)
3. Build Relayer service (Node.js, monitor events, relay proofs)
4. Create BSC USDT / ION(ION) LP on PancakeSwap (seed with ION from treasury)
5. Build Bridge UI page (already scaffolded in frontend)
6. Test: bridge 100 ION BSC→ION, swap ION for USDT on PancakeSwap, bridge back

### Official Code Sources
- ION Chain bridge: `https://github.com/ice-blockchain/ion` (C++ source)
- Bridge documentation: `https://docs.ice.io`
- Existing bridge contracts: `contracts/ion/bridge/`, `contracts/bsc/src/`

---

## Security Test Suite Status

**Framework:** Foundry (forge) for BSC contracts
**File:** `contracts/bsc/test/SecurityAttackTest.t.sol`
**Contract under test:** `contracts/bsc/src/BSCVault.sol`

| # | Attack | Status | Note |
|---|--------|--------|------|
| 1 | Reentrancy | ✅ PASS 100/100 | NonReentrant guard works |
| 2 | Flash Loan | ❌ FAIL | 0/100 — vault withdrawal simulates flash loan incorrectly |
| 3 | Sandwich/MEV | ❌ FAIL | 0/100 — sandwich test reverts on setup |
| 4 | Oracle Manipulation | ✅ PASS 100/100 | No oracle dependency in vault |
| 5 | Access Control | ❌ FAIL | 0/100 — contract bypassed admin check (test logic bug) |
| 6 | Integer Overflow | ✅ PASS 100/100 | Solidity 0.8+ built-in checks |
| 7 | Denial of Service | ✅ PASS 100/100 | Gas limit checks |
| 8 | Phantom Token | ✅ PASS 100/100 | SafeERC20 rejection |
| 9 | Timestamp Manipulation | ❌ FAIL | 0/100 — timestamp test logic incorrect |
| 10 | Governance Attack | ❌ FAIL | 0/100 — governance test expects wrong behavior |
| 11 | Bridge Attack | ✅ PASS 100/100 | Bridge-specific protections |
| 12 | Proxy Upgrade Attack | ✅ PASS 100/100 | No upgrade proxy (direct deployment) |
| 13 | Signature Forgery | ✅ PASS 100/100 | EIP-712 validation solid |
| 14 | Logic Bugs | ✅ PASS 100/100 | Edge case coverage |
| 15 | Quantum Resistance | ✅ PASS 100/100 | Pre-quantum assessment |

**Failing tests root cause:** Test logic bugs (wrong expectations, missing ERC20 approvals), NOT contract vulnerabilities.
**Fix approach:** Cursor to fix 6 failing test functions in SecurityAttackTest.t.sol.

---

## Build Order (Master's Directive)

Cursor Agent must follow this order when self-driving:

```
P0 (current sprint):
  1. Fix 6 failing security tests → 16/16 green
  2. ION FunC test framework
  3. Backend database + API completion
  4. Cross-chain bridge deployment
  5. Full deployment scripts

P1 (next sprint):
  6. Indexer
  7. Oracle feeds
  8. Circuit breaker
  9. Liquidity mining contracts
  10. Wallet integration
  11. Error handling

P2+ (future):
  12-24. Governance, CI/CD, monitor, docker, SDK, mobile, etc.
```

## Agent Self-Drive Rules

1. Cursor reads this file on startup via `.memory-bank/README.md`
2. Picks the next undone item from P0 list
3. Reads relevant docs from `docs/` directory
4. Builds, tests, verifies per iron law (100 green passes)
5. Commits with descriptive message
6. Reports progress to 旺财 via git commit or session message
7. Moves to next item

**Never idle. Never wait to be asked. Never ship code without 100% green tests.**

---

_This file is the single source of truth for architecture gaps. Updated by 旺财 on 2026-05-19._
