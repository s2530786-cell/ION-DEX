# SESSION_STATE.md — Phase 5 ION DEX Frontend

## Current Task
**Phase 5 Step 7: E2E nav scoping** —杩涜涓?
## Cursor Automation (ACTIVE)
- YAML: `.cursor/automations/ion-dex-autonomous-build.yml`
- Repo: **s2530786-cell/ION-DEX** branch **2026-05-19-q7fx**
- Cloud env: `.cursor/environment.json` (Foundry + npm + Playwright)
- Linux verify: `bash scripts/agent-cloud-verify.sh`
- Preflight: `node scripts/automation-preflight.mjs`
- First P0 task: **P0-2 ION FunC test framework — current active task (2026-05-19 19:25)

## Last Commit
`7691be0` — feat(automation): 24/7 autonomous build pipeline

## Security Tests
✅ 16/16 green, 1500/1500 iterations —旺财 fixed 7 test logic bugs

## Architecture Audit Status
- P0 tasks remaining: refer to `.memory-bank/architecture-audit.md`
- Phase 5 frontend: AppShell ✅ E2E nav scoping (Step 7, in progress)
- Next after Phase 5: Bridge page, error handling, wallet integration

## Active Rules
- `.cursor/rules/ion-dex-iron-law.mdc` —7 iron laws, 1500 green security minimum
- `.cursor/rules/auto-audit.mdc` — auto-audit on file changes
- `.cursor/rules/12-factor-agents.mdc` — Zero Garbage, DAG-only


## Active Task (2026-05-20 03:00)

**TASK 6.1-6.2**: Sandwich Defense + Bridge Double-Signature (P0)

See: .memory-bank/task-sandwich-doublesig.md

### Quick Summary
1. pool.fc: commit-reveal anti-front-running + max 5% pool swap + block-level deadline
2. Bridge: 2-of-3 validator double-sig for transfers >
   - BSC side: EIP-712 + validator set in BSCFeeVault.sol
   - ION side: validator pubkey dict in bridge.fc or vault.fc

**Files to modify**: pool.fc, op.fc, errors.fc, BSCFeeVault.sol, vault.fc, params.fc
**New files**: IBridgeValidator.sol (interface)

**Step 0**: Read .memory-bank/task-sandwich-doublesig.md for full spec
