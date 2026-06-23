# BUGBOT.md

## ION DEX Review Rules

Review this repository as an engineering-grade production DEX for the ION ecosystem.

## Required Review Focus

- Treat swap, trade, grid, pool, staking, bridge, burn, treasury, fee, wallet, DNS, identity, oracle, and AI risk-monitoring code as security-sensitive.
- Flag any change that can move, lock, mint, burn, bridge, price, route, or account for assets unless it has explicit validation, authorization, and test coverage.
- Flag missing checks for slippage, deadlines, replay protection, nonce handling, chain IDs, decimal precision, overflow/underflow, fee rounding, pool invariants, oracle freshness, and bridge replay/finality assumptions.
- Flag frontend changes that add or modify user actions without stable `data-testid` selectors and Playwright coverage.
- Flag UI changes that break the OKX Web3 / cyberpunk neon / glassmorphism design direction or responsive behavior.
- Flag backend/API/data changes that lack source validation, cache strategy, timeout handling, error handling, and clear trust boundaries.
- Flag contract or sentinel changes that do not consider reentrancy, access control, MEV/front-running, oracle manipulation, upgrade/admin key risk, and emergency pause behavior.

## Verification Requirements

- All source files must remain UTF-8 without BOM and contain no NUL bytes.
- Do not accept a change as complete without concrete verification evidence.
- Expected baseline verification is:
  - encoding check
  - frontend build
  - Playwright E2E smoke tests
  - high-severity npm audit
- Before continuing feature development after a completed change, the project must pass 100 consecutive full green verification runs unless the user explicitly waives that gate for a narrow investigation.

## Review Output Style

- Prioritize real bugs, security risks, regressions, missing tests, and broken verification.
- Put findings first, ordered by severity.
- Cite the specific file or symbol involved.
- Avoid low-value style comments unless the style issue can cause maintenance, security, or product-quality risk.
- If there are no blocking issues, say so clearly and mention any remaining test or security-review gaps.
