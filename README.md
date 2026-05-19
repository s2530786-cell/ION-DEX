# ION DEX

ION DEX is a planned full-stack Web3 trading and ecosystem portal for Ice Open Network.

It is designed to include:

- Swap and professional spot trading.
- Limit orders and on-chain spot grid strategies.
- Liquidity pools and LP staking.
- Official, DEX, and ecosystem staking analytics.
- Dual-chain burn analytics for BSC ION and ION mainnet ION.
- ION Chain and BSC bridge flows.
- ION DNS domain resolution, transfers, and marketplace.
- ION ID / KYC Pass integration.
- AI market analysis, risk scoring, and AI sentinel monitoring.
- Treasury, fee distribution, transparency, and admin operations.
- Premium 5D futuristic neon UI with aurora and galaxy backgrounds.

## Current Stage

**Active development — contracts compiled, data stack live, frontend in progress.**

### Completed
- [x] **Smart Contracts (ION)**: FeeDistributor.fc (FunC, 796 bytes, compiled ✅)
- [x] **Smart Contracts (BSC)**: BSCFeeVault.sol + BSCVault.sol + IonWrapper.sol (Foundry/forge-std, 16 attack vectors implemented)
- [x] **Data Stack**: 6-engine real-time price feed (PancakeSwap + Binance + CMC + GeckoTerminal + DexScreener + ION Indexer v3) — all free, zero API cost
- [x] **Price Verification**: 3-source cross-check (CMC $0.0001389 | GeckoTerminal $0.0001411 | DexScreener $0.0001398) — deviation <1.5%
- [x] **ION Domain Resolution**: Forward (.ion→address) + Reverse (address→.ion) via ION Indexer v3 DNS API
- [x] **Bridge Security**: Cross-chain decimal conversion, lock/release status tracking, BSC 12-confirmation finality
- [x] **Performance**: Debounce, throttle, async queue, and rate-limiter hooks for high-frequency DEX trading
- [x] **Wallet Providers**: IonWalletProvider.tsx + EvmWalletProvider.tsx (no mock/placeholder)
- [x] **Pages**: SwapPage.tsx, BridgePage.tsx, PoolPage.tsx, StakePage.tsx, DashboardPage.tsx
- [x] **UI Components**: NeonButton, NeonCard, AppShell, AuroraGalaxyBackground, MarketChart, DataSourceBadge
- [x] **Security**: Full BSC test suite — Reentrancy, FlashLoan, Sandwich, Oracle, AccessControl, Bridge, DoS, Governance, Overflow, PhantomToken, Proxy, Quantum, Signature, Timestamp attackers

### In Progress
- [ ] ION DEX core contracts (IONX token, AMM pool, router)
- [ ] Backend API with multi-source caching (TTL 15s)
- [ ] Security test framework (1000 tests/vector)
- [ ] CI/CD pipeline

**Commit history**: 62 commits across architecture, contracts, data tools, and frontend.

## Documentation

- `docs/00-project-overview.md`
- `docs/01-official-addresses-and-assumptions.md`
- `docs/02-tokenomics-and-fees.md`
- `docs/03-technical-architecture.md`
- `docs/04-development-roadmap.md`
- `docs/05-product-prd.md`
- `docs/06-page-flow-and-user-journeys.md`

## Planned Repository Structure

```text
ion-dex-nuke/
├── ion/                    # upstream ION reference / node sources (Ice Open Network)
├── contracts/
│   ├── ion/
│   └── bsc/
├── frontend/
├── backend/
├── indexer/
├── relayer/
├── sentinel/
├── scripts/
├── infra/
├── docs/
├── audits/
└── README.md
```

The `ion/` directory is **not committed** here (it is a full upstream Git repo). Clone it beside this tree for local reference:

```bash
git clone https://github.com/ice-blockchain/ion ion
```

GitHub Actions **ION DEX verify** (`.github/workflows/ion-dex-verify.yml`) validates `frontend/` plus repo scripts only; it does not build `ion/`.

## Build Order

1. Freeze assumptions and official addresses.
2. Build UI design system.
3. Implement contract foundations.
4. Build backend foundation.
5. Build indexers.
6. Add oracle, keeper, and bridge services.
7. Build frontend product pages.
8. Add Domain and ION ID modules.
9. Add AI market and sentinel modules.
10. Add admin, transparency, testing, audits, and launch workflows.
