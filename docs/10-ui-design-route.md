# ION DEX UI Design Route Lock

## Purpose

This document locks the UI route before further frontend development. It converts the user's design requirement into an executable engineering workflow.

## Non-negotiable UI Direction

ION DEX must look and feel like a premium OKX Web3-style trading product for the ION ecosystem:

- Dark blue and purple foundation with cyan, violet, magenta, and gold neon accents.
- Cyberpunk neon, glassmorphism, aurora and galaxy motion.
- 4D liquid-glass panels: translucent depth, glossy highlights, aurora reflections, and rounded irregular glass silhouettes when the module is a hero card, feature tile, bridge modal, pool panel, burn panel, or domain panel.
- Thick luminous cyan/magenta/violet neon rims for hero cards and feature tiles; thin borders are only acceptable inside dense trading subpanels.
- 3D floating icons and cards for all major feature modules.
- Galaxy/starfield/aurora background must be a visible product identity layer, not a faint decoration.
- Dense professional trading layout, without copying OKX brand assets.
- No rough placeholder cards, no plain unfinished panels, no user-facing `shell`, `draft`, `TBD`, or `Build Checklist` copy.
- Flat table-line screens, grey strip segmented controls, compressed tiny typography, and plain engineering forms fail the design gate.
- Empty data and pseudo-code are untouchable red lines. Product UI must be backed by concrete typed data integrations, reviewed local seed data, cache, indexer, or upstream/source adapters recorded in project memory.
- Loading and error states are only real network/request lifecycle states; they must never be used to hide missing data integration.
- Responsive layouts must be designed and verified at 375px, 768px, and 1440px.

## Mandatory Reading Before UI Development

Before editing any frontend file, read these files in order:

1. `docs/00-engineering-standards.md`
2. `.cursor/skills/ion-web3-ui/SKILL.md`
3. `docs/05-product-prd.md`
4. `docs/06-page-flow-and-user-journeys.md`
5. `docs/10-ui-design-route.md`

Then run:

```text
node scripts/dev-preflight.mjs
```

## Automatic Workflow

Every implementation loop must follow this order:

1. Preflight: run `node scripts/dev-preflight.mjs`.
2. Scope: choose one page or one shared UI primitive only.
3. Design map: list the exact PRD modules that will be represented in the UI.
4. Implement: use existing `NeonCard`, `NeonButton`, and `AuroraGalaxyBackground` first; add shared primitives only when they move the UI closer to the 4D liquid-glass reference style.
5. Replace unfinished surfaces: remove visible `shell`, `draft`, `TBD`, and `Build Checklist` UI from the touched page.
6. Data self-check: verify every displayed product value has a typed source from backend/data memory, source adapter, cache, indexer, upstream API, or reviewed local seed data. Reject pseudo-code and empty data.
7. Visual self-check: compare the rendered result against the 4D liquid-glass / aurora galaxy / thick neon rim reference; reject flat table-line or grey-strip layouts.
8. Verify states: cover default, hover/focus where practical, disabled, and real loading/error lifecycle states once data is introduced.
9. Verify breakpoints: 375px, 768px, 1440px.
10. Run project verification: encoding, frontend verify, audit high, and full verification when required.
11. Update `docs/99-current-progress.md` and `SESSION_STATE.md`.

`scripts/verify-full.cmd`, `scripts/verify-full.ps1`, `scripts/agent-verify.cmd`, and `scripts/verify-full-save-log.cmd --no-pause` must run the preflight automatically.

## Page Upgrade Route

### 1. Shared UI Foundation

- Add a reusable glass panel primitive for inner blocks.
- Add trading surface primitives: chart frame, order book table, status pill, metric tile, timeline step, risk notice.
- Move repeated user-facing copy into page-local constants that can later feed i18n.

### 2. Dashboard

- Replace the decorative chart with a real market surface using `lightweight-charts` or a faithful reviewed local seed adapter that is clearly wired through typed data boundaries.
- Make feature cards navigable.
- Convert Swap from static placeholders to controlled inputs, quote preview, minimum received, ION fee, price impact, and disabled/error states.

### 3. Trade

- 1440px layout: chart and depth main area, order book, market trades, order form, open orders/history.
- 768px layout: chart first, form and book below.
- 375px layout: compact tabs for chart, order book, and order form.
- Keep all transaction actions wallet-gated with human-readable signing summaries.

### 4. Grid

- Show strategy templates, range visualization, backtest preview, AI suggestion panel, risk guard, and strategy status/logs.
- Do not present strategy creation as a generic form only.

### 5. Pool

- Show pool list, TVL, volume, APR, add/remove liquidity, LP position card, fee growth, and impermanent-loss hint.

### 6. Stake

- Show official staking, DEX staking, LP staking, ecosystem total, APR explanation, lock duration, claimable rewards, and unstake queue.

### 7. Burn

- Show BSC burn, ION burn, combined total, remaining supply, trend line, bar chart, chain split, and proof links.

### 8. Bridge

- Show source/target chain, amount, fee, estimated time, route risk, status tracker, source/target tx, refund state.

### 9. Domain And Identity

- Show `.ion` search, availability, resolver result, send-to-domain flow, profile, my domains, marketplace, phishing warnings, ION ID status, KYC Pass metadata, and privacy controls.

### 10. AI Market

- Show market summary, trend probability, support/resistance, whale movement, sentiment, risk score, grid suggestion, prediction history, and non-investment-advice disclaimer.

## Acceptance Gate For UI Changes

A UI change is not acceptable unless it has:

- Encoding verification evidence.
- `frontend` build and Playwright evidence.
- `npm run audit:high` evidence.
- Responsive evidence for affected pages.
- No newly introduced user-facing unfinished copy.
- Updated project memory.
