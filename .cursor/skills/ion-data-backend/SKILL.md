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
