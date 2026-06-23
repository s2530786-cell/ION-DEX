## ION-DEX PoolCard Dev Task | 2026-06-19 01:10 CST

### Task: Implement "Pool Overview Card" component

### Engineering Base (already deployed)
- .cursorrules — 3-layer iron law
- src/lib/design-tokens.ts — visual tokens
- src/components/layout/DEXGridHarness.tsx — grid harness

### Target: src/components/DEX/PoolCard.tsx

### Step 1: Intent Analysis (output BEFORE writing code)
- State which grid-column / grid-row the PoolCard will occupy in DEXGridHarness
- List DesignTokens to reference: glassBase, neonCyan, neonMagenta, textPrimary, textSecondary
- List effect tokens: cardGlow, backdropBlur
- List dimension tokens: borderRadius, panelGap, panelPadding
- Icon path: /public/assets/icons/pool-cube.webp (if missing, use text placeholder alerting Master)

### Step 2: Constraint Check
- Zero hardcoded hex/rgba/css values — all from DesignTokens
- No fixed/absolute positioning
- 3D icons use img tag, never CSS/SVG

### Step 3: Code
Output full React TypeScript component:
- Glass card: DesignTokens.colors.glassBase + effects.cardGlow + effects.backdropBlur
- Header: 3D icon + "Pool" title (textPrimary, 24px bold)
- TVL row: textSecondary label / textPrimary monospace number
- APR row: textSecondary label / neonCyan bold
- Footer: Add / Remove buttons (neonCyan/neonMagenta borders + semi-transparent bg)
- hover:scale-[1.01] micro-interaction

### CRITICAL: Zero hardcoded colors. Every visual value from DesignTokens.
