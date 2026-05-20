# Overall Design Framework

This is the consolidated ION DEX design memory. It resolves scattered docs, memory files, and historical decisions into one required pre-development framework.

## Product Identity

ION DEX is an ION ecosystem DeFi portal:

- Swap.
- Professional spot trading and limit orders.
- Grid strategies.
- Liquidity pools.
- Staking.
- Dual-chain burn analytics.
- Bridge.
- `.ion` domain and marketplace.
- ION ID / KYC Pass.
- AI market intelligence.
- Treasury, transparency, profile, notifications, and governance readiness.

## Visual Law

The UI must match the user-provided reference style:

- 5D dynamic galaxy / nebula / aurora background with strong presence.
- Unreal Engine-like rendering quality: depth, glow, lighting, glass refraction, and spatial layering.
- 4D/5D liquid-glass cards with glossy highlights and aurora reflections.
- Thick cyan / magenta / violet neon rims for hero panels and feature cards.
- Large rounded or softly irregular glass silhouettes.
- 3D feature icons and floating objects.
- The ION DEX logo must be treated as a premium 3D neon brand object.

Design failures:

- Flat table-line pages.
- Grey strip controls.
- Tiny compressed typography.
- Plain engineering forms.
- Ordinary web cards that do not look like glowing glass objects.

## Data Law

- No empty data.
- No pseudo-code.
- No fake lists.
- No fake values.
- No product UI that pretends an integration is complete.
- Loading and error states are only real request lifecycle states.
- Every product value must come from typed backend/data integration, source adapter, cache, indexer/upstream API, or reviewed local seed data with provenance.

## Pre-Development Memory Retrieval Law

Before any implementation or UI claim, retrieve:

1. `.memory-bank/overall-design-framework.md`
2. `.memory-bank/live-data-reference.md`
3. `.memory-bank/implementation-playbook.md`
4. `.memory-bank/architecture-audit.md`
5. `.memory-bank/security-audit-and-stress-framework.md`
6. `.memory-bank/ion-dex-nuke/official-source-index.md`
7. `docs/05-product-prd.md`
8. `docs/06-page-flow-and-user-journeys.md`
9. `docs/09-reference-architecture.md`
10. `docs/10-ui-design-route.md`
11. `SESSION_STATE.md`

Also search Git history when current memory appears incomplete.

## Right-Top Avatar / Profile Hub

The right-top avatar is a full Profile Hub, not a wallet-only dropdown.

Required integrations:

- Avatar picker.
- NFT avatar from verified wallet/profile media source.
- Wallet connection and wallet list.
- Primary wallet.
- Online+ Wallet.
- ION Browser Wallet.
- WalletConnect / OKX.
- Seven EVM wallets from reviewed detectors: MetaMask, Binance Web3, OKX Web3, Bitget Web3, Trust Wallet, Coinbase Wallet, Rabby.
- `.ion` primary name and domain records.
- ION ID status.
- KYC Pass level and expiry.
- Language and region.
- Theme and animation settings.
- Privacy mode that hides balances and portfolio values.
- Security logs.
- Approvals.
- Orders.
- Grid strategies.
- Staking.
- Bridge history.
- Notifications.
- Referral and badges.
- Open full Profile page for deeper controls.

Required post-connect detection:

- Network.
- Wallet provider.
- Address format.
- Language.
- `.ion` name when available.
- Identity / KYC status when available.

## Data Architecture

Backend is the frontend-facing authority:

- `api-gateway`
- `config-service`
- `token-list-service`
- `market-service`
- `burn-service`
- `staking-service`
- `bridge-status-service`
- `domain-service`
- `profile-service`

Source adapters:

- CMC for market data.
- PancakeSwap chain fallback for BSC ION price / pools.
- BSC RPC / indexer for burn and bridge.
- ION HTTP API / JSON RPC / Indexer v3 for ION chain analytics.
- ION DNS / Indexer for `.ion` records.
- Wallet adapters for wallet/profile session data.

Every response should expose source, timestamp, stale flag, and request ID.

## Page Framework

### Dashboard / swap.ion

- 5D galaxy/aurora background.
- ION DEX 3D logo treatment.
- Liquid-glass Swap card.
- Real quote preview.
- Minimum received.
- ION fee.
- Price impact.
- Execution route.
- Market chart surface.
- Feature cards with 3D icons.

### Trade

- Professional trading surface.
- Chart/depth main area.
- Order book.
- Market trades.
- Limit order form.
- Open orders / order history / risk.
- Wallet-gated signing summary.

### Pool

- 5D liquid-glass pool card.
- 3D cube/icon.
- Pool list, TVL, volume, APR.
- Add/remove liquidity.
- LP position card.
- Fee growth and impermanent-loss hint.

### Bridge

- 5D liquid-glass bridge modal/panel.
- 3D globe/icon.
- Source and target chains.
- Asset, amount, fee, estimated time.
- Status tracker and proof links.
- Refund/failure state from real bridge data.

### Burn

- 5D liquid-glass burn analytics card.
- 3D flame/icon.
- BSC burn, ION burn, combined total, remaining supply.
- Trend line, bar chart, chain split, proof links.

### Domain / Identity

- `.ion` search and availability.
- Resolver result and send-to-domain flow.
- My domains, listings, offers, history.
- Homoglyph/phishing warnings.
- ION ID, KYC Pass, credential expiry, privacy controls.

### AI Market

- Market summary.
- Trend probability.
- Support/resistance.
- Whale movement.
- Sentiment.
- Risk score.
- Grid suggestion.
- Prediction history and accuracy.
- Non-investment-advice disclaimer.

## Verification Law

Do not claim completion without:

- Memory retrieval evidence.
- Data-source mapping.
- Visual self-check against reference style.
- `ION_UI_STRICT=1 node scripts/dev-preflight.mjs`.
- Encoding check.
- Frontend verify and high audit.
- Backend verify/audit/stress for data work.
- Security preflight and domain-specific audit for high-risk work.
- Browser walkthrough for UI.
- 100-pass gate for completed milestones.
