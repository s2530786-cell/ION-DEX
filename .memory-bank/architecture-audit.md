# Architecture Audit Memory

## 2026-05-20 UI conformance audit

The user requires `swap.ion` to present as an ION Chain native DEX surface, not a generic mock screen.

Current enforced UI direction:

- Base background must be near `#03050f`.
- Use Canvas-driven aurora/galaxy motion with at least 200 particles.
- Use 4D liquid-glass surfaces with `backdrop-filter: blur(...)`, glossy highlights, aurora reflections, and rounded irregular silhouettes for major feature modules.
- Use thick flowing neon rims for hero cards and feature tiles; thin borders are only acceptable inside dense trading internals.
- Show layered depth, including three market depth layers where relevant.
- Use 3D floating cards and 3D icons for primary product surfaces.
- Do not expose user-facing `mock`, `placeholder`, `shell`, `draft`, `TBD`, or `Build Checklist` copy.
- Treat flat table-line screens, grey strip controls, compressed tiny text, and plain engineering forms as design failures even when functional tests pass.
- Empty data and pseudo-code are untouchable red lines. UI must not ship empty product panels, fake lists, fake values, or pseudo-code-driven surfaces.
- Loading and error states are allowed only for real request lifecycle behavior. They must never hide missing concrete data integration.
- Every product value shown in UI must come from a typed backend/data integration, source adapter, cache, indexer/upstream API, or reviewed local seed data with provenance.

Implementation memory:

- `frontend/src/components/background/AuroraGalaxyBackground.tsx` owns the Canvas particle field.
- `frontend/src/styles/global.css` owns shared `glass-surface`, `flow-border`, `depth-stage`, and `float-3d` utilities.
- `frontend/src/pages/DashboardPage.tsx` is the `swap.ion` landing and swap surface (uses shared `GlassPanel` / `ChartFrame` / `MetricTile` from `frontend/src/components/ui/glass/`).
- `frontend/src/pages/BusinessPages.tsx` renders `TradeDeskPage` as the professional `Trade` surface (`PageHero`, `ChartFrame`, `GlassPanel` modules) with market chart, order book, market trades, order history/risk, and wallet-gated limit order review.
- `scripts/dev-preflight.mjs` scans frontend source for unfinished UI copy and can fail under `ION_UI_STRICT=1`.

## 2026-05-20 Trade desk continuation

- Trade must not render through the generic product module layout.
- Required visible modules: title, market stat cards, 3D chart/K-line surface, `TWAP guard active`, `Limit order`, `Order book`, `Market trades`, and `Orders and risk`.
- E2E must assert these modules through stable `data-testid` values.
- Browser walkthrough artifact: `/opt/cursor/artifacts/trade_desk_ui_walkthrough.mp4`.
- 100-pass verification artifact: `/opt/cursor/artifacts/trade_desk_verify_100_summary.txt` with `RESULT=GREEN`.

## 2026-05-20 User correction: reference style is mandatory

The user provided reference images showing the desired UI style:

- 4D liquid-glass cards with thick cyan/magenta/violet neon rims.
- Galaxy and aurora backgrounds with strong visual presence.
- Large rounded glass cards, often with irregular or softly warped silhouettes.
- 3D icons sitting inside feature cards.
- Product pages such as Pool, Bridge, Burn, and Domain should look like premium glowing glass objects, not flat web panels.

Critical lesson: an implementation can pass automated tests and still fail the UI design standard. Visual self-verification against this style is mandatory before claiming UI completion.

## 2026-05-20 User correction: no empty data or pseudo-code

The user explicitly forbids empty data and pseudo-code as UI content. This is an untouchable red line.

Concrete data integration memory:

- Market/ticker/quote data: backend gateway -> market service -> CMC or reviewed cache/upstream adapter.
- ION chain analytics: ION indexer / official HTTP API, with source, timestamp, stale flag, and request ID.
- BSC burn and bridge data: BSC RPC/indexer or bridge service adapters, never hardcoded narrative.
- Domain data: ION DNS/domain service and official DNS references.
- Staking/treasury data: staking snapshots, treasury accounting, source labels, and reconciliation jobs.
- Wallet/profile data: supported wallet adapters and profile service, never fake profile panels.

Required UI behavior:

- If integration is not ready, do not present a product panel as complete.
- If an upstream request is loading or failing, show lifecycle state tied to the real request and its source.
- Do not create empty lists, fake orders, fake pool rows, fake bridge status, or pseudo-code UI to satisfy visual layout.

Verification expectation:

- Run `ION_UI_STRICT=1 node scripts/dev-preflight.mjs`.
- Run encoding check.
- Run frontend build and Playwright.
- Run full verification.
- Perform browser visual validation for UI changes.
