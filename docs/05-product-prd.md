# Product Requirements Document

## Product Name

ION DEX

## Product Goal

Build a premium ION ecosystem DeFi portal with swap, professional trading, liquidity, staking,
dual-chain burn tracking, bridge, ION DNS, ION Identity, AI market intelligence, and user profile
systems.

## Target Users

- ION holders.
- BSC ION holders.
- Liquidity providers.
- Stakers.
- Professional traders.
- Grid strategy users.
- Domain collectors and `.ion` identity users.
- ION ecosystem builders and community promoters.

## V1 Scope

V1 focuses on reliable public launch foundations:

- Dashboard.
- Wallet connection shell.
- Profile menu shell.
- Swap.
- Pool.
- Stake.
- Burn.
- Market ticker.
- Transparency.

V1 does not include fully automated grid execution, cross-chain release automation, or production AI prediction trading.

## V2 Scope

- Bridge.
- Domain.
- ION ID status.
- Treasury.
- Full profile center.

## V3 Scope

- Limit orders.
- Grid strategies.
- Oracle.
- Keeper.
- AI Market.
- AI Sentinel automation.

## Page Requirements

### Dashboard

Must include:

- Top navigation.
- ION DEX logo.
- Wallet/profile area.
- Real-time ticker strip for ION and mainstream assets.
- Swap quick panel.
- Central K-line or hero market chart.
- TVL, APR, burn, staking, and treasury cards.
- Feature cards: Pool, Trade, Grid, Bridge, Burn, Domain, Stake, AI.
- Aurora/galaxy background.

### Swap

Must include:

- Token pair selection.
- BNB/ION market buy flow.
- ION pair swap flow.
- Quote preview.
- Minimum received.
- Protocol fee in ION.
- Price impact.
- Slippage setting.
- Transaction simulation.
- Wallet confirmation status.

### Trade

Must include:

- K-line chart.
- Order book or depth visualization when available.
- Market trades.
- Limit order form.
- User open orders.
- User order history.
- Risk hints.

### Grid

Must include:

- Strategy templates: arithmetic, geometric, infinite, trailing, stop-loss/take-profit, DCA.
- AI parameter suggestion.
- Backtest/simulation preview.
- User confirmation before on-chain creation.
- Strategy status and execution logs.

### Pool

Must include:

- Pool list.
- TVL.
- Volume.
- APR.
- Add liquidity.
- Remove liquidity.
- LP position card.
- Impermanent loss hint.

### Stake

Must include:

- Official ION staking total.
- DEX ION staking total.
- LP staking total.
- Future ecosystem staking placeholder.
- APR.
- Claimable rewards.
- Lock duration.
- Dynamic APR explanation.

### Burn

Must include:

- BSC ION burn daily/monthly/yearly/total.
- ION mainnet burn daily/monthly/yearly/total.
- Combined total burn.
- Remaining supply.
- Trend line chart.
- Bar chart.
- Chain split donut chart.
- Proof of burn transaction links.

### Bridge

Must include:

- Source chain.
- Target chain.
- Asset.
- Amount.
- Fee.
- Estimated time.
- Status tracker.
- Source transaction.
- Target transaction.
- Refund state if failed.

### Domain

Must include:

- `.ion` domain search.
- Availability state.
- Domain resolver result.
- Send-to-domain flow.
- Domain profile.
- My domains.
- Listings.
- Offers.
- History.
- Homoglyph and phishing warnings.

### Identity

Must include:

- ION ID status.
- KYC Pass level.
- `.ion` primary domain.
- Credential expiry.
- Privacy settings.
- Risk and anti-sybil status.

### AI Market

Must include:

- AI market summary.
- ION trend probability.
- Support and resistance.
- Whale movement.
- On-chain sentiment.
- Risk score.
- Grid suggestion.
- Prediction history and accuracy.
- Non-investment-advice disclaimer.

### Profile

Must include:

- Avatar picker.
- NFT avatar support placeholder.
- Wallet list.
- Primary wallet.
- `.ion` primary name.
- Language and region.
- Theme and animation settings.
- Security logs.
- Approvals.
- Orders.
- Grid strategies.
- Staking.
- Bridge history.
- Domain records.
- Notifications.
- Referral and badges.

### Transparency

Must include:

- Contract addresses.
- Burn addresses.
- Treasury addresses.
- Multisig addresses.
- Fee distribution.
- Audit reports.
- Bug bounty.
- System status.
- Admin action history.

## Data Source Rules

- CMC data must be proxied by backend.
- Chain analytics must come from indexer.
- Contract state remains source of truth.
- Frontend must not hardcode official addresses except test placeholders.
- Domain transfer must re-resolve the domain before signing.
- Identity status must be verified by backend or official identity SDK/API.

## Security Requirements

- Every asset-moving transaction must show a human-readable signing summary.
- High-risk actions require double confirmation.
- Suspicious domain names require warnings.
- Large bridge transfers require extra confirmation and may require ION ID level checks.
- AI cannot execute trades unless user explicitly creates and signs strategy instructions.
- User privacy mode must hide balances and portfolio values.

## Success Metrics

- Swap success rate.
- Average quote latency.
- Burn dashboard freshness.
- Staking dashboard freshness.
- Wallet connection success rate.
- Bridge completion rate.
- Keeper execution success rate.
- Domain resolve accuracy.
- AI prediction audit coverage.
- System uptime.
