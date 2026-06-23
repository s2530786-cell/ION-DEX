You are working on the ION DEX project at D:\openclaw-tools\ion-dex-nuke.

## Task: Create Next.js page routes
The project has a single `src/pages/DEXConsole.tsx` that uses tab navigation for Swap/Pool/Stake. I need standalone pages for each + a home page.

## Engineering Rules (CRITICAL)
- ALL colors from `src/lib/design-tokens.ts` — NEVER hardcode hex/rgba values
- ALL pages wrap content in DEXGridHarness
- Follow existing code style in DEXConsole.tsx, SwapPanel.tsx, PoolPanel.tsx, StakePanel.tsx
- These components already exist: SwapPanel, LiquidityPanel, PoolPanel, StakePanel, WalletHarness, DEXGridHarness

## Create files:

**1. `src/pages/index.tsx`** — Home page rendering DEXConsole
```tsx
import DEXConsole from './DEXConsole';
export default function Home() { return <DEXConsole />; }
```

**2. `src/pages/swap.tsx`** — Standalone swap page
**3. `src/pages/pool.tsx`** — Standalone pool page
**4. `src/pages/stake.tsx`** — Standalone stake page
**5. `src/pages/bridge.tsx`** — Bridge page placeholder
**6. `next.config.ts`** — Basic config

## Verify
After writing, run: `npx next build` until no errors.
