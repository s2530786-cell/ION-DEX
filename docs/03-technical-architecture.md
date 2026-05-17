# Technical Architecture

ION DEX is designed as a multi-layer system. Contracts hold and settle assets. Backend services index,
simulate, analyze, and automate. Frontend provides wallet-driven user operations.

## High-Level Architecture

```text
frontend
  -> api-gateway
    -> market-service
    -> indexer-api
    -> order-service
    -> grid-service
    -> staking-service
    -> burn-service
    -> bridge-service
    -> domain-service
    -> identity-service
    -> ai-market-service
    -> treasury-service
    -> notification-service
    -> admin-service

workers
  -> ion-indexer
  -> bsc-indexer
  -> domain-indexer
  -> oracle-worker
  -> keeper-worker
  -> bridge-worker
  -> ai-sentinel

contracts
  -> ION mainnet contracts
  -> BSC contracts

storage
  -> PostgreSQL
  -> Redis
  -> object storage

observability
  -> logs
  -> metrics
  -> traces
  -> alerts
```

## Frontend

Technology target:

- Next.js or Vite React, depending on deployment preference.
- React.
- Tailwind CSS.
- Framer Motion for controlled premium animations.
- Lightweight Charts for K-line and analytics charts.
- Wallet adapters for ION Browser Wallet, Online+, WalletConnect, OKX Wallet, MetaMask, and other EVM wallets.

Primary pages:

- Dashboard
- Swap
- Trade
- Grid
- Pool
- Stake
- Burn
- Bridge
- Domain
- Identity
- AI Market
- Treasury
- Profile
- Transparency
- Admin

## Backend Services

### API Gateway

- Request routing.
- Rate limiting.
- CORS.
- Auth for admin APIs.
- Public API response normalization.
- Health endpoints.

### Market Service

- CMC API proxy.
- Mainstream token ticker strip.
- OHLCV cache.
- Token metadata and icons.
- Price source status.

### Indexer API

- Query indexed chain data.
- Serve swaps, pools, burns, staking, bridge, treasury, domain, and user portfolio data.

### Order Service

- Store order metadata and frontend-friendly order state.
- Chain order contracts remain the asset source of truth.

### Keeper Service

- Execute eligible limit orders and grid strategy steps.
- Run pre-execution simulation.
- Use distributed locks.
- Record execution logs.

### Oracle Service

- Aggregate CMC, centralized exchange prices, AMM TWAP, and internal market data.
- Filter outliers.
- Sign price packets.
- Publish oracle health.

### Bridge Service

- Source-chain monitoring.
- Confirmation counting.
- Validator signature collection.
- Target-chain submission.
- Refund and retry state machine.

### Domain Service

- Resolve `.ion` names to wallet addresses.
- Query ownership and domain profile data.
- Support domain marketplace metadata.
- Protect users from homoglyph and phishing-style domain attacks.

### Identity Service

- Verify ION ID / KYC Pass credentials.
- Store only proof status and metadata.
- Avoid storing raw KYC data.
- Enforce identity level requirements for high-risk product flows.

### AI Market Service

- Market summarization.
- Risk score generation.
- Whale monitoring.
- Grid parameter suggestion.
- Prediction and accuracy history.
- Fraud and phishing hints.

### Admin Service

- Token list management.
- Announcement management.
- Config review.
- Risk switch dashboard.
- Audit logs.

## Contracts

### ION Contracts

- `DexRouter.fc`
- `IonAmmPool.fc`
- `LimitOrderBook.fc`
- `GridStrategyVault.fc`
- `StakingPool.fc`
- `FeeDistributor.fc`
- `Treasury.fc`
- `OracleAdapter.fc`
- `DomainMarketplace.fc`
- `DomainResolverAdapter.fc`

### BSC Contracts

- `BSCVault.sol`
- `BridgeVerifier.sol`
- `BSCFeeVault.sol`

## Database

PostgreSQL is the durable application database.

Core tables:

- `tokens`
- `markets`
- `pools`
- `swaps`
- `limit_orders`
- `grid_strategies`
- `staking_positions`
- `burn_events`
- `bridge_transfers`
- `domain_records`
- `domain_listings`
- `identity_credentials`
- `treasury_flows`
- `oracle_prices`
- `risk_events`
- `user_profiles`
- `user_wallets`
- `user_preferences`
- `notifications`
- `audit_logs`

Redis is used for:

- Market cache.
- K-line cache.
- Rate limits.
- Worker locks.
- Job queues.
- Temporary oracle packets.

## Security Baseline

- Contracts must not depend on frontend validation.
- User actions must include simulation before signature when possible.
- Bridge must not use a single relayer trust model.
- Oracle must not rely on a single price source.
- Admin actions must be logged and timelocked.
- AI must be advisory and cannot silently execute asset movements.
- Domain transfers must resolve and verify the final address immediately before signing.
