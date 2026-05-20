---
name: ion-web3-ui
description: Guides ION DEX frontend UI development. Use when building or modifying React, Vite, Tailwind, dashboard, trading, swap, grid, staking, bridge, burn, domain, AI analysis, wallet, or profile screens. Enforces OKX/Web3-inspired neon cyberpunk design, responsive behavior, accessibility, and E2E coverage.
---

# ION Web3 UI

## Design Direction

ION DEX UI must feel like a premium OKX Web3-style trading product:

- Dark blue/purple base, cyberpunk neon, glassmorphism, aurora and galaxy motion.
- Thin refined neon borders on all major function blocks.
- No rough placeholder cards, no plain unfinished panels.
- Use existing UI primitives first: `NeonCard`, `NeonButton`, `AuroraGalaxyBackground`.
- Keep layout responsive for 375px, 768px, and 1440px.

## Implementation Rules

- Before any UI edit, read `docs/00-engineering-standards.md` and `docs/10-ui-design-route.md`, then run `node scripts/dev-preflight.mjs` when shell access is available.
- Do not introduce a new UI framework unless the user approves.
- Prefer small focused components in `frontend/src/components/` and page shells in `frontend/src/pages/`.
- Use stable `data-testid` on interactive or E2E-critical elements.
- Keep TypeScript strict and avoid `any`.
- User-facing strings should be prepared for future i18n; do not scatter duplicated copy.
- Preserve UTF-8 without BOM.

## Required Checks After UI Changes

Run the project verification flow:

- Encoding check: `scripts\check-encoding.ps1`
- Frontend verify: `npm run verify`
- High audit: `npm run audit:high`

For feature continuation, the project gate is 100 full green verification runs via `scripts\verify-100.ps1`.

## E2E Expectations

Every new user-facing page or flow must add Playwright coverage for:

- Page visibility and key title.
- Main action button state.
- Responsive visibility at mobile, tablet, and desktop when relevant.
- Error/empty/loading state once data is introduced.
