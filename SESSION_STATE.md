# CO Scheduler — Frontend Team Task Dispatch | 2026-06-24 17:15 CST

## Dispatch Round Summary

| Field | Value |
|-------|-------|
| Dispatch round | 2026-06-24 17:15 CST (re-validation) |
| Prior dispatch | 2026-06-24 17:07 CST |
| Queue read | cursor-queue/ 4 files (0001-p0-pages-task, p0-frontend-tasks, p0-visual-qa-pass, p1-ui-polish) |
| Queue result | cursor-queue-result/ 8 archived |
| Queue delta | **No new tasks.** All 4 queue files unchanged since 01:01 CST. |
| Source delta | `src/pages/` not yet created → BE task not executed |
| Action | **No re-dispatch.** Prior dispatch (17:07) still valid. |

## Dispatch (task → role, keyword-scored)

| # | Task | Primary Role | Keywords Matched | Score |
|---|------|-------------|-------------------|-------|
| P0-1 | Page Routes & Build Config | **BE** | build/config/next | BE=3 |
| P0-2 | Visual Diff QA Pass | **VQE** | test/visual/screenshot/diff/QA/baseline | VQE=6 |
| P0-3 | Swap Page Full Implementation | **UCA** | component/api/interface/swap/router | UCA=5 |
| P0-4 | Pool Page Full Implementation | **UCA** | component/api/interface/pool | UCA=4 |
| P0-5 | Stake Page Full Implementation | **UCA** | component/api/interface/stake | UCA=4 |
| P0-6 | Bridge Page Full Implementation | **UCA** | component/api/interface/bridge | UCA=4 |
| P0-7 | Home/Dashboard Polish | **LE** | layout/grid/dashboard | LE=2, PM=1 |
| P1-1 | UI Polish & Navigation | **CE** | glow/polish/style | CE=2, IE=1, GSE=1 |

## Execution Order

```
P0 → BE (Page Routes) → VQE (Visual Diff QA Pass)
       ↓
       UCA×4 (Swap→Pool→Stake→Bridge) + LE (Home Dashboard)
       ↓
P1 → CE (UI Polish & Navigation)
```

## Valve Status

| Valve | Status | Detail |
|-------|--------|--------|
| P0 Valve | 🔹 IN PROGRESS | BE×1 + VQE×1 + UCA×4 + LE×1 pending execution |
| P1 Valve | 🔒 BLOCKED | Awaiting P0 Valve all-green |
| P2 Valve | 🔒 BLOCKED | Awaiting P1 Valve all-green |
| Release Valve | 🔒 BLOCKED | Awaiting P2 Valve all-green |

## Role Assignment Summary

| Role | Tasks | Permission | Active |
|------|-------|------------|--------|
| BE | 1 (P0-1) | R1→R2 config/build | ✅ |
| VQE | 1 (P0-2) | R1 source/config/build/deploy | ✅ |
| UCA | 4 (P0-3~P0-6) | R2 source | ✅ |
| LE | 1 (P0-7) | R2 source | ✅ |
| CE | 1 (P1-1) | R2 source | 🔒 P1 blocked |

## Completed Queue (cursor-queue-result/)

| # | Task | Archive File |
|---|------|-------------|
| 001 | FunC full compile + Forge Build | 001-func-compile-and-forge-build.md |
| 002 | 100-round stress test + Gas baseline | 002-stress-test-100-rounds.md |
| 003 | Real contract address replacement + on-chain hookup | 003-real-contracts-and-data.md |
| 004 | Unified ION fee logic | 004-ion-only-fees.md |
| 005 | UI polish + responsive adaptation | 005-ui-polish-responsive.md |
| 006 | Testnet deploy + E2E verification | 006-testnet-deploy-e2e.md |
| 007 | ION DEX Phase 1 Swap+Pool | 007-ion-dex-phase1-swap-pool.md |
| pool-card | PoolCard component development | pool-card-task.md |

## Output Files

- `D:\openclaw-tools\ion-dex-nuke\.cursor\rules\current-tasks.mdc` — Unchanged (17:07 CST, still valid)
- `D:\openclaw-tools\ion-dex-nuke\SESSION_STATE.md` — Updated (17:15 CST, re-validation)
