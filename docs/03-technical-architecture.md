# Technical Architecture

ION DEX is a multi-layer DeFi platform. Contracts hold and settle assets. Backend services index,
simulate, analyze, and automate. Frontend provides wallet-driven user operations.

> **Last updated:** 2026-06-24
> **Contract count:** 101 unique contracts/interfaces (excluding lib dependencies)
> **Forge build:** 93 files, Solc 0.8.24, zero errors, zero warnings

## High-Level Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  React + Vite + Tailwind + Lightweight Charts           │
│  16 pages: Dashboard, Swap, Trade, Grid, Pool, Stake,   │
│  Burn, Bridge, Domain, Identity, AI Market, Treasury,   │
│  Profile, Transparency, Admin, QuickTiles               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   API GATEWAY                           │
│  Routing, rate limiting, CORS, auth, health             │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 BACKEND SERVICES (14)                    │
│  market-service, indexer-api, order-service,            │
│  keeper-service, oracle-service, bridge-service,        │
│  domain-service, identity-service, ai-market-service,   │
│  treasury-service, notification-service, admin-service, │
│  grid-service, staking-service, burn-service            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    WORKERS (7)                           │
│  ion-indexer, bsc-indexer, domain-indexer,              │
│  oracle-worker, keeper-worker, bridge-worker,           │
│  ai-sentinel                                            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  SMART CONTRACTS                         │
│  101 unique contracts/interfaces across 6 directories   │
│  bsc/ (33) | dex/ (2) | bridge/ (2) | governance/ (2)  │
│  root/ (3) | test/ (15)                                 │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                     STORAGE                              │
│  PostgreSQL (durable) + Redis (cache/locks/queues)      │
└─────────────────────────────────────────────────────────┘
```

## Frontend

**Stack:** React + Vite + TypeScript + Tailwind CSS + Framer Motion + Lightweight Charts

**Wallet adapters:** ION Browser Wallet, Online+, WalletConnect, OKX Wallet, MetaMask, EVM wallets

**Pages (16):**

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Portfolio overview, token strip, recent activity |
| Swap | `/swap` | Token swap with price impact and route display |
| Trade | `/trade` | Advanced trading with order book and depth chart |
| Grid | `/grid` | Grid strategy configuration and monitoring |
| Pool | `/pool` | Liquidity provision, position management |
| Stake | `/stake` | ION staking with tiered lockup periods |
| Burn | `/burn` | Burn dashboard, cumulative stats |
| Bridge | `/bridge` | Cross-chain ION bridge (ION ↔ BSC) |
| Domain | `/domain` | .ion domain registration and marketplace |
| Identity | `/identity` | ION ID / KYC credential management |
| AI Market | `/ai-market` | AI strategy marketplace, risk scores, predictions |
| Treasury | `/treasury` | Treasury flows, fee distribution |
| Profile | `/profile` | User settings, wallet management |
| Transparency | `/transparency` | Public audit logs, burn proof, fee breakdown |
| Admin | `/admin` | Token list, announcements, risk switches |
| QuickTiles | `/quick-tiles` | Quick-action tile dashboard |

## Backend Services (14)

### API Gateway
- Request routing, rate limiting, CORS
- Auth for admin APIs
- Public API response normalization
- Health endpoints

### Market Service
- CMC API proxy (CoinMarketCap integration)
- Mainstream token ticker strip
- OHLCV cache (via GeckoTerminal + DexScreener)
- Token metadata and icons
- Price source status

### Indexer API
- Query indexed chain data from ION Indexer v3
- Serve swaps, pools, burns, staking, bridge, treasury, domain, and user portfolio data

### Order Service
- Store order metadata and frontend-friendly order state
- Chain order contracts remain the asset source of truth

### Keeper Service
- Execute eligible limit orders and grid strategy steps
- Run pre-execution simulation
- Use distributed locks
- Record execution logs

### Oracle Service
- Aggregate CMC, CEX prices, AMM TWAP, and internal market data
- Filter outliers
- Sign price packets
- Publish oracle health

### Bridge Service
- Source-chain monitoring
- Confirmation counting
- Validator signature collection
- Target-chain submission
- Refund and retry state machine

### Domain Service
- Resolve `.ion` names to wallet addresses
- Query ownership and domain profile data
- Support domain marketplace metadata
- Protect users from homoglyph and phishing-style domain attacks

### Identity Service
- Verify ION ID / KYC Pass credentials
- Store only proof status and metadata
- Avoid storing raw KYC data
- Enforce identity level requirements for high-risk product flows

### AI Market Service
- Market summarization
- Risk score generation
- Whale monitoring
- Grid parameter suggestion
- Prediction and accuracy history
- Fraud and phishing hints

### Treasury Service
- Fee collection tracking
- Burn allocation calculation (dynamic: bear=buy more, bull=buy less)
- Master 25% priority distribution
- Staking reward pool allocation

### Notification Service
- Push notifications for order fills, liquidations, price alerts
- Multi-channel: Telegram, email, in-app

### Admin Service
- Token list management
- Announcement management
- Config review
- Risk switch dashboard
- Audit logs

### Grid Service
- Grid strategy lifecycle management
- Price range monitoring
- Auto-rebalance triggers

### Staking Service
- Staking position tracking
- Reward calculation and distribution
- Lockup period enforcement

### Burn Service
- Burn event tracking
- Cumulative burn statistics
- Hourly burn proof generation

## Smart Contracts (101 unique)

### Directory Structure

```
contracts/
├── bsc/                    # 33 contracts — BSC side (main Forge src)
│   ├── AdminManager.sol
│   ├── BatchTransfer.sol
│   ├── BridgeIONConnector.sol
│   ├── BridgeRelay.sol / BridgeRelayV2.sol
│   ├── BSCVault.sol
│   ├── Burn.sol
│   ├── DexSwap.sol / DexSwapV2.sol
│   ├── Dividend.sol
│   ├── DynamicBurnConfig.sol
│   ├── FeeReceiver.sol / FeeReceiverV2.sol
│   ├── IonBurn.sol
│   ├── IonOracle.sol / IonOracleV2.sol
│   ├── IonProtocolFeeLib.sol
│   ├── IonSwapRouter.sol / IonSwapRouterV2.sol
│   ├── IonWrapper.sol
│   ├── LiquidityMine.sol
│   ├── LiquidityPool.sol
│   ├── MockERC20.sol
│   ├── NFTAuction.sol
│   ├── OrderBook.sol / OrderBookV2.sol
│   ├── StakeReward.sol
│   ├── TokenIssuer.sol
│   ├── VaultLock.sol / VaultLockV2.sol
│   └── interfaces/
│       ├── IERC20.sol
│       ├── IFeeReceiver.sol
│       └── IOracle.sol
├── dex/                    # 2 contracts — AMM core
│   ├── AMMPool.sol
│   └── Router.sol
├── bridge/                 # 2 contracts — Cross-chain bridge
│   ├── BridgeValidator.sol
│   └── TokenBridge.sol
├── governance/             # 2 contracts — DAO governance
│   ├── GovernorAlpha.sol
│   └── Timelock.sol
├── AgentRegistry.sol       # Root-level agent registry
├── PaymentEscrow.sol       # Root-level payment escrow
├── TaskRouter.sol          # Root-level task router
└── test/                   # 15 test files — Security audit suite
    ├── AuditFixes.t.sol
    ├── BridgeIonE2E.t.sol
    ├── BSCContracts.t.sol
    ├── BSCVault.stress.t.sol
    ├── ContractAuditRemediations.t.sol
    ├── Dividend.t.sol
    ├── IonWrapper.stress.t.sol
    ├── LiquidityMine.t.sol
    ├── MinimumOutput.t.sol
    ├── SecurityAuditFixes.t.sol
    ├── SecurityMatrix.t.sol
    ├── SecurityMatrixV2.t.sol
    ├── SecurityMatrixV3.t.sol
    ├── IonMintLedger.sol
    └── IonSwapPoolMock.sol
