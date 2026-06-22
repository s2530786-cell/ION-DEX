# TASK: ION DEX Frontend — 5 Pages UI Polish & Navigation

## Status: Pipeline READY
- Dev server: localhost:3000 (ON)
- Visual diff: 5/5 pages PASSING at 0.00% (baselines in .visual-screenshots/)
- Loop: monitoring src/ for changes, will auto-diff after each push

## Your Job

### Phase 1 — Polish existing pages
Read and understand these constraint files FIRST:
- src/lib/design-tokens.ts — ALL colors/spacing/effects
- src/components/layout/DEXGridHarness.tsx — grid layout
- .cursor/rules/ui-harness-protocol.mdc — engineering rules

Then polish these 5 pages (all in src/pages/):
1. **index.tsx** — Main DEXConsole. Add tab nav bar at top (Swap|Pool|Stake|Bridge) with neon glow active indicator
2. **swap.tsx** — SwapPanel + WalletHarness. Add token selector dropdowns, price impact display
3. **pool.tsx** — PoolPanel + WalletHarness. Add LiquidityPanel with pair display
4. **stake.tsx** — StakePanel + WalletHarness. Add staking stats (APY, TVL, your stake)
5. **bridge.tsx** — Bridge placeholder. Add BSC<->ION chain selector with arrow animation

### Phase 2 — Create unified DEXConsole
Create src/pages/DEXConsole.tsx that:
- Uses DEXGridHarness as wrapper
- Has tab navigation at top (cyan neon glow on active tab)
- Renders the selected page component
- Persists tab selection to localStorage

### CRITICAL RULES (zero tolerance):
1. ALL colors from `import { DesignTokens } from '@/lib/design-tokens'` — ZERO hardcoded hex/rgba
2. ALL pages wrapped in `<DEXGridHarness>`
3. Use existing components: SwapPanel, LiquidityPanel, PoolPanel, StakePanel, WalletHarness, NeonCard, PoolCard
4. CSS Grid only, no margin-based positioning
5. After changes, run: `node scripts/visual-diff.mjs all` — all pages must pass < 1% diff

### Verification
```bash
node scripts/visual-diff.mjs all
# Expected: 5/5 passed, 0.00% diff
```
