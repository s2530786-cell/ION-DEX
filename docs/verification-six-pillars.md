# Verification six pillars

This document tracks the current verification baseline for ION DEX.

## Commands

- Encoding: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-encoding.ps1`
- Frontend verify: `cd frontend; npm run verify`
- Full verify: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-full.ps1`
- 100-pass gate: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-100.ps1`
- CMD save-log fallback: `scripts\verify-full-save-log.cmd`
- Playwright browsers once: `cd frontend; npx playwright install chromium`

## Status

1. Frontend UI: build plus Playwright smoke for 375, 768, and 1440 px viewports.
2. Smart contracts: pending contract workspace and test harness.
3. Backend: pending API workspace.
4. Load tests: pending once backend and chain simulators exist.
5. Deployment: pending testnet deployment scripts and rollback runbook.
6. Security: npm high-severity audit is wired; XSS/CSRF and contract audit checks remain pending.

## Notes

All source files must remain UTF-8 without BOM and must not contain NUL bytes.

Feature development is gated by 100 consecutive full green verification runs. The gate runs encoding, frontend verify, and high-severity npm audit each pass. If any pass fails, development stops until the failure is fixed and the 100-pass gate is rerun.
