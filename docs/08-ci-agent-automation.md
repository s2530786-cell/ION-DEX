# CI and agent automation

## Goal

Run the same verification humans use, **without** interactive `pause`, so agents and CI do not block waiting for keyboard input.

## Commands

| Scenario | Command |
|----------|---------|
| Agent workflow (memory + plan, dry-run) | `node scripts/agent-workflow.mjs` |
| Agent workflow (memory + full verify) | `node scripts/agent-workflow.mjs --tier verify --execute` |
| Agent workflow (strict UI + full verify) | `node scripts/agent-workflow.mjs --tier strict --execute` |
| Development preflight only | `node scripts/dev-preflight.mjs` |
| Agent / CI / hooks (no pause) | `scripts\agent-verify.cmd` |
| POSIX Cloud Agent (no pause) | `bash scripts/agent-verify.sh` |
| Save full log to `%TEMP%\ion-verify-full.txt`, optional pause at end | `scripts\verify-full-save-log.cmd` |
| Save log, never pause | `scripts\verify-full-save-log.cmd --no-pause` |
| 100-green stage gate | `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-100.ps1` |
| Install repository Git hooks | `node scripts/install-git-hooks.mjs` |
| Interactive debugging with pause on failure | `scripts\verify-full.cmd` (no `CI` / no `ION_VERIFY_NONINTERACTIVE`) |
| POSIX Cloud Agent full verification | `bash scripts/verify-full.sh` |

Environment variables recognised by `scripts\verify-full.cmd`:

- `CI` — skip all pauses (GitHub Actions sets this).
- `ION_VERIFY_NONINTERACTIVE=1` — skip all pauses (used by `agent-verify.cmd`).
- `ION_UI_STRICT=1` — turns current unfinished UI copy warnings from `scripts/dev-preflight.mjs` into failures.

`scripts\verify-full.cmd`, `scripts\verify-full.ps1`, `scripts\verify-full.sh`, `scripts\agent-verify.cmd`, and `scripts\verify-full-save-log.cmd --no-pause` run `node scripts/dev-preflight.mjs` before the encoding check.

## Guarded commit and push

All autonomous and human commit/push paths must now pass the same guard:

1. `verify-full` is the development loop gate.
2. `verify-100` is the stage exit gate.
3. `scripts/verify-100.ps1` records a fresh proof through `scripts/verify-100-gate.mjs record`.
4. `.githooks/pre-commit` blocks commit unless the fresh proof still matches:
   - current `HEAD`
   - current working tree snapshot
   - current stage window / activation time when provided
5. `.githooks/pre-push` blocks push unless every outgoing commit has a recorded `Verify-100-Proof` trailer and local ledger entry.

Enable the versioned hooks in each clone:

```powershell
node scripts/install-git-hooks.mjs
```

Do not bypass this flow with `--no-verify`, manual trailer edits, or ad hoc commit scripts.

## GitHub Actions

Workflow: `.github/workflows/ion-dex-verify.yml`

Runs on every **push** and **pull_request**, plus manual **workflow_dispatch**: encoding check, `npm ci`, Playwright Chromium, `npm run verify`, `npm run audit:high`. The workflow targets `frontend/` at repo root (same layout after syncing `frontend/` next to `ion/`).

## Cursor Automation template

Template: `.cursor/automations/ion-dex-autonomous-build.yml`

The template records the autonomous build prompt requested from `D:\openclaw-tools\ion-dex-nuke\.cursor\automations\ion-dex-autonomous-build.yml`. Cursor Cloud cannot mount that Windows path directly, so the repository template was restored from Git history and adapted to the current Linux Cloud Agent flow: read project memory, run `node scripts/dev-preflight.mjs`, run `bash scripts/verify-full.sh` after edits, update progress memory, commit only scoped task files, and avoid secrets or destructive git commands.

Current Cursor documentation indexed in this repo describes Automations as configured through the Cursor Automations UI. Treat this YAML as a source-of-truth import template for copying into `cursor.com/automations` until Cursor exposes a stable repository YAML import schema.

## Cursor Hooks (optional)

### sessionStart — 自动注入 Skill 路由 JSON

每次新建 Agent 会话时，把 `scripts/skill-route.mjs --git` 的结果注入 `additional_context`，并写入会话环境变量，与 Rule `ion-skill-autopilot.mdc` 互补。

| 文件 | 作用 |
|------|------|
| `.cursor/hooks/ion-skill-route-session.cmd` | Windows 入口（`cd` 到仓库根后调用 Node） |
| `.cursor/hooks/ion-skill-route-session.mjs` | 读 stdin → 跑路由 → stdout JSON |
| `.cursor/hooks/.ion-skill-route-last.json` | 最近一次路由缓存（本地生成，已 gitignore） |
| `docs/cursor-hooks-ion-dex.sample.json` | **全量**：`sessionStart` + `subagentStart` + `preToolUse`（Task）+ `stop` |
| `docs/cursor-hooks-skill-route-session-only.sample.json` | **仅路由**：只有 `sessionStart`（不含 stop / 子代理） |

**安装步骤**

1. 仅主 Agent 路由：复制 `docs/cursor-hooks-skill-route-session-only.sample.json` → `.cursor/hooks.json`。
2. 主 Agent + Task 子代理 + 可选 stop：复制 `docs/cursor-hooks-ion-dex.sample.json` → `.cursor/hooks.json`。
3. 若已有 hooks：合并对应 `hooks` 数组段，勿覆盖你现有的其他事件。
3. 在 Cursor **Settings → Hooks** 或 Hooks 输出通道确认 `sessionStart` 已加载且无报错。
4. 新开 Agent 会话后，Agent 应看到「ION Skill Autopilot（sessionStart Hook）」段落及文末路由 JSON。

