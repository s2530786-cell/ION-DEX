---
name: ion-autonomous-work-resume
description: Detects stalled or stopped ION DEX work queues and resumes remaining steps until all work orders complete. Use when the user says work stopped, 怎么停了, continue autonomously, resume work orders, watchdog, or when SESSION_STATE / UI batch pipelines must not pause mid-flight.
---

# ION DEX — 自动续跑工单（Autonomous Work Resume）

## 何时启用

- 用户说「怎么停了」「继续」「不要停」「自动跑完所有工单」
- UI Batch / W 系列 / `verify-100` / stress×100 流水线中途无输出
- Agent 会话结束但 `SESSION_STATE.md` 仍有 `CURRENT_PHASE` 未完成

## 核心资产

| 路径 | 作用 |
|------|------|
| `.memory-bank/autonomous-work-queue.json` | 工单步骤队列（pending/running/completed/failed） |
| `.memory-bank/autonomous-work-watchdog-state.json` | 看门狗上次 tick 与各步 PID |
| `.memory-bank/autonomous-work-watchdog.log` | 续跑日志 |
| `scripts/autonomous-work-watchdog.mjs` | 检测停滞并启动下一步 |
| `scripts/run-autonomous-work-watchdog.cmd` | Windows 后台守护（90s 轮询） |

## 标准流程（Agent 必须执行）

1. **读队列**：`autonomous-work-queue.json` 中 `status: "active"` 的队列。
2. **读状态**：`SESSION_STATE.md` + `autonomous-work-watchdog-state.json`。
3. **不要并行第二路 verify-100**：若 `%TEMP%\ion-verify-100.lock` 存在且日志在更新 → 只等待 GREEN，不重复 `spawn`。
4. **启动看门狗**（有 shell 时）：
   ```bat
   scripts\run-autonomous-work-watchdog.cmd
   ```
   或单次探测：
   ```bat
   node scripts\autonomous-work-watchdog.mjs --once
   ```
5. **验证 GREEN**：读最新 `%TEMP%\ion-verify-100-summary-*.txt`，须 `PASSED=100 FAILED=0 RESULT=GREEN`。
6. **串行门禁（用户指定）**：`verify-full` → 截图 → **verify-100 全绿** → **立即 `autonomous-git-commit-push.mjs`** → **Batch C/D 全自动流水线**；`stress×100` 在 commit 之后由看门狗接续，不阻塞进入下一阶段。
7. **防误触发**：仅接受 `activatedAt` 之后的新鲜 `ion-verify-100-summary-*.txt`（避免 W4 旧 GREEN 提前 commit）。
8. **全部完成后**：将队列 `status` 改为 `completed`，更新 `SESSION_STATE.md` 与 `docs/99-current-progress.md`。

## 停滞判定与恢复

| 信号 | 动作 |
|------|------|
| `verify-100` 锁存在 + 日志 20 分钟内更新 | `external: true`，等待 |
| 锁超过 25 分钟且日志无更新 | 删除陈旧 `ion-verify-100.lock`，由看门狗重试 |
| `managedPid` 已退出且步骤非 completed | 标 `failed`，下一 tick 重试 pending |
| stress 与 verify-100 同时跑导致端口冲突 | **禁止**；等 verify-100 完成再启 stress |

## UI Batch 专用

- 完整流水线：`node scripts/ui-design-phase-pipeline.mjs --batch B --commit-push --auto-next`
- 门禁已由看门狗完成时：`--skip-gates`（跳过 preflight/verify-full/截图/stress）
- 差距报告模板：Batch B 见 `docs/ui-gap-analysis-batch-b-2026-05-26.md`

## 禁止事项

- verify-100 / stress 未 GREEN 时声称阶段完成
- 未经用户明确要求执行 `git push`（队列里 `commit-push` 步骤需与 Master 策略一致）
- 与终端里已在跑的 `verify-100.ps1` 抢锁（exit 2）

## 与用户沟通

- 汇报：当前步骤 id、external/managed、最新 summary 路径、看门狗 log 末行
- 失败时 3 行：类型 / 根因 / 修复（compact errors 铁律）
