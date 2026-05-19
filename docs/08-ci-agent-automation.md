# CI and agent automation

## 自动工作流列表（Agent 必遵 — 对齐铁律 / Memory Bank）

每次开发会话按顺序执行；任一步失败则**停在当前步修复**，不得跳步或带着红/黄状态前进。

| 步 | 动作 | 命令 / 入口 | 通过标准 |
|----|------|-------------|----------|
| 0 | **读记忆 + 铁律** | `.memory-bank/README.md` → **`.memory-bank/development-iron-law-preflight.md`** → `.cursor/rules/ion-dex-iron-law.mdc` → `docs/99-current-progress.md` → `SESSION_STATE.md` | 明确 Phase；双链 1500 / 100 绿 / 压力测试命令 |
| 1 | **选 Skill** | 合约 `ion-contract-audit`；前端 `ion-web3-ui`；后端 `ion-data-backend`；流程 `cursor-engineering-workflow` | 与改动域一致 |
| 2 | **编译 FunC** | `node scripts/compile-func.mjs` | **22/22** 绿（deployable roots + fragment probes） |
| 3 | **合约审计** | `.cursor/skills/ion-contract-audit/SKILL.md`（15 类攻击清单） | 无未修复严重项；BSC 改动另跑 `forge test` |
| 4 | **实现 / 修复** | 单职责、单文件优先；UTF-8 无 BOM；零垃圾 JSX/FunC | 每修一个文件 → 重跑步 2 |
| 5 | **单次全量验证** | `scripts\agent-verify.cmd` 或 `scripts\verify-full-save-log.cmd --no-pause` | exit **0**；日志 `%TEMP%\ion-verify-full.txt` |
| 6 | **git commit** | 一合约 / 一页面 / 一服务 ≈ 一提交 | 信息可追溯 |
| 7 | **100-pass 铁门** | `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\verify-100.ps1` | **PASS 100/100**，**RESULT=GREEN**，exit **0** |
| 8 | **更新进度** | `docs/99-current-progress.md` + `SESSION_STATE.md` | 附命令输出证据 |
| 9 | **push** | `git push origin 2026-05-19-q7fx` | 远程与本地一致 |

**100-pass 每轮子步骤**（`verify-100.ps1` 内顺序）：`func-compile` → encoding → backend verify → backend audit:high → backend stress → frontend verify → frontend audit:high。Windows 退出码 `-1073741502` 每步自动重试一次。

**保存时自动门**（不必等 Agent 手动触发）：

- Cursor Hook `afterFileEdit` / `afterTabFileEdit` → `node scripts/ion-on-save-pipeline.mjs --cursor-hook`（编码快检 + FunC 全量编译）
- Agent **stop** → `.cursor/hooks/ion-verify-on-stop.cmd`（FunC + `agent-verify`）
- VS Code **Ctrl+S**（需扩展 `emeraldwalk.RunOnSave`）→ 同上 pipeline

**VS Code 任务**（`.vscode/tasks.json`）：`ION DEX: autonomous workflow (preflight+compile+verify)`（默认测试任务，一键步 0+2+5）| `compile-func.mjs` | `agent-verify (noninteractive)` | `verify-full-save-log --no-pause` | `verify-100.ps1`。

**本地一键全自动门**（Windows）：`scripts\agent-autonomous-workflow.cmd` → `automation-preflight.mjs` → `compile-func.mjs` → `agent-verify.cmd`。

### 定时 / 无人值守自动门（2026-05-19）

| 场景 | 命令 / 入口 |
|------|-------------|
| 统一入口（设模式） | `set ION_AUTO_MODE=quick\|standard\|iron\|verify100\|dual100` 后 `scripts\automation-scheduled-gate.cmd` |
| 注册 Windows 计划任务 | `powershell -File scripts\register-windows-scheduled-tasks.ps1` → 30m quick、日 standard、日 iron |
| 100 绿后台长跑 | `scripts\start-verify-100-background.cmd` → 日志 `%TEMP%\ion-verify-100-bg-*.log` |
| VS Code 任务 | `ION DEX: auto gate (standard)` / `iron-law-security` / `verify-100 (background)` |
| GitHub 每日 | `.github/workflows/ion-dex-scheduled-gates.yml`（02:30 UTC） |
| PR/Push | `.github/workflows/ion-dex-verify.yml`（含 dual-chain-audit） |

`verify-100.ps1`：每轮 `backend-stress` 失败会 **自动重试 1 次**（2s 间隔），降低长跑偶发失败率。

## Session startup — read memory before coding

Agents should hydrate context in this order:

1. **`.memory-bank/README.md`** — permanent Master rules + file index.  
2. **`docs/99-current-progress.md`** — authoritative progress and last verification evidence.  
3. **`SESSION_STATE.md`** — narrative / backlog (may drift; reconcile against `docs/99`).  

After substantive edits: **`scripts\agent-verify.cmd`** or **`scripts\verify-full-save-log.cmd --no-pause`** (non-interactive). Cursor **stop** hook runs **`ion-verify-on-stop.cmd`** (FunC probe + **`agent-verify`**) unless disabled.

## Goal

