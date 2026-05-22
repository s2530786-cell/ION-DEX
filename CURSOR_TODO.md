# CURSOR TODO — Master Review Fixes

**Branch:** cursor/ui-design-workflow-44c9
**Last commit:** 58b0918f
**Deadline:** Fix all items below before next commit

## 🔴 P0 — Visual Quality (Master says "一团糟")

### Phase 1: Border & Glass
- [ ] All `.neon-glass-card`: `border-radius: 1.5rem` minimum. Check every single card.
- [ ] All `.glass-hud-panel`: `border-radius: 1rem` minimum
- [ ] `.glass-shell-frame`: `border-radius: 2rem`
- [ ] All `::before` pseudo borders: `border-radius: inherit`
- [ ] `.neon-glass-card__inner`: update to exact values from mandate.mdc (bg 0.28, blur 14px, box-shadow)
- [ ] `.glass-shell-frame`: update bg to 0.12, border 1.5px cyan, blur 10px

### Phase 2: Text Brightness
- [ ] Dashboard card titles: `text-white font-extrabold text-lg`
- [ ] Data values (TVL, APR, Price): `text-[#24f7ff]` with `text-shadow: 0 0 12px rgba(36,247,255,0.45)`
- [ ] Secondary labels: `text-[#8ab4d8]` never gray
- [ ] Check all frontend components — NO `text-gray-*`, NO `#6b7280`

### Phase 3: Layout Fix
- [ ] **Header height**: reduce `py-3` to `py-2`, max height 56px
- [ ] **Main content top**: must be < 120px from viewport top (currently 153px)
- [ ] **Check**: `document.querySelector('[data-testid=page-dashboard]').getBoundingClientRect().top < 120`
- [ ] **Dashboard grid**: mobile single-col, xl: 2-col Swap+Stats, then Market+OrderBook
- [ ] **SwapPanel compact**: max 400px height → hide validations, reduce padding to `p-2`

### Phase 4: Navigation Features
- [ ] Home button: `<Home size={18} />` in header → `onClick={() => onPageChange("dashboard")}`
- [ ] Language button: `<Globe2 size={18} />` → opens `LanguageSwitcher` dropdown (EN/中文/日本語)
- [ ] Language store: persist to `localStorage('ion-lang')`, apply to all UI text
- [ ] Mobile header: show page title + logo, not hidden

### Phase 5: Logo/Icon Cleanup
- [ ] Sidebar logo: 36x36px (reduce from 40x40)
- [ ] Mobile logo: 32x32px
- [ ] SwapPanel `IonDexBrandEmblem`: in compact mode, hide logo+halo, show only `<ArrowDownUp />`

## 🟡 P1 — Missing Features (来自 PRD docs/05-product-prd.md)
- [ ] Real-time ticker strip (ION + mainstream assets) — AppShell header
- [ ] Wallet connect: show connected state (green dot + truncated address)
- [ ] Stake page: official staking stats + DEX staking info
- [ ] Pool page: LP token management
- [ ] Burn page: dual-chain burn tracker

## 🟢 P2 — Polish
- [ ] `transition-all duration-300` on all cards
- [ ] Hover: `scale(1.02)` on desktop only
- [ ] Loading skeletons with pulse animation
- [ ] Error states: styled retry button with icon

---

**验证命令（Cursor 完成后执行）:**
```
node skills/ion-dex-commander/scripts/audit-local-code.mjs .
node skills/ion-dex-commander/scripts/git-auto-deploy.mjs .
```
