# CURSOR TODO — Auto-generated 2026-05-22T04:20:00.000Z

**Branch:** cursor/ui-design-workflow-44c9
**Last commit:** 346b186c
**Changed files:** glass-shell-frame, neon-glass-card__inner, glass-hud-panel, AppShell header

## Priority Tasks (P0 → P2)

### 🔴 P0 — Visual Quality: Match Reference Screenshot

Master says current state: borders sharp, contrast too dark, glass blurry. Reference image shows bright, crisp glass with clearly rounded corners.

**Exact Fix Values:**
- [ ] All card `border-radius` ≥ 24px (1.5rem). Check: glass-shell-frame, neon-glass-card, all section cards. NO 8px or 12px corners.
- [ ] `box-shadow` outer glow: cyan `0 0 32px rgba(36,247,255,0.25)` on every glass card
- [ ] `box-shadow` inner highlight: `inset 0 1px 0 rgba(255,255,255,0.2)` on card tops
- [ ] `border` on cards: `1px solid rgba(36,247,255,0.25)` visible rim
- [ ] Text headers: `#e0f0ff` (not dull gray), `font-weight: 800`, `font-size: 1.1rem+`
- [ ] Data numbers (TVL, APR, Price): `#24f7ff` cyan glow, `text-shadow: 0 0 12px rgba(36,247,255,0.5)`
- [ ] Chart backgrounds: `rgba(3,8,22,0.25)` not black/dark
- [ ] Grid gaps between cards: 1rem (not crammed)

### 🔴 P0 — Missing Features

- [ ] **Language selector**: Wire up the Globe2 button to toggle EN/CN/ZH. Create a simple `LanguageSwitcher` component with a dropdown. Store choice in localStorage. Apply to all UI text.
- [ ] **Back-to-home**: Home button added to header (done). Wire it to actually navigate.
- [ ] **Mobile header**: Current page name visible on mobile (not just hidden)

### 🟡 P1 — Layout Fixes

- [ ] Dashboard cards should be `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4` (max 11 cards)
- [ ] Kline/OrderBook charts must fill their containers (no 200px empty space)
- [ ] Token search input in Swap panel: auto-focus on open
- [ ] Wallet connect button: show connected state (green dot + truncated address)

### 🟢 P2 — Polish

- [ ] Add `transition-all duration-300` to all glass cards for hover effect
- [ ] Hover: `scale(1.01)` + `brightness(1.1)` on glass cards
- [ ] Loading skeletons: use `animate-pulse bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-cyan-500/10`
- [ ] Error states: show retry button + icon (not plain text)

## Auto-Deploy
```bash
node skills/ion-dex-commander/scripts/git-auto-deploy.mjs D:\openclaw-tools\ion-dex-nuke
```
