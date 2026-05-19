---
name: ion-data-backend
description: Plans and implements ION DEX backend/API/data integrations. Use when working on CMC prices, ION DNS data, burn statistics, staking totals, bridge events, treasury analytics, indexers, API routes, database schema, caching, or data reliability.
---

# ION Data Backend

## Data Domains

Use this skill for data and backend work around:

- CMC or other market price feeds for ticker strips and trading quotes.
- ION DNS/domain data and wallet binding.
- BSC burn address data and ION mainnet burn source data.
- Staking totals: official staking, DEX staking, and future ecosystem staking.
- Bridge events: BSC vault deposits, ION releases, relayer state, and stuck transfer detection.
- Treasury, team allocation, community rewards, fee split, and burn accounting.
- API routes, backend services, indexers, database schema, caches, and jobs.

## Reliability Rules

### 🔴 RED LINE: NO MOCK / NO FAKE DATA
> All backend services must connect to REAL chain data. Zero tolerance for:
> - `return { price: 0.42 }` (hardcoded)
> - `status: "mock"`, `source: "mock"`, `relayerStatus: "mocked"`
> - Empty adapters, fake DB connections, placeholder API endpoints
> - Fake wallet connections, fake balances, fake transaction hashes
> If you cannot connect to the real data source, DO NOT write a mock substitute — search GitHub/Google/StackOverflow for the right approach, then implement it for real.
> **Prefer 1 real endpoint over 100 mock endpoints.**

### ✅ APPROVED REAL DATA SOURCES (ONLY THESE)
> | Domain | Source | Format |
> |--------|--------|--------|
> | **Prices** | CMC API (`pro-api.coinmarketcap.com`) | JSON, API key in env |
> | **BSC Price/Reserves** | PancakeSwap Router `0x10ED43C718714eb63d5aA57B78B54704E256024E` | On-chain `getAmountsOut` |
> | **ETH Price/Liquidity** | Uniswap V3 Quoter `0xb27308f9F90D2F3dcC8a55F0917A4D7AE73A3276` (BSC) | On-chain `quoteExactInputSingle` |
> | **ION Chain Data** | `https://api.mainnet.ice.io/http/v2/` + `https://api.mainnet.ice.io/indexer/v3/` | JSON RPC |
> | **BSC RPC** | Public RPC or configurable endpoint | JSON RPC |
> | **Wallet** | ethers.js / wagmi / viem → EIP-1193 injected provider | MetaMask, Binance Web3, OKX Web3, Bitget Web3, Trust Wallet, Coinbase Wallet, Rabby |
> | **Staking** | ION链 `get_stake_info` / `get_validator_list` RPC | On-chain call |
> | **Burn** | BSC burn address + ION mainnet burn events | Indexer query |
> | **Bridge** | BSCVault events + ION validators (multisig-code.fc param71) | On-chain events |
> **Mock = 死刑。CMC/PancakeSwap/Uniswap/真实钱包 四选一，没有其他选项。**

- Treat every external API as unreliable: add timeout, retry policy, rate-limit handling, and clear stale-data state.
- Store source, timestamp, and confidence for every important data point.
- Never mix unofficial values with official values without labeling provenance.
- For financial UI, show last updated time and fallback/error state.
- Secrets must be environment variables, never hardcoded.
- Prefer typed schemas and validators for API inputs and outputs.

## Suggested Architecture

- API gateway layer for frontend-facing data.
- Source adapters for CMC, ION DNS, BSC RPC/indexer, ION HTTP API/indexer, and staking sources.
- Normalized database tables for prices, burns, staking snapshots, bridge events, and treasury movements.
- Cache layer for high-read market data.
- Scheduled jobs for snapshots and reconciliation.
- Structured logs for all critical ingest and reconciliation operations.

## Required Tests

Backend/data features must include:

- Unit tests for parsers and source adapters.
- API tests for success, invalid input, auth failure, timeout, and upstream error cases.
- Reconciliation tests for burn, bridge, and staking totals.
- Load tests once endpoints exist.

If backend code does not exist yet, produce design docs and test plans instead of claiming implementation.
