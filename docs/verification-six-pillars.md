# Verification six pillars

This document tracks the current verification baseline for ION DEX.

## Commands

- Encoding: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-encoding.ps1`
- Backend verify: `cd backend; npm run verify; npm run audit:high; npm run stress`
- Frontend verify: `cd frontend; npm run verify; npm run audit:high`
- Full verify: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-full.ps1`
- 100-pass gate: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-100.ps1`
- CMD save-log fallback: `scripts\verify-full-save-log.cmd`
- Playwright browsers once: `cd frontend; npx playwright install chromium`

## Status

1. Frontend UI: build plus Playwright smoke for 375, 768, and 1440 px viewports.
2. Backend: minimal mock API gateway with health/config/tokens/tickers, API tests, and local stress smoke.
3. Smart contracts: pending contract workspace and test harness.
4. Load tests: backend mock API stress smoke is wired; chain simulators and production-grade load tests remain pending.
5. Deployment: pending testnet deployment scripts and rollback runbook.
6. Security: npm high-severity audit is wired; XSS/CSRF and contract audit checks remain pending.

## Notes

All source files must remain UTF-8 without BOM and must not contain NUL bytes.

Feature development is gated by 100 consecutive full green verification runs. The gate runs encoding, backend verify, backend high-severity audit, backend stress smoke, frontend verify, and frontend high-severity audit each pass. If any pass fails, development stops until the failure is fixed and the 100-pass gate is rerun.
