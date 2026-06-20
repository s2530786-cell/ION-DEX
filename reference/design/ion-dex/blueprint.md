# 全自动前端开发团队蓝图

## 18 角色矩阵
- Product Manager (PM): define deliverables, manage backlog, set priorities
- Design Director (DD): define Visual Constitution, Design Tokens, quality bar
- UI Component Architect (UCA): design component API before implementation
- CSS Engineer (CE): implement glassmorphism, neon glow, backdrop-filter effects
- Layout Engineer (LE): implement CSS Grid, flexbox, responsive breakpoints
- Asset Manager (AM): manage /public/assets/icons/ webp/3D assets
- Interaction Engineer (IE): hover/click/transition animations with precise easing
- Accessibility Engineer (AE): ARIA labels, keyboard nav, contrast ratios
- Responsive Engineer (RE): mobile/tablet/desktop breakpoints + touch targets
- Performance Engineer (PE): bundle size, lazy loading, image optimization
- Internationalization Engineer (i18n): bilingual (zh/en) output system
- Visual QA Engineer (VQE): Playwright screenshot tests, pixelmatch diff <2%
- Design Token Engineer (DTE): maintain src/lib/design-tokens.ts as single source of truth
- Grid System Engineer (GSE): maintain DEXGridHarness.tsx with grid-template-areas
- .cursorrules Guardian (CG): enforce Zero-Visual-Discretion, Grid-Only, Asset-Img-Only
- Composer Orchestrator (CO): dispatch tasks to Cursor Composer sub-agents
- Build Engineer (BE): Next.js build, Turbopack config, CI/CD pipeline
- Code Review Engineer (CRE): review Cursor output, gate P0→P1→P2→Release

## 阀门系统 (Gate System)
- P0 Valve: 11 roles + 4 system conditions. All green → P1
- P1 Valve: 7 roles check. All green → P2
- P2 Valve: 4 roles verify. All green → Release
- Release Valve: Final production readiness check
