# ION DEX Architecture Audit — Complete Findings

**Auditor:** 旺财 (General Manager)
**Date:** 2026-05-19 14:40 CST
**Status:** ACTIVE — Cursor to build missing modules in priority order

## 🎯 PRIORITY ORDER (Master's Directive)

| Priority | Count | Key Items |
|----------|-------|-----------|
| 🔴 **P0** | 6 | Security tests (10/16→16/16), ION FunC tests, Backend DB, API real integration, Cross-chain bridge (BSC USDT↔ION), Deploy scripts |
| 🟠 **P1** | 6 | Indexer, Oracle, Circuit breaker, Liquidity mining contracts, Wallet integration, Error handling |
| 🟡 **P2** | 8 | Governance DAO, CI/CD, Monitoring, Docker, SDK, Contract upgrades, Analytics dashboard, Security operations |
| 🔵 **P3** | 4 | Mobile responsive, Fiat onramp, Limit orders, Multi-language |

**Rule:** Build in P0→P1→P2→P3 order. Never skip a priority level.

**Blueprint pack (2026-05-19):** Index `docs/09-blueprint-index.md` → core `docs/10`–`17`, extension `docs/18`–`22`. Milestones: `docs/17`. Security parity: `docs/verification-six-pillars.md`.

---

## CORE MISSION (Master's Directive)

ION DEX exists for ONE reason: **ION chain has no native DEX and ION(ION) is not listed on any CEX.**
Without ION DEX, ION tokens have NOWHERE to trade. The chain is dead without liquidity.

**Bottom line: ION DEX = ION ecosystem's sole liquidity lifeline. Success or failure of the entire chain depends on this project.**

---

## Deep Investigation Results

### 1. Backend (Phase 3) — COMPLETE MOCK, ZERO REAL DATA

**Files:** 355 (incl node_modules), 45% done in form only
**Status:** Every service returns hardcoded mock data. Zero real integration.

| Service | File | Status | What it returns |
|---------|------|--------|-----------------|
| bridge.ts | `backend/src/services/bridge.ts` | 🟡 Stub | Hardcoded route list with `status: "mock"`, `relayerStatus: "mocked"` |
| markets.ts | `backend/src/services/markets.ts` | 🟡 Mock | Hardcoded ION price $0.42, never changes |
| staking.ts | `backend/src/services/staking.ts` | 🟡 Mock | Hardcoded 25% APR, mock staked amounts |
| burn.ts | `backend/src/services/burn.ts` | 🟡 Mock | Hardcoded burn data, `source: "mock"` |
| tokens.ts | `backend/src/services/tokens.ts` | 🟡 Mock | 4 hardcoded tokens (ION, USDT, wTON, ETH) |
| config.ts | `backend/src/services/config.ts` | 🟡 Mock | All feature flags, `bridgeTransfers: false` |
| domain.ts | `backend/src/services/domain.ts` | 🟡 Mock | Hardcoded domain resolution |
| profile.ts | `backend/src/services/profile.ts` | 🟡 Mock | Demo profile with fake wallet |

**Missing for real operation:**
- ~~Database layer~~ **P0-3 DONE** (`backend/db/migrations/`) — services still mock until P0-4
- CMC API integration — **P0-4** / `docs/10-config-and-environments.md`
- BSC RPC connection (PancakeSwap data fetch)
- ION chain RPC connection
- WebSocket for real-time updates
- Authentication / session management
- Rate limiting
- `.env.example` (no env template)

### 2. Bridge (Phase 7) — NOTHING BUILT, ARCHITECTURE READY

**ION Chain Side (EXISTS in ION mainnet):**
- `votes-collector.fc` — Multi-sig validator bridge (config param 72)
- `multisig-code.fc` — n-of-k signing wallet (config param 71)
- Both use ECDSA (secp256k1) signatures
- Bridge flow: validators observe events → sign → when k signatures → execute

