# ION DEX Frontend — Master Design Review Fixes
**Date:** 2026-05-22 | **Based on:** Master 3 design reference images + WeChat feedback

## ⚠️ 三张参考图在
- `C:\Users\admin\.openclaw\media\inbound\3ffce9e2-df07-48b3-9531-23d0301e41b7.jpg`
- `C:\Users\admin\.openclaw\media\inbound\a5c3b1a5-a899-48b9-b07e-a67ecb6f9a20.jpg`
- `C:\Users\admin\.openclaw\media\inbound\e2ebfdd6-a84d-40ed-af0b-7d89e189eaca.jpg`

**Take a screenshot of each reference image, then use Cursor's built-in vision model to analyze them.** Compare pixel-by-pixel against the live app at http://127.0.0.1:3001/

---

## Phase 1: Analyze Reference Images (FIRST)
1. Take agent-browser screenshots of all 3 reference JPGs
2. Compare with live screenshot of http://127.0.0.1:3001/
3. Identify EXACT gap areas between reference and current app:
   - Colors (extract hex codes from reference)
   - Layout (which zone is where, grid structure)
   - Card styles (border-radius, shadows, glass transparency)
   - Text styles (size, weight, color per area)
   - Spacing (gaps, margins, padding)
4. Write findings to `docs/design-gap-analysis.md`

## Phase 2: Fix Glass & Visual Quality
- [ ] ALL cards: `border-radius: 1.5rem` (24px) minimum. NO 0.5rem/8px corners.
- [ ] `backdrop-filter: blur(8px)` max — reduce from current 10px
- [ ] Card background: `rgba(6,16,36,0.12)` max — lighter than current 0.18
- [ ] Outer glow on every card: `0 0 32px rgba(36,247,255,0.35)` cyan + `0 0 24px rgba(255,59,212,0.2)` magenta
- [ ] Inner highlight: `inset 0 1px 0 rgba(255,255,255,0.15)` on all card tops
- [ ] Card border: `1px solid rgba(36,247,255,0.2)` — visible neon rim, not hidden
- [ ] Text headers: `color: #e0f0ff`, `font-weight: 800`, `font-size: 1.125rem`+
- [ ] Data numbers (price, TVL, APR): `color: #24f7ff` with `text-shadow: 0 0 12px rgba(36,247,255,0.4)`
- [ ] Chart backgrounds: `rgba(3,8,22,0.15)` — transparent enough to see aurora through

## Phase 3: Fix Layout
- [ ] **Header**: reduce from 65px to 52px (py-1.5 instead of py-2.5)
- [ ] **Desktop nav strip**: reduce from 43px to 36px (py-1, px-2)
- [ ] **Main content padding**: p-2 instead of p-3 (reduce top offset from ~140px to under 100px)
- [ ] **Dashboard grid layout**:
  - Row 1: SwapPanel (compact 280px max) + Stats cards side-by-side
  - Row 2: Market chart (fills available width) + OrderBook panel
  - Row 3: Feature cards grid (3 columns on desktop)
- [ ] **SwapPanel compact mode**: max height 320px (hide subtitle, source badge, slippage, same-token warnings, price impact)
- [ ] **Responsive**: on viewport < 640px, all cards stack vertically with 0.75rem gaps

## Phase 4: AppShell Fixes
- [ ] Page title visible on mobile (currently shows, verify)
- [ ] Home button (added) works → navigate to dashboard
- [ ] Language Globe2 button (added) → implement dropdown with EN/CN options, save to localStorage
- [ ] Remove all duplicate branding — logo only in sidebar (desktop) or mobile nav drawer
- [ ] Mobile nav drawer: glass background, slide from left, backdrop blur

## Phase 5: Restore Missing Features (per PRD docs/05-product-prd.md)
- [ ] Dashboard: real-time ticker strip (market data scrolling bar)
- [ ] Dashboard: wallet connection status card (shows connected wallet + balance)
- [ ] Swap page: full token selector with search, quote preview, minimum received, fee display
- [ ] Trade page: K-line chart + order book + limit order form + open orders + history
- [ ] Pool page: TVL, user LP positions, add/remove liquidity forms
- [ ] Stake page: official stake APY, user staked amount, stake/unstake forms
- [ ] Bridge page: ION ↔ BSC bridging UI with transaction history
- [ ] Burn page: dual-chain burn tracker with progress bars
- [ ] Domain page: ION DNS registry, search, register

## Phase 6: Polish
- [ ] AI chat widget: verify visible bottom-right, test Q&A flow
- [ ] Splash screen: verify shows on load, fades after 2.4s, never shows again
- [ ] Page transitions: smooth fade (already using framer-motion)
- [ ] Loading skeletons for all data-dependent cards
- [ ] Error states with retry buttons on all cards
- [ ] Footer with "ION DEX v1.0" + links

---

## Auto-Deploy After Each Phase
```bash
node skills/ion-dex-commander/scripts/git-auto-deploy.mjs D:\openclaw-tools\ion-dex-nuke
```

## Verification
After each phase:
1. `agent-browser reload http://127.0.0.1:3001/`
2. Take screenshot
3. Compare with reference image
4. Note improvements and remaining gaps
5. Continue to next phase

---

**DO NOT skip any phase. DO NOT leave mock/placeholder code. Every feature must work with real data.**
