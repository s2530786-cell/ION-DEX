# Verification six pillars

This document tracks the current verification baseline for ION DEX.  
Blueprint cross-reference: `docs/10`–`docs/17`, `docs/16` (mainnet gate).

## Commands

| Pillar | Command |
|--------|---------|
| Encoding | `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-encoding.ps1` |
| FunC + ION security | `node scripts\func-contract-test.mjs` ; `node scripts\func-security-audit.mjs` |
| BSC security 1500 | `cd contracts\bsc && forge test --match-contract SecurityAttackTest` |
| Dual-chain | `node scripts\dual-chain-audit.mjs` |
| Backend | `cd backend; npm run verify; npm run audit:high; npm run stress` |
| Frontend + E2E | `cd frontend; npm run verify; npm run audit:high` |
| Full verify | `scripts\verify-full-save-log.cmd --no-pause` |
| Agent quick | `scripts\agent-verify.cmd` |
| Iron law | `scripts\iron-law-security.cmd` |
| 100-pass gate | `powershell -File scripts\verify-100.ps1` |
| Scheduled (local) | `scripts\register-windows-scheduled-tasks.ps1` |

Playwright browsers once: `cd frontend; npx playwright install chromium`

## Status (2026-05-19)

| # | Pillar | Status | Evidence / gap |
|---|--------|--------|----------------|
| 1 | **Frontend UI** | 🟢 Wired | `npm run build` + Playwright smoke (375/768/1440). Pixel-perfect manual QA pending (`docs/07-verification-six-pillars.zh.md`). |
| 2 | **Backend** | 🟢 Wired | API tests + stress smoke 9 endpoints; **DB schema/migrations** (P0-3). Real RPC/CMC still mock → **P0-4** / `docs/12`. |
| 3 | **Smart contracts** | 🟢 Wired | FunC **22/22** + `func-contract-test` + **func-security-audit 1500**; BSC **SecurityAttackTest 16/16** (1500 iter). ION lacks TVM runtime fuzz parity with BSC (documented risk). |
| 4 | **Load tests** | 🟡 Partial | Backend stress smoke ✅; k6 production profile + bridge chaos pending (`docs/16`, `docs/14`). |
| 5 | **Deployment** | 🔴 Pending | Testnet deploy + rollback runbook → **P0-6**, `docs/10`, `docs/17` M5 checklist. |
| 6 | **Security (app + ops)** | 🟡 Partial | `npm audit:high` ✅; CSP/XSS/CSRF checklist in `docs/00-engineering-standards` §6 — not fully automated; external audit before mainnet (`docs/17`). |

## 100-pass gate

- Script: `scripts/verify-100.ps1` — each pass: **dual-chain-audit** → encoding → backend verify/audit/stress → frontend verify/audit.
- Pass criteria: `PASSED=100`, `RESULT=GREEN`, exit `0`.
- `backend-stress` retries once after 2s on failure.
- Feature development should not advance past a completed milestone without 100 green unless Master waives (`AGENTS.md`).

## Automation

- **CI:** `.github/workflows/ion-dex-verify.yml` (push/PR + dual-chain), `ion-dex-scheduled-gates.yml` (daily).
- **Local:** `docs/08-ci-agent-automation.md`, `.memory-bank/development-iron-law-preflight.md` §8.

## Dual-chain security parity (important)

| Chain | Gate | Nature |
|-------|------|--------|
| BSC | `SecurityAttackTest` Foundry | **Dynamic** execution, 1500 iterations |
| ION | `func-security-audit.mjs` | **Static** probes + compile, 1500 checks |

**Not equivalent:** ION 未达 BSC 同级 TVM 运行时模糊测试。主网前需路线图：TVM sandbox / 官方测试网 fuzz（见 `docs/12`、`docs/17` M5）。

### Pillar extensions (planned)

| Extension | Doc |
|-----------|-----|
| Bridge chaos | `docs/14` |
| Indexer consistency tests | `docs/12` |
| k6 production load | `docs/16` |
| TVM attack simulation | Phase 2+ |

## Notes

- All source files: **UTF-8 without BOM**, no NUL bytes.
- On Windows exit `-1073741502`, `verify-100.ps1` retries affected steps once.