**BSC Side (MISSING):**
- No `BridgeVerifier.sol` (called out in architecture docs but file doesn't exist)
- OpenZeppelin `BridgeERC20.sol` is available in lib (can be extended)
- Need: BSC multi-sig bridge contract mirroring ION's `multisig-code.fc`
- Need: BSC event collector equivalent to `votes-collector.fc`

**Relayer Service (MISSING):**
- `backend/src/services/bridge.ts` is pure mock
- `relayer/` directory has 1 file (`.gitkeep`)
- Need: Node.js service monitoring both chains, relaying events

**LP/Token (MISSING):**
- No PancakeSwap router/factory addresses in code
- No LP creation script
- BSC ION token address: PENDING (in docs)

**Frontend Bridge Page:**
- Shell in `BusinessPages.tsx` (no standalone `BridgePage.tsx`) — no real bridge tx yet
- Operations design: `docs/14-bridge-operations.md`

### 3. Frontend (Phase 5) — 60% UI, ZERO REAL DATA, NO WALLET

| Page | File | Status |
|------|------|--------|
| Dashboard | `DashboardPage.tsx` | ✅ Built, uses mock data |
| Swap | `SwapPage.tsx` | ✅ Built, no real swap execution |
| Pool | `PoolPage.tsx` | ✅ Built, no real pool interaction |
| Stake | `StakePage.tsx` | ✅ Built, no staking contract |
| Bridge | `BusinessPages.tsx` shell | ✅ UI shell only, no on-chain |
| Vault | `VaultPage.tsx` | ✅ Basic shell |

**Critical missing:**
- Wallet connection — zero code. No MetaMask, no TrustWallet, no ION Wallet
- Real data hooks — `useApiResource.ts` fetches from backend mock, not chain
- Error boundaries — none
- Transaction tracking — none
- Loading skeletons — none

### 4. Contracts (Phase 2) — 40% BSC, 70% ION, NO TESTS ON ION

**ION Contracts (FunC) — 0% TESTED:**
| Contract | Exists? | Tested? | Notes |
|----------|---------|---------|-------|
| `router.fc` | ✅ | ❌ | Swap routing |
| `pool.fc` | ✅ | ❌ | AMM pool (Constant Product?) |
| `vault.fc` | ✅ | ❌ | Multi-sig vault |
| `deployer.fc` | ✅ | ❌ | Pool deployer |
| `lp_account.fc` | ✅ | ❌ | LP token account |
| `lp_wallet.fc` | ✅ | ❌ | LP wallet |
| `common/*.fc` | ✅ | ❌ | Library files (errors, gas, op, params, utils) |
| `DexRouter.fc` | ❌ | — | Architecture calls for this, not in code |
| `IonAmmPool.fc` | ❌ | — | Architecture calls for this |
| `OracleAdapter.fc` | ❌ | — | Architecture calls for this |
| `StakingPool.fc` | ❌ | — | Architecture calls for this |

**BSC Contracts (Solidity) — 40% TESTED:**
| Contract | Exists? | Tested? | Notes |
|----------|---------|---------|-------|
| `BSCVault.sol` | ✅ | 10/16 green | Multi-sig timelock vault |
| `IonWrapper.sol` | ✅ | ❌ | Wrapped ION on BSC? |
| `BridgeVerifier.sol` | ❌ | — | Architecture calls for this |
| `BSCFeeVault.sol` | ❌ | — | Architecture calls for this |

**Security Test Suite Status (Foundry/Forge):**
- 15 attack categories × 100 iterations each
- **16/16 PASS** (1500/1500) — `forge test --match-contract SecurityAttackTest`
- ION: `func-security-audit.mjs` 1500 + `func-contract-test.mjs` (static/TVM parity gap documented in `docs/verification-six-pillars.md`)

### 5. Infrastructure & DevOps — NEARLY EMPTY

| Directory | Files | Content |
|-----------|-------|---------|
| `infra/` | 1 (`.gitkeep`) | Empty |
| `relayer/` | 1 (`.gitkeep`) | Empty |
| `sentinel/` | 1 (`.gitkeep`) | Empty |
| `indexer/` | 1 (`.gitkeep`) | Empty |
| `.github/workflows/` | 1 | Only `verify.yml` (basic build check) |
| `scripts/` | 38 | Cursor automation (AHK/VBS/PS1), no deploy scripts |

**Missing:**
- Docker Compose (no container orchestration)
- Kubernetes configs
- CI/CD pipeline (build → test → audit → deploy)
- Deployment scripts (Foundry for BSC, FunC for ION)
- Environment config files (dev/staging/prod)
- Monitoring (Prometheus/Grafana)
- Alerting rules
- Secrets management

### 6. Official ION Ecosystem Repos (NOT YET INTEGRATED)

From `docs/01-official-addresses-and-assumptions.md`:
| Repo | Purpose | Status |
|------|---------|--------|
| `ice-blockchain/ion` | ION node, validator, lite-client | Source in `ion/` dir |
| `ice-blockchain/ion-http-api` | HTTP API for ION nodes | NOT cloned |
| `ice-blockchain/ion-indexer` | Block/tx/message/NFT/Jetton indexer | NOT cloned |
| `ice-blockchain/heimdall` | ION Identity (account mgmt) | NOT cloned |
| `ice-blockchain/ion-framework` | Flutter ION Framework (wallet) | NOT cloned |
| `ice-blockchain/ion-address-book` | Official contract addresses | NOT cloned |

All marked "Pending" — need confirmation before production.

### 7. External Dependencies (NOT CONFIGURED)

| Dependency | Use | Address/Config |
|-----------|-----|----------------|
| PancakeSwap Router V2 (BSC) | ION/USDT swaps | `0x10ED43C718714eb63d5aA57B78B54704E256024E` |
| PancakeSwap Factory V2 (BSC) | LP pair creation | `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73` |
| USDT BSC | Trading pair | `0x55d398326f99059fF775485246999027B3197955` |
| BSC ION token | Bridge target | PENDING (from docs) |
| CMC API | Market data | PENDING key |
| ION mainnet RPC | Chain reads | PENDING endpoint |
| ION testnet RPC | Testnet reads | PENDING endpoint |

---

## Complete Gap Summary (24 items)

> Detailed design for gaps 7–20: see `docs/12`–`docs/16`. Release alignment: `docs/17`.

### P0 — Critical: Must Build First (6 items)

1. ~~Fix 6 failing security tests~~ **DONE** 16/16 on `SecurityAttackTest.t.sol`
2. ~~ION FunC test framework~~ **DONE** `func-contract-test.mjs` + 1500 static audit
3. ~~Backend database layer~~ **DONE** SQLite/Postgres schema + migrations
4. **Backend real data integration** — replace ALL mock data with chain RPC + CMC
5. **Cross-chain bridge** — BSC bridge contract + relayer + LP creation + bridge UI
6. **Deployment scripts** — Foundry (BSC) + FunC (ION) one-click deploy

### P1 — High Priority (6 items)

7. **Indexer** — Clone official `ion-indexer`, deploy, integrate with backend
8. **Oracle** — Price feed (PancakeSwap TWAP initially), circuit breaker
9. **Circuit breaker** — Emergency pause on all contracts, multi-sig controlled
10. **Liquidity mining** — Staking contracts (ION + LP), reward distribution
11. **Wallet integration** — MetaMask, TrustWallet, ION Wallet, WalletConnect
12. **Frontend error handling** — Error boundaries, loading states, tx tracking

### P2 — Medium Priority (8 items)

13. **Governance/DAO** — Voting, proposals, timelock, veION token
14. **CI/CD pipeline** — Build → test → audit → deploy automation
15. **Monitoring** — Prometheus + Grafana, TVL/volume/health dashboards
16. **Docker Compose** — `docker compose up` for full local dev
17. **API Docs/SDK** — OpenAPI spec, TypeScript SDK for integrators
18. **Contract upgrades** — UUPS proxy pattern for upgradeable contracts
19. **Analytics** — Admin dashboard: volume, TVL, users, bridge flows
20. **Security ops** — Incident response runbook, bug bounty (Immunefi), formal verification

### P3 — Future (4 items)

21. **Mobile app** — React Native / Flutter
22. **Fiat on-ramp** — MoonPay / Transak integration
23. **Limit orders** — On-chain limit order book
24. **i18n** — Multi-language (EN, ZH, KR, JP, ES)

---

## Bridge Architecture (Detailed)

### Components Needed (from investigation)

```
 ION Chain (exists) BSC (needs)
 ==================== ===========
 
Event occurs → Validators observe → Sign tx for BSC side
 multisig-code.fc BSCBridge.sol (new)
 (config param 71) (extends OZ BridgeERC20)
 → → votes-collector.fc BSCEventCollector.sol (new)
 (config param 72) (mirrors votes-collector)
 → → Execute ION action Execute BSC action
 → → Relayer Service (new)
 Node.js, monitors both chains
 Relays events + signatures
 → PancakeSwap ION/USDT LP
 (create via Factory, seed ION)
```

### Building Blocks Already Available
- OZ `BridgeERC20.sol` — ready to extend (in `contracts/bsc/lib/`)
- OZ `BridgeFungible.sol` — abstract base with `_onSend`/`_onReceive`
- ION `multisig-code.fc` — reference implementation for BSC mirror
- ION `votes-collector.fc` — reference for signature collection

### PancakeSwap Integration (BSC Mainnet)
- Router: `0x10ED43C718714eb63d5aA57B78B54704E256024E`
- Factory: `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73`
- USDT: `0x55d398326f99059fF775485246999027B3197955`
- ION (BSC): PENDING — needs official confirmation

### LP Creation Flow
1. Deploy BSCBridge.sol
2. Deploy Relayer service
3. Bridge ION from ION chain → BSC (test small amount)
4. Calculate optimal ION/USDT price ratio
5. Create LP via PancakeSwap Factory `createPair()`
6. Add liquidity with balanced ION + USDT
7. Monitor LP health (price impact, TVL)

---

## Current Security Test Suite Status (16 total)

| # | Attack | Status | Note |
|---|--------|--------|------|
| 1 | Reentrancy | ✅ 100/100 | NonReentrant guard verified |
| 2 | Flash Loan | ❌ 0/100 | Test logic bug (fix: ERC20 approvals) |
| 3 | Sandwich/MEV | ❌ 0/100 | Test reverts on setup |
| 4 | Oracle Manipulation | ✅ 100/100 | No oracle dependency in vault |
| 5 | Access Control | ❌ 0/100 | Test logic bug (expectRevert wrong) |
| 6 | Integer Overflow | ✅ 100/100 | Solidity 0.8+ built-in checks |
| 7 | Denial of Service | ✅ 100/100 | Gas limit verified |
| 8 | Phantom Token | ✅ 100/100 | SafeERC20 rejection |
| 9 | Timestamp Manipulation | ❌ 0/100 | Test logic incorrect |
| 10 | Governance Attack | ❌ 0/100 | Test expectations wrong |
| 11 | Bridge Attack | ✅ 100/100 | Bridge protections verified |
| 12 | Proxy Upgrade | ✅ 100/100 | Direct deployment pattern |
| 13 | Signature Forgery | ✅ 100/100 | EIP-712 validation solid |
| 14 | Logic Bugs | ✅ 100/100 | Edge case coverage |
| 15 | Quantum Resistance | ✅ 100/100 | Pre-quantum assessment |
| — | FULL_SUITE | ❌ | Fails because any sub-test fails |

---

## Agent Self-Drive Build Order

Cursor reads from this file on startup. Build in strict order:

```
PHASE NOW (P0) — automation reads `- [ ]` below (first unchecked wins):

- [x] **P0-1** Fix 6 failing security tests — DONE 16/16; forge test --match-contract SecurityAttackTest all green (1500/1500)
- [x] **P0-2** ION FunC test framework — scripts/func-contract-test.mjs (compile-func 22/22 + golden regression)
- [x] **P0-3** Backend database layer — SQLite/Postgres schema + migrations
- [ ] **P0-4** Backend real data integration — replace mock services with RPC + CMC adapters
- [ ] **P0-5** Cross-chain bridge — BSC contracts + relayer + LP + Bridge UI shell
- [ ] **P0-6** Deployment scripts — Foundry (BSC) + FunC (ION) one-click deploy

Legacy numbered list (same order):

 1. Fix 6 failing security tests — forge test all green
 2. ION FunC test framework — every .fc contract tested
 3. Backend database + real API — no more mock data
 4. BSC bridge contracts — BSCBridge.sol + BridgeVerifier.sol
 5. Relayer service — Node.js, monitor both chains
 6. PancakeSwap LP — create pair + seed liquidity
 7. Bridge UI — BusinessPages.tsx shell only (no BridgePage.tsx; real tx per docs/14)
 8. Full deploy scripts — one-command deploy all

PHASE NEXT (P1):
 9. Indexer (clone official ion-indexer)
 10. Oracle (PancakeSwap TWAP)
 11. Circuit breaker
 12. Staking contracts
 13. Wallet integration
 14. Error handling

PHASE LATER (P2-P3):
 15-24. Governance, CI/CD, monitoring, Docker, SDK, analytics, security, mobile
```

## Key References

- PancakeSwap Router: `0x10ED43C718714eb63d5aA57B78B54704E256024E`
- PancakeSwap Factory: `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73`
- USDT (BSC): `0x55d398326f99059fF775485246999027B3197955`
- ION Bridge (chain): config params 71 (multisig) + 72 (votes-collector)
- OZ BridgeERC20: `contracts/bsc/lib/openzeppelin-contracts/contracts/crosschain/bridges/BridgeERC20.sol`
- Security tests: `contracts/bsc/test/SecurityAttackTest.t.sol`
- Foundry: `D:\openclaw-tools\foundry\bin`
- ION RPC: `https://api.mainnet.ice.io/http/v2/` (needs proxy)

**Never idle. Never wait to be asked. Build, test, commit, repeat.**

---

_Last updated: 2026-05-19 14:40 CST by 旺财_


## Official ION Ecosystem Repos (Cloned by Master)

See full index: [.memory-bank/official-repos-index.md](.memory-bank/official-repos-index.md)

**Critical: ALL bridge code already exists locally. DO NOT write from scratch.**

---

## 🌉 Bridge Deployment — Master's Shortest Path (2026-05-19 22:02)

### Target
```
ION链 ION → 官桥 → ION(BSC) → PancakeSwap ION/USDT LP → 可交易
```

### 3 Steps
1. **部署 Bridge.sol (BSC)** — 从 `D:\openclaw-tools\ice-blockchain-bridge\solidity\` 取代码
2. **启动 Relayer** — Node.js 监控双链（ION votes-collector ↔ BSC Bridge events）
3. **创建 PancakeSwap LP** — ION(BSC)/USDT on BSC

### PancakeSwap BSC Mainnet
- Router V2: `0x10ED43C718714eb63d5aA57B78B54704E256024E`
- USDT: `0x55d398326f99059fF775485246999027B3197955`

### ION 链（已就绪）
- multisig-code.fc / config_param(71)
- votes-collector.fc / config_param(72)

### Key Files
- Bridge code: `D:\openclaw-tools\ice-blockchain-bridge\solidity\`
- Deploy scripts: `D:\openclaw-tools\ion-bridge-deploy\`
- Ecosystem docs: `.cursor/skills/ion-official-source/SKILL.md`

