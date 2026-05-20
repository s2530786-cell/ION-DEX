# Development Roadmap

This roadmap defines the build order. Each phase depends on the phase before it unless explicitly marked parallel.

## Phase 0 - Confirmation And Blueprint

Goal: freeze assumptions and avoid building on unknown official addresses or unstable APIs.

Deliverables:

- `00-project-overview.md`
- `01-official-addresses-and-assumptions.md`
- `02-tokenomics-and-fees.md`
- `03-technical-architecture.md`
- Product PRD
- Page flow
- User journeys

Exit criteria:

- All unknown official addresses are either confirmed or represented as configurable variables.
- V1 scope is agreed.

## Phase 1 - UI Design System

Goal: create the visual foundation before building feature pages.

Deliverables:

- Aurora and galaxy background system.
- Hourly background switching.
- Neon card component.
- Glass panel component.
- Neon button component.
- App shell.
- Profile avatar menu shell.
- Responsive layout primitives.

Exit criteria:

- Dashboard skeleton renders with final visual language.
- Mobile and desktop layout rules are defined.

## Phase 2 - Contract Foundations

Goal: implement audited building blocks for funds and fees.

Deliverables:

- ION AMM pool skeleton.
- Router.
- Fee distributor.
- Treasury.
- Staking pool skeleton.
- BSC vault with SafeERC20, Pausable, EIP-712, threshold validation, and limits.
- Contract test framework.

Exit criteria:

- Swap, fee distribution, staking deposit, and BSC vault flows pass local tests.
- Security invariants are documented.

## Phase 3 - Backend Foundation

Goal: create the API, database, cache, and worker base.

Deliverables:

- API gateway.
- PostgreSQL schema.
- Redis setup.
- Health checks.
- Config module.
- Market service with CMC proxy.
- Token list module.
- User profile module.

Exit criteria:

- Frontend can load config, token list, and ticker strip through backend APIs.

## Phase 4 - Indexer

Goal: make all chain analytics reliable.

Deliverables:

- ION indexer worker.
- BSC indexer worker.
- Burn event indexing.
- Staking event indexing.
- Pool event indexing.
- Treasury event indexing.
- User portfolio API.

Exit criteria:

- Burn, staking, TVL, volume, and user history can be served from indexed data.

## Phase 5 - Core Frontend Pages

Goal: ship V1 user-facing product.

Deliverables:

- Dashboard.
- Swap.
- Pool.
- Stake.
- Burn.
- Bridge status surface backed by typed route/status data.
- Profile menu.
- Wallet connection shell.

Exit criteria:

- A user can connect wallet, view market data, see burn/staking stats, and perform testnet swap/pool/stake flows.

## Phase 6 - Oracle, Keeper, Limit, Grid

Goal: enable professional trading and automation.

Deliverables:

- Oracle service.
- Oracle adapter contract.
- Limit order contract.
- Limit order keeper.
- Grid strategy vault.
- Grid keeper.
- Strategy simulation API.
- Trade and Grid pages.

Exit criteria:

- Limit orders and grid strategies can be created, simulated, executed by keeper, and cancelled.

## Phase 7 - Bridge

Goal: add secure ION Chain and BSC cross-chain flows.

Deliverables:

- Bridge verifier.
- Bridge service state machine.
- Validator signature collection.
- BSC vault integration.
- ION bridge adapter.
- Bridge page.
- Bridge status tracking.

Exit criteria:

- Testnet cross-chain transfer completes with source and target transaction proofs.

## Phase 8 - Domain And ION ID

Goal: integrate ION ecosystem identity and DNS into DEX.

Deliverables:

- Domain resolver adapter.
- Domain service.
- `.ion` address resolution.
- Domain profile and marketplace surface.
- Identity service.
- ION ID / KYC Pass status verification surface.
- Profile identity badges.

Exit criteria:

- A user can resolve `.ion` names, view domain profile data, and display verified identity status without storing raw KYC data.

## Phase 9 - AI Market And Sentinel

Goal: provide analysis, prediction, and risk monitoring.

Deliverables:

- AI market service.
- Whale monitor.
- Risk scoring.
- Grid suggestion engine.
- AI sentinel.
- Prediction audit log.
- AI Market page.

Exit criteria:

- AI analysis is explainable, source-labeled, and never auto-executes without user signatures.

## Phase 10 - Admin, Transparency, And Governance Prep

Goal: prepare for public operation.

Deliverables:

- Admin dashboard.
- Transparency page.
- Status page.
- Audit report page.
- Bug bounty page.
- Multisig and timelock documentation.
- Governance parameter limits.

Exit criteria:

- Public users can verify addresses, fees, treasury, burn, contracts, audits, and system health.

## Phase 11 - Security Testing And Audit

Goal: harden the system before mainnet.

Deliverables:

- Contract unit tests.
- Contract fuzz tests.
- Economic attack tests.
- Bridge replay tests.
- Oracle manipulation tests.
- Frontend E2E tests.
- Backend API tests.
- Load tests.
- External audit.
- Bug bounty testnet.

Exit criteria:

- Critical and high findings are resolved.
- Mainnet launch checklist is signed off.

## Phase 12 - Mainnet Launch

Goal: staged production launch.

Launch sequence:

1. Internal mainnet dry run.
2. Limited public beta.
3. V1 public launch.
4. Post-launch monitoring.
5. V2 feature unlocks.

V1:

- Dashboard
- Swap
- Pool
- Stake
- Burn
- Wallet/Profile
- Transparency

V2:

- Bridge
- Domain
- ION ID
- Treasury

V3:

- Limit orders
- Grid strategies
- Oracle/Keeper automation
- AI Market

V4:

- DAO
- Launchpad
- Strategy marketplace
- Developer platform