```

### Contract Categories

| Category | Count | Key Contracts |
|----------|-------|---------------|
| DEX / Swap | 6 | DexSwap, DexSwapV2, IonSwapRouter, IonSwapRouterV2, Router, AMMPool |
| Liquidity / Staking | 5 | LiquidityPool, LiquidityMine, StakeReward, VaultLock, VaultLockV2 |
| Bridge | 6 | BridgeRelay, BridgeRelayV2, BridgeIONConnector, BridgeValidator, TokenBridge, BSCVault |
| Oracle | 4 | IonOracle, IonOracleV2, MockAggregator, IOracle |
| Fee / Burn | 7 | FeeReceiver, FeeReceiverV2, IonBurn, Burn, DynamicBurnConfig, IonProtocolFeeLib, Dividend |
| Governance | 2 | GovernorAlpha, Timelock |
| Token / NFT | 4 | IonWrapper, TokenIssuer, NFTAuction, MockERC20 |
| Order Book | 2 | OrderBook, OrderBookV2 |
| Admin / Utility | 3 | AdminManager, BatchTransfer, IFeeReceiver |
| Interfaces | 3 | IERC20, IFeeReceiver, IOracle |
| Agent System | 3 | AgentRegistry, PaymentEscrow, TaskRouter |
| Security Tests | 15 | SecurityMatrix (V1/V2/V3), stress tests, E2E tests |

### Compilation

- **Compiler:** Solc 0.8.24 with optimizer (200 runs)
- **Build:** `forge build` — 93 files, zero errors, zero warnings
- **Lint:** `forge lint` available separately; `lint_on_build = false` for build speed
- **Test:** `forge test` with fuzz runs = 256

## Database

### PostgreSQL (Durable)

Core tables (20+):

- `tokens`, `markets`, `pools`, `swaps`
- `limit_orders`, `grid_strategies`, `staking_positions`
- `burn_events`, `bridge_transfers`
- `domain_records`, `domain_listings`, `identity_credentials`
- `treasury_flows`, `oracle_prices`, `risk_events`
- `user_profiles`, `user_wallets`, `user_preferences`
- `notifications`, `audit_logs`

### Redis (Cache / Locks / Queues)

- Market cache, K-line cache
- Rate limits, worker locks
- Job queues, temporary oracle packets

## Security Baseline

- Contracts must not depend on frontend validation
- User actions must include simulation before signature when possible
- Bridge must not use a single relayer trust model
- Oracle must not rely on a single price source
- Admin actions must be logged and timelocked
- AI must be advisory and cannot silently execute asset movements
- Domain transfers must resolve and verify the final address immediately before signing
- All contracts pass 1000-round security audit (10 attack vectors × 100 rounds each)
- FeeReceiver handles all fee flows; no duplicate FeeReceiverAdmin contract

## Tokenomics Integration

- **Master 25%:** Priority distribution to Master's ION/BSC addresses
- **Dynamic Burn:** Bear market = more burn (ION cheap, more tokens destroyed per $); Bull market = less burn + more staking
- **Staking Rewards:** 20% of platform revenue → staking pool (flexible 8% to 365-day 30%)
- **Treasury:** Remaining after Master + Burn + Staking allocations
- **Blackhole address (BSC):** `0x000000000000000000000000000000000000dEaD`
