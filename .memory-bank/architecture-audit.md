# Architecture Audit Memory

## 2026-05-20 UI conformance audit

The user requires `swap.ion` to present as an ION Chain native DEX surface, not a generic mock screen.

Current enforced UI direction:

- Base background must be near `#03050f`.
- Use Canvas-driven aurora/galaxy motion with at least 200 particles.
- Use glass surfaces with `backdrop-filter: blur(...)` and refined borders.
- Use flowing neon borders for major functional blocks.
- Show layered depth, including three market depth layers where relevant.
- Use 3D floating cards for the primary trading surface.
- Do not expose user-facing `mock`, `placeholder`, `shell`, `draft`, `TBD`, or `Build Checklist` copy.

Implementation memory:

- `frontend/src/components/background/AuroraGalaxyBackground.tsx` owns the Canvas particle field.
- `frontend/src/styles/global.css` owns shared `glass-surface`, `flow-border`, `depth-stage`, and `float-3d` utilities.
- `frontend/src/pages/DashboardPage.tsx` is the `swap.ion` landing and swap surface.
- `frontend/src/pages/BusinessPages.tsx` renders `TradeDeskPage` as the professional `Trade` surface with market chart, order book, market trades, order history/risk, and wallet-gated limit order review.
- `scripts/dev-preflight.mjs` scans frontend source for unfinished UI copy and can fail under `ION_UI_STRICT=1`.

## 2026-05-20 Trade desk continuation

- Trade must not render through the generic product module layout.
- Required visible modules: title, market stat cards, 3D chart/K-line surface, `TWAP guard active`, `Limit order`, `Order book`, `Market trades`, and `Orders and risk`.
- E2E must assert these modules through stable `data-testid` values.
- Browser walkthrough artifact: `/opt/cursor/artifacts/trade_desk_ui_walkthrough.mp4`.

Verification expectation:

- Run `ION_UI_STRICT=1 node scripts/dev-preflight.mjs`.
- Run encoding check.
- Run frontend build and Playwright.
- Run full verification.
- Perform browser visual validation for UI changes.