**Hook 输出形状（stdout）**

```json
{
  "env": {
    "ION_SKILL_ROUTE": "1",
    "ION_SKILL_ROUTE_CACHE": "<repo>/.cursor/hooks/.ion-skill-route-last.json"
  },
  "additional_context": "## ION Skill Autopilot …\n```json\n{ ... }\n```"
}
```

**环境变量**

| 变量 | 含义 |
|------|------|
| `ION_SKILL_ROUTE=0` | 关闭 `dev-preflight` 末尾的路由提示（Hook 仍可在 sessionStart 注入） |
| `ION_SKILL_ROUTE_STRICT=1` | `skill-route.mjs` 在 Skill 缺失时以 exit 2 失败 |
| `ION_SKILL_ROUTE_CACHE` | 由 Hook 设置，指向上次路由 JSON 缓存路径 |

**私有 Skill**

闭源 Skill 需先执行 `ion-private-core/scripts/link-skills-to-ion-dex.ps1`，使 `.cursor/skills-private/` 指向私有仓；否则路由里对应项会标为 `MISSING`。

**已知限制（Cursor IDE）**

部分 Cursor 版本存在 `sessionStart` 的 `additional_context` 竞态（Hooks 日志显示 merged，但 Agent 首条上下文未带上）。若遇此情况：

- 仍依赖 **alwaysApply** Rule `.cursor/rules/ion-skill-autopilot.mdc` 与 `AGENTS.md` 首条 Required Skill；
- 会话内手动执行：`node scripts/skill-route.mjs --git`；
- 查看缓存：`.cursor/hooks/.ion-skill-route-last.json`。

`env` 字段通常比 `additional_context` 更稳定；后续 Hook 脚本可读 `ION_SKILL_ROUTE_CACHE`。

---

### subagentStart + preToolUse（Task）— 子代理注入同一路由

Task 子代理有独立上下文，需单独注入 Skill 路由。

| 文件 | 作用 |
|------|------|
| `.cursor/hooks/ion-skill-route-subagent.mjs` | `subagentStart`：按子代理 `task` 做关键词路由，写 `.ion-skill-route-last-subagent.json` |
| `.cursor/hooks/ion-skill-route-task-pretool.mjs` | `preToolUse` + matcher `Task`：把紧凑路由前缀写入 `tool_input.prompt`（**最可靠**） |
| `.cursor/hooks/ion-skill-route-lib.mjs` | session / subagent / preToolUse 共享逻辑 |

**行为说明**

- **subagentStart**：`permission: allow` + `additional_context`（完整 Markdown + JSON）。官方 schema 仅列出 `permission`；部分 Cursor 版本会合并 `additional_context`，但不保证进入子代理窗口。
- **preToolUse（Task）**：在父 Agent 派发 Task 前，把 `[ION Skill Autopilot — 子代理路由]` 前缀拼进 `prompt`；子代理一定能读到。
- 子代理路由失败时，会回退读取 `.cursor/hooks/.ion-skill-route-last.json`（主会话缓存）。

**hooks.json 片段**

```json
"subagentStart": [
  { "command": ".cursor/hooks/ion-skill-route-subagent.cmd", "timeout": 30, "failClosed": false }
],
"preToolUse": [
  { "command": ".cursor/hooks/ion-skill-route-task-pretool.cmd", "matcher": "Task", "timeout": 30, "failClosed": false }
]
```

Cloud Agent 支持 `subagentStart` 与 `preToolUse`，但不支持 `sessionStart`（见 Cursor 文档）。

---

### GitHub 每日高星发现（Skill 路由联动）

与 `ion-skill-autopilot` 共用 manifest 关键词 `kw-github-daily`：

| 脚本 | 作用 |
|------|------|
| `scripts/github-daily-discovery.mjs` | 按 `github-daily-queries.json` 扫 GitHub Search API，写 `.memory-bank/github-daily/latest.{json,md}` |
| `scripts/github-daily-install.mjs` | 浅克隆到 `ION_VENDOR_DISCOVERY_ROOT`（默认 `d:\vendor-ion-discovery`） |
| `scripts/github-daily.cmd` | Windows 计划任务入口 |

**环境变量：** `GITHUB_TOKEN` 或 `GH_TOKEN`（强烈建议，否则未认证 IP 易 403/429）。  
**开发 preflight：** `dev-preflight.mjs` 在 catalog 缺失或超过 24h 时打印提示。

详见 `docs/github-daily-discovery.md`、`.cursor/skills/ion-github-daily-discovery/SKILL.md`。

---

### stop — Agent 结束时自动验证（可选）

Full Playwright on **every** agent stop is slow. Prefer letting the agent run `scripts\agent-verify.cmd` after edits.

If you still want an automatic run when an agent turn ends:

1. 使用 `docs/cursor-hooks-ion-dex.sample.json`（已含 `stop`），或仅复制 `docs/cursor-hooks-verify-stop.sample.json` 中的 `stop` 段落到 `.cursor/hooks.json`。
2. Ensure `.cursor/hooks/ion-verify-on-stop.cmd` exists (already in repo).

`failClosed` is `false` so a failed verify does not brick the IDE; check the Hooks output channel or the exit code in logs.

**相关文档：** `docs/cursor-skill-autopilot.md`
