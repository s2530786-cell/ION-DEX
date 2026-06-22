# P0 Frontend Task Queue — 2026-06-19 12:11

## Status
- Dev server: ON (localhost:3000)
- 5 pages: HTTP 200 (skeleton only)
- Harness: design-tokens.ts + DEXGridHarness.tsx + .cursorrules deployed
- Visual baselines: 5 pages captured
- Pipeline: pipeline-frontend.ps1 working

## P0 Tasks (in priority order)

### 1. Swap Page — Full Implementation
- File: `src/app/swap/page.tsx`
- Requirements:
  - Token select dropdown (ION/WBNB/USDT)
  - Amount input with "MAX" button
  - Price quote display (rate + slippage)
  - Swap button with confirmation
  - Use DesignTokens from `src/lib/design-tokens.ts`
  - Wrap in DEXGridHarness
  - Connect to PancakeSwap router (real contract, not mock)

### 2. Pool Page — Full Implementation
- File: `src/app/pool/page.tsx`
- Requirements:
  - Pool list with TVL/APR/Volume columns
  - Add Liquidity form (token pair + amounts)
  - Remove Liquidity form
  - Use PoolCard component from `src/components/DEX/PoolCard.tsx`
  - Real data from PancakeSwap subgraph/on-chain

### 3. Stake Page — Full Implementation
- File: `src/app/stake/page.tsx`
- Requirements:
  - Stake ION form (amount + duration selector)
  - Unstake form
  - Rewards display
  - APR calculator
  - Use StakePanel component

### 4. Bridge Page — Full Implementation
- File: `src/app/bridge/page.tsx`
- Requirements:
  - Chain selector (BSC ↔ ION)
  - Token selector
  - Amount input
  - Bridge status tracker
  - Use real bridge contract addresses

### 5. Home/Dashboard — Polish
- File: `src/app/page.tsx`
- Requirements:
  - ION price chart (from DexScreener/GeckoTerminal)
  - TVL display
  - 24h volume
  - Quick action cards (Swap/Pool/Stake/Bridge)

## Rules (READ BEFORE CODING)
1. READ `src/lib/design-tokens.ts` first — all colors/spacing from DesignTokens
2. READ `.cursorrules` — Zero-Visual-Discretion, Grid-Only, Asset-Img-Only
3. Wrap all pages in `DEXGridHarness`
4. NO mock data — connect to real PancakeSwap contracts
5. NO CSS hardcoded colors — use DesignTokens only
6. Before outputting code, state "Layout Intent Analysis"
7. After each page: run `npx playwright test` for visual regression
