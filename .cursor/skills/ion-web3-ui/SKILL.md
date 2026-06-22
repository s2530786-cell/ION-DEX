---
name: ion-web3-ui
description: Guides ION DEX frontend UI development. Use when building or modifying React, Vite, Tailwind, dashboard, trading, swap, grid, staking, bridge, burn, domain, AI analysis, wallet, or profile screens. Enforces OKX/Web3-inspired neon cyberpunk design, responsive behavior, accessibility, and E2E coverage.
---

# ION Web3 UI

## New feature blocks (global consistency)

**Every new page, modal, panel, or feature section must use the same Master template style as existing ION DEX UI.** Do not invent a parallel visual language.

- Reuse existing primitives (`NeonGlassCard`, `NeonButton`, `FeatureTile`, `PageHero`, `AuroraGalaxyBackground`, `.flow-border`).
- Use CSS tokens only (`--ion-cyan`, `--ion-purple`, `--ion-magenta`, `--glass-*`, `--panel-radius`).
- Pick the closest reference screen from `.memory-bank/design-refs/screens/` (see `ui-design-master-template.md` §0.2).
- Complete the pre-delivery checklist in `ui-cyber-glass-iron-law.md` §0.1 before claiming done.

## Design Direction

**Mandatory:** Before any UI edit, read:

1. `.memory-bank/ui-cyber-glass-iron-law.md` (locked tricolor, layout, glass CSS)
2. `.memory-bank/ui-design-master-template.md` + open matching file under `.memory-bank/design-refs/screens/` (Master design template; run gap-analysis workflow §4)

ION DEX UI must feel like a premium OKX Web3-style trading product:

- Dark blue/purple base, cyberpunk neon, glassmorphism, aurora and galaxy motion.
- **Colors locked:** `#00FFFF` / `#6020FF` / `#FF00FF` only for primary gradients (CSS vars in `global.css`).
- 4D liquid-glass panels with translucent depth, glossy highlights, aurora reflections, and rounded irregular card silhouettes when appropriate.
- Thick luminous cyan/magenta/violet neon rims on hero cards and feature tiles; major cards should look like glowing glass objects, not flat bordered divs.
- 3D floating icons/cards for feature modules such as Pool, Bridge, Burn, Domain, Trade, Grid, and AI.
- Galaxy/starfield/aurora backgrounds must be visually dominant behind the product surface.
- Thin refined neon borders are acceptable only for dense trading internals; hero surfaces require stronger liquid-glass neon treatment.
- No rough placeholder cards, no plain unfinished panels.
- Flat table-line layouts, grey strip controls, tiny compressed text, and plain engineering forms fail the UI standard even if tests pass.
- Empty data, pseudo-code, fake placeholder content, and invented demo values are forbidden as product UI content. Use concrete typed data integrations from the backend/data memory, source adapters, cache, indexer, upstream APIs, or reviewed local seed data only.
- Loading and error states are allowed only as real request lifecycle states for concrete data integrations; they must not replace missing product data or mask unfinished implementation.
- Use existing UI primitives first: `NeonCard`, `NeonButton`, `AuroraGalaxyBackground`.
- Keep layout responsive for 375px, 768px, and 1440px.

## Implementation Rules

- Before any UI edit, read `docs/00-engineering-standards.md`, **`.memory-bank/ui-cyber-glass-iron-law.md`**, **`.memory-bank/ui-design-master-template.md`**, `.memory-bank/design-refs/README.md`, `.memory-bank/overall-design-framework.md`, `.memory-bank/live-data-reference.md`, `.memory-bank/implementation-playbook.md`, `.memory-bank/architecture-audit.md`, and `docs/10-ui-design-route.md`, then run `node scripts/dev-preflight.mjs` when shell access is available.
- After UI edits: compare implementation to the screen PNG (1440px); document gaps using the template in `ui-design-master-template.md` §5 until P0=0.
- For wallet/profile/avatar work, retrieve the Profile Hub requirements from `.memory-bank/overall-design-framework.md` and search Git history if anything is unclear.
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
- Real loading and error lifecycle states once data is introduced. Do not add empty-data UI as a substitute for missing integrations.