Run the same verification humans use, **without** interactive `pause`, so agents and CI do not block waiting for keyboard input.

## Commands

| Scenario | Command |
|----------|---------|
| Agent / CI / hooks (no pause) | `scripts\agent-verify.cmd` |
| Save full log to `%TEMP%\ion-verify-full.txt`, optional pause at end | `scripts\verify-full-save-log.cmd` |
| Save log, never pause | `scripts\verify-full-save-log.cmd --no-pause` |
| Interactive debugging with pause on failure | `scripts\verify-full.cmd` (no `CI` / no `ION_VERIFY_NONINTERACTIVE`) |
| 100 sequential green gates (long) | `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\verify-100.ps1` |

Environment variables recognised by `scripts\verify-full.cmd`:

- `CI` — skip all pauses (GitHub Actions sets this).
- `ION_VERIFY_NONINTERACTIVE=1` — skip all pauses (used by `agent-verify.cmd`).

### `verify-100.ps1` passes (ordering)

Each numbered pass runs, in order: **`func-contract-test`** (`node scripts\func-contract-test.mjs` — includes `compile-func.mjs` 22/22 + 6 deployable `codeBoc` golden checks), **encoding**, **backend verify**, **backend audit:high**, **backend stress**, **frontend verify**, **frontend audit:high**.

If **`encoding`** exits non‑zero, the script **sleeps briefly and retries `check-encoding.ps1` once** (helps with rare editor BOM races).

Each **`func-compile`** / **`backend-verify`** / **`frontend-verify`** phase is also wrapped by **`Run-StepResilient`**: exit **`-1073741502`** (native **`0xC0000142`**, **`STATUS_DLL_INIT_FAILED`**, often nested `cmd`/`npm`) triggers **one retry** before the pass fails.

If the embedded Cursor terminal still flakes on long gates, launch **`scripts\verify-100.ps1`** from a **standalone `cmd.exe` or Windows Terminal `pwsh`** session.

VS Code shortcut: tasks labelled **`ION DEX: verify-100.ps1`** (see `.vscode/tasks.json`).

## GitHub Actions

Workflow: `.github/workflows/ion-dex-verify.yml`

Runs on every **push** and **pull_request**, plus manual **workflow_dispatch**: encoding check, `npm ci`, Playwright Chromium, `npm run verify`, `npm run audit:high`. The workflow targets `frontend/` at repo root (same layout after syncing `frontend/` next to `ion/`).

## Cursor Hooks (optional)

Automatic **stop** hooks are wired in-repo (see `.cursor/hooks.json`). On each Agent **stop** Cursor runs:

`.cursor/hooks/ion-verify-on-stop.cmd`:

1. `node scripts/compile-func.mjs` — all `contracts/ion` `.fc` files validated (deployable roots + probe graph for fragments). Fails fast if FunC is broken.
2. `scripts/agent-verify.cmd` — full baseline: encoding, backend verify + audit + stress, frontend verify + audit.

**Timeouts:** `hooks.json` uses `timeout: 900` (seconds). Increase if verify is slow on your machine.

Full Playwright **on every stop** remains heavy. Prefer that agents still call `scripts\agent-verify.cmd` after substantive edits so failures surface before hitting the hook.

If you bootstrap from scratch instead of cloning this repo:

1. Merge `docs/cursor-hooks-verify-stop.sample.json` with your `.cursor/hooks.json` entries.
2. Keep `.cursor/hooks/ion-verify-on-stop.cmd` (or replicate the compile + verify sequence above).

`failClosed` is `false`, so hook failure does not block the IDE entirely; inspect the Hooks output channel and fix red steps.

### After every save (Agent / Tab + editor Ctrl+S)

The repo is configured so **each save** runs a **FunC compile gate** (plus a **fast encoding check** on the saved file when the extension matches source-like types):

1. **Cursor Hooks** (`.cursor/hooks.json`):
   - `afterFileEdit` — after Agent applies a `Write`-style edit.
   - `afterTabFileEdit` — after **Tab** inline completion writes a file.
   - Both invoke: `node scripts/ion-on-save-pipeline.mjs --cursor-hook` (reads `file_path` from stdin JSON; `timeout` **540**s, `failClosed: false`).

2. **VS Code / Cursor manual save (Ctrl+S)** — workspace setting **`.vscode/settings.json`** uses the **Run On Save** extension (`emeraldwalk.RunOnSave`):
   - Command: `node "${workspaceFolder}/scripts/ion-on-save-pipeline.mjs" "${file}"`
   - Skips `node_modules`, `.git`, `dist`, `build`, `out`, `coverage` via `notMatch`.

Install the extension when prompted (**Extensions: Show Recommended Extensions**) or from the marketplace id **`emeraldwalk.RunOnSave`**. Without it, **only** Cursor hook paths (Agent/Tab) run the pipeline; **manual save** will not.

**Cost:** `compile-func.mjs` walks all `contracts/ion` targets (~tens of seconds). Expect noticeable delay on every save; disable Run On Save or remove the hook entries if it is too slow. Compile output uses `stdio: inherit` (visible in the Hooks / Run on Save output panel).
