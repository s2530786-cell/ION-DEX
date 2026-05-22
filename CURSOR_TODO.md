# CURSOR TODO — Complete Feature Implementation

**Branch:** cursor/ui-design-workflow-44c9
**Status:** 12:30 GMT+8 — Layout broken, many features missing, visual gap from design spec

---

## 🔴 PHASE 1 — Layout & Responsive Fix (P0)

### Problem
Master says: top half empty, everything pushed to bottom. Content layout broken on all viewports.

### Tasks
- [ ] Dashboard grid: `grid-cols-1 lg:grid-cols-[1fr_20rem]` for each row. On mobile (<768px) each card full-width
- [ ] Swap section: compact on dashboard, full page on /swap route
- [ ] Market chart + OrderBook: side-by-side on desktop, stacked on mobile
- [ ] Feature cards: `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6` — 6 feature cards in one row on desktop
- [ ] Header: sticky `top-0 z-50` on scroll
- [ ] NO empty gaps between sections. Every `gap` value: desktop 1.25rem, mobile 0.75rem
- [ ] Page content: max-width 1440px centered, padding 1rem mobile / 2rem desktop

---

## 🔴 PHASE 2 — Missing V1 Features (P0)

### PRD section: V1 Scope

- [ ] **Dedicated Swap page** (`/swap`): Full token pair selection + quote + slippage + min-received + protocol fee display + wallet confirmation flow. PRD specifies: Token pair selection, BNB/ION market buy flow, ION pair swap flow, Quote preview, Minimum received, Protocol fee in ION, Price impact, Slippage setting, Transaction simulation, Wallet confirmation status.
- [ ] **Dedicated Trade page** (`/trade`): K-line + orderbook side-by-side + market trades list + limit order form + user open orders + order history. PRD: K-line chart, Order book or depth visualization, Market trades, Limit order form, User open orders, User order history, Risk hints.
- [ ] **Dedicated Pool page** (`/pool`): LP positions list + add/remove liquidity + yield display + fee earnings tracker
- [ ] **Dedicated Stake page** (`/stake`): Stake/unstake form + APY display + reward claim + stake history
- [ ] **Dedicated Burn page** (`/burn`): Dual-chain burn tracker (BSC+ION mainnet) + burn rate chart + remaining supply counter + burn transaction list
- [ ] **Dedicated Bridge page** (`/bridge`): BSC↔ION bridge with direction selector + amount input + gas estimate + transaction status tracker
- [ ] **Transparency page** (new route): Treasury balances, fee allocation, governance metrics
- [ ] **Profile menu**: Click wallet chip → dropdown with: Copy address, View on explorer, Transaction history, Disconnect. PRD section: Wallet connection shell, Profile menu shell.

---

## 🔴 PHASE 3 — UI/UX Components (P0)

- [ ] **Language switcher**: Wire up Globe2 button. Create `<LanguageSwitcher>` component with EN/中文/日本語. Store choice in localStorage. Translate all UI labels. Minimum: nav items + button labels.
- [ ] **Notification bell**: Wire up Bell icon → notification dropdown. Show: tx confirmations, price alerts, system messages
- [ ] **Search bar**: Add search input in header for token/contract search
- [ ] **Dark/Light mode toggle**: (optional per design spec)
- [ ] **Splash/loading screen**: Remove or keep minimal — Master says "开机动画也不是我要的效果"

---

## 🟡 PHASE 4 — Visual Polish (P1)

### Exact Design Values (from Master's reference image):

- [ ] Card border-radius: ALL cards `1.5rem` minimum. No sharp corners ANYWHERE.
- [ ] Glass card spec:
  ```
  background: rgba(6, 16, 36, 0.3)
  backdrop-filter: blur(16px) saturate(1.35)
  border: 1px solid rgba(36, 247, 255, 0.25)
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), 0 0 56px rgba(36,247,255,0.18), 0 0 42px rgba(255,59,212,0.12)
  ```
- [ ] Text colors: Headers `#e0f0ff`, Body `#8ab4d8`, Labels `#5a7a9a`
- [ ] Data numbers (TVL, APR, price): `#24f7ff` with `text-shadow: 0 0 12px rgba(36,247,255,0.5)`
- [ ] Grid gap: 1rem between all cards
- [ ] Hover effect: `scale(1.01)` + brightness bump on all cards
- [ ] Chart canvases: fill container, no 100px+ whitespace inside

---

## 🟢 PHASE 5 — Data & API (P1)

- [ ] All API endpoints return live data (not mock). Switch `ION_DATA_MODE=live`
- [ ] `CMC_API_KEY=342475df9fa5451aafbb3346be049f03` configured
- [ ] Cache layer: stale-while-revalidate, 30s TTL for prices, 5min for TVL/APR
- [ ] Error states: retry button + "Last updated X min ago" timestamp on every data card
- [ ] Loading states: skeleton shimmer on every data-dependent component

---

## 🟢 PHASE 6 — Mobile Responsiveness (P2)

- [ ] Touch-friendly: buttons min 44x44px tap target
- [ ] Bottom sheet for token selection on mobile swap
- [ ] Swipe-able ticker strip
- [ ] Bottom nav bar on mobile (Home / Swap / Trade / More)
- [ ] Safe area insets for notched phones

---

## Auto-Deploy
```bash
node skills/ion-dex-commander/scripts/git-auto-deploy.mjs D:\openclaw-tools\ion-dex-nuke
```
