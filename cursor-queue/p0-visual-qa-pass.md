# TASK: Visual Diff QA Pass — All 5 Pages

## Context
Pipeline infra is ready. 5 pages (index/swap/pool/stake/bridge) are rendering at localhost:3000.
Baseline screenshots exist in .visual-screenshots/.

## Your Job
1. Run `node scripts/visual-diff.mjs` to compare current render vs baselines
2. For each page with pixel diff > 0%:
   - Identify which component caused the deviation
   - Fix the component (ONLY modify DesignTokens.ts values — NO hardcoded colors)
   - Re-run diff until < 1%
3. After all 5 pass: create a DEXConsole page that routes between the 5 pages with tab navigation

## Constraints
- ALL colors from src/lib/design-tokens.ts — NEVER hardcode hex/rgba in components
- ALL pages wrapped in DEXGridHarness (src/components/layout/DEXGridHarness.tsx)
- Use existing components: SwapPanel, PoolPanel, StakePanel, WalletHarness, NeonCard
- .next/ is gitignored — don't worry about it

## Verification
After each fix, run: node scripts/visual-diff.mjs
Target: 5/5 pages with < 1% pixel diff
