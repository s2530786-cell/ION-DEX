# Current Progress

## Latest Verified Status

- **Cursor Agent `stop` 自动化链（ongoing）**：`.cursor/hooks.json` → `stop` → `.cursor/hooks/ion-verify-on-stop.cmd` 顺序执行 **`node scripts/compile-func.mjs`**（`contracts/ion` FunC）再执行 **`scripts\agent-verify.cmd`**（全仓编码 + 后端 + 前端）；`timeout` 现为 **900s**，`failClosed: false**。便于 Agent 会话结束时自动拉回合约编译与门禁，无需手工点脚本。
- **每次保存触发 FunC 编译门禁（可选重，2026-05-19）**：`scripts/ion-on-save-pipeline.mjs` — 对被保存路径做快速编码检查后执行 **`compile-func.mjs`（全量 `contracts/ion`，数十秒级）**。**Cursor**：`afterFileEdit` / `afterTabFileEdit`，`timeout` **540s**。**编辑器 Ctrl+S**：`.vscode/settings.json` 绑定 **Run On Save**（`emeraldwalk.RunOnSave`）；若未安装该扩展则无手动保存侧触发。详见 `docs/08-ci-agent-automation.md`。

- **Phase 3 Bridge/Domain 前端只读切片（2026-05-19）**：前端 `ionApi.ts` 增加 `/api/bridge/routes`、`/api/domain/resolve?name=` 封装与类型对齐后端；业务页 Bridge/Domain 指标区分别以 `BridgeMetricsRow` / `DomainMetricsRow`（`custodian.ion` 预览解析）接入 API，`DataSourceBadge` 语义与 Stake/Burn 一致（mock/cache 或 offline fallback）。E2E `smoke.spec.ts` 增加 `bridge-metrics-source`、`domain-metrics-source` 断言。证据：`scripts\verify-full-save-log.cmd --no-pause` exit `0`（编码 183 files OK；frontend Playwright **13 passed**；前后端 `audit:high` **0**）。**100-pass**：`scripts/verify-100.ps1` 对每一步在退出码 **`-1073741502`**（`STATUS_DLL_INIT_FAILED`）时 **`Run-StepResilient` 自动重试一次**；若 Cursor 内嵌终端仍有嵌套控制台瞬断，请到 **外部** `cmd`/`pwsh` 跑完整门禁。下一里程碑：`bridge` route 对齐 adapter/registry、upstream 超时/重试与 Redis/DB 草稿。

- **Phase 3 adapter/cache + frontend read slice（2026-05-18）**：后端新增 `MemoryCache`（TTL/stale）、`CachedSourceAdapter` registry（market/burn/staking/domain）、`gateway-data` 层；`meta` 扩展 `cacheHit`/`adapter`；`/api/health` 含 `dataSources` 健康快照。后端 **19 tests** + stress 9 endpoints 全绿。前端 Stake/Burn 指标卡接入 `/api/staking/summary`、`/api/burn/summary`，保留 offline fallback，E2E 断言 `stake-metrics-source` / `burn-metrics-source`。`scripts\verify-full.cmd`（`ION_VERIFY_NONINTERACTIVE=1`）exit `0`。100-pass gate 已重新启动（前次因开发中前端中断于 PASS 2）。

- **Phase 3 backend gateway second slice（2026-05-18）**：扩展 `backend/` public mock API，从 health/config/tokens/tickers 扩展到 `GET /api/burn/summary`、`GET /api/staking/summary`、`GET /api/bridge/routes`、`GET /api/domain/resolve?name=`、`GET /api/profile/demo`。新增 `.ion` 域名输入校验、稳定错误码枚举（`ION_DEX_E_*`）、OPTIONS `X-Request-Id` tracing、金融/链上 mock payload provenance，避免 mock 价格、APR、burn、token 地址被误认为真实数据。后端 API 测试扩展到 12 passed；stress smoke 覆盖 9 个 public endpoint，每 endpoint 默认 120 requests / 24 concurrency，并校验响应契约和 provenance。只读代码审查发现的 mock 误导风险、错误码、OPTIONS tracing 与 stress 边界说明已修复或记录为后续生产压测风险。验证证据：直接 `scripts\verify-full.cmd` exit `0`，编码扫描 191 files OK，backend verify 12 passed，backend audit 0，backend stress 9 endpoints 全绿，frontend build + Playwright 13 passed，frontend audit 0。扩展 100-pass gate 完成 `PASS 100/100`、`RESULT=GREEN`、exit `0`（耗时 3,899,653 ms）。剩余风险：当前 stress 仍是 CI smoke，不等同 k6/wrk 生产压测；CORS 对 public mock 开放，真实 profile/wallet/KYC 接入前必须引入 origin allowlist 和 auth 边界。
- **Phase 3 backend gateway first slice（2026-05-18）**：新增 `backend/` TypeScript mock API gateway，首批 endpoint 为 `GET /api/health`、`GET /api/config/public`、`GET /api/tokens`、`GET /api/markets/tickers`，统一返回 `{ data, meta }`（`source`、`updatedAt`、`stale`、`requestId`）。新增后端 API 测试（6 passed）、typecheck/build、`audit:high` transient retry wrapper、local stress smoke（80 requests/endpoint，health/config p95 < 200ms，tokens p95 < 250ms，tickers p95 < 300ms）。前端 ticker strip 已接 `/api/markets/tickers` 并保留 offline fallback；前端 verify 改为动态 preview port，修复 100-pass 固定端口抖动。`verify-full.cmd`、`verify-full.ps1`、`verify-100.ps1`、GitHub Actions 与验证文档已同步 backend verify/audit/stress + frontend verify/audit。独立只读审查发现的门禁旁路已修复。最终验证：直接 `scripts\verify-full.cmd` exit `0`；扩展 100-pass gate 完成 `PASS 100/100`、`RESULT=GREEN`、exit `0`（耗时 4,001,376 ms）。
- **Unified workspace（2026-05-18）**：`D:\openclaw-tools\ion-dex-nuke` 100-pass 门禁已完成：`PASS 100 OK`，`PASSED=100`，`FAILED=0`，`RESULT=GREEN`。执行前修正 `scripts/check-encoding.ps1`，将被 `.gitignore` 忽略的本地官方 ION 参考树 `/ion/` 排除在仓库编码门禁外，避免第三方官方副本的 BOM 示例文件污染本仓验证。根目录 `scripts\verify-full.cmd` / `verify-full-save-log.cmd` 已通过：编码扫描仓库源文件 OK；前端 `npm run verify`（`build` + `start-server-and-test` 监听 **TCP `127.0.0.1:59333`** 后跑 Playwright，避免本机环境下误把 HTTP **400** 当成「预览已就绪」）**Playwright 12 passed**（含 Trade/Grid/Pool/Stake/**Bridge/Burn/Domain/AI** 草稿表单校验）；`audit:high` **0**。**AppShell** 顶栏改为 `flex + overflow-x-auto`：当前 Tailwind 生产产物未生成可用的 `lg:` 断点时，`hidden lg:flex` 会令导航整块 `display:none`，E2E 无法点到 `nav-*`。
- Pool / Stake milestone（先前 empty-window 基线）：编码、`npm run verify`、`audit:high` 均已绿灯。
- If `frontend/e2e/smoke.spec.ts` picks up NUL bytes after an edit, run `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-encoding.ps1 -Path .\frontend\e2e -Fix` from repo root.

- Desktop Commander MCP is installed and loaded as `user-desktop-commander`.
- Real command execution is confirmed:
  - `DC_OK`
  - `node v22.22.0`
  - `npm 11.3.0`
- Frontend build passes through Desktop Commander:

```text
vite v8.0.13 building client environment for production...
✓ 1743 modules transformed.
dist/index.html                   0.44 kB │ gzip:  0.28 kB
dist/assets/index-CwO390Tr.css    1.34 kB │ gzip:  0.69 kB
dist/assets/index-DImxyD8X.js   207.27 kB │ gzip: 65.38 kB
✓ built in 735ms
```

- Encoding check passes after auto-fixing corrupted files:

```text
Scanned: 31 files
OK - All files are UTF-8 without BOM, no NUL bytes.
```

## Fixes Completed

- Removed corrupted generated `.js` ghost files from `frontend/src/`.
- Updated `frontend/postcss.config.js` for Tailwind v4:
  - `@tailwindcss/postcss`
- Installed `@tailwindcss/postcss`.
- Added project memory skill:
  - `.cursor/skills/ion-dex-memory/SKILL.md`
- Added persistent state:
  - `SESSION_STATE.md`
  - `AGENTS.md`
- Added Chinese language skills:
  - global: `C:\Users\admin\.cursor\skills\chinese-language\SKILL.md`
  - project: `.cursor/skills/chinese-language/SKILL.md`
- Installed Cursor Simplified Chinese UI support:
  - extension: `ms-ceintl.vscode-language-pack-zh-hans`
  - locale file: `C:\Users\admin\AppData\Roaming\Cursor\User\argv.json`
  - locale: `zh-cn`
- Reset Cursor Chinese/NLS cache after UI stayed English:
  - backup: `.maintenance/cursor-i18n-backup-20260517-094321`
  - removed old duplicate zh-hans language pack directory
  - removed `languagepacks.json`
  - reinstalled `ms-ceintl.vscode-language-pack-zh-hans@1.105.0`
- Configured Desktop Commander MCP globally and at project level.
- Configured Memory Bank MCP globally and at project level:
  - server name: `ion-dex-memory-bank`
  - root: `.memory-bank/`
- Six-pillar verification baseline:
  - `docs/verification-six-pillars.md`
  - `docs/07-verification-README.md`
- Playwright smoke E2E: `frontend/e2e/smoke.spec.ts`, `frontend/playwright.config.ts`
- Frontend scripts: `preview:local`, `test:e2e`, `verify`, `audit:high`
- Root script: `scripts/verify-full.ps1` (encoding + frontend verify + audit)
- `frontend/.gitignore` for Playwright output dirs
- Stable UI hooks: `data-testid` on brand, main, ticker, swap submit
- Added state-driven frontend page routing without adding a routing dependency.
- Added business page shells for `Trade`, `Grid`, `Pool`, `Stake`, `Bridge`, `Burn`, `Domain`, and `AI`.
- Extended Playwright smoke coverage to verify top navigation opens each business page shell.
- Agent-side verification loop is now usable via command output written to `%TEMP%` and read back by the agent.
- Added the 100-pass full green verification rule for continuing feature development.
- Added project-specific Cursor Skills:
  - `ion-official-source`
  - `ion-web3-ui`
  - `ion-contract-audit`
  - `ion-data-backend`
  - `cursor-engineering-workflow`
  - `ion-dev-accelerators`
- Installed agent capability Skills requested by the user:
  - `skill-vetter` for Skill safety audits.
  - `self-evolving` for lessons learned and memory updates.
  - `tavily` for AI-oriented web/repository/documentation research, with fallback when Tavily is not configured.
  - `find-skill` for discovering project/user/built-in Skills.
  - `luke-agent-browser-clawdbot` for browser automation workflow guidance.
  - `summarize-pro` for concise summaries of long docs, logs, diffs, and verification output.
  - `claude-flow` for controlled Claude-Flow/RuFlo agent orchestration guidance.
- Installed root dev dependency `claude-flow@3.7.0-alpha.35` as requested and verified the CLI:
  - `npx claude-flow@3.7.0-alpha.35 --version` -> `ruflo v3.7.0-alpha.35`
  - `npx claude-flow@3.7.0-alpha.35 init check` -> not initialized in this directory
  - `npx claude-flow@3.7.0-alpha.35 doctor --component mcp` -> no Claude-Flow MCP config found
  - `npx claude-flow@3.7.0-alpha.35 agent wasm-status` -> `@ruvector/rvagent-wasm` not installed
  - Root `npm audit --audit-level=high --json` currently reports 1 critical and 10 high vulnerabilities through Claude-Flow transitive dependencies, so Claude-Flow is treated as a controlled local accelerator, not a trusted production/runtime dependency.
- Verification after Claude-Flow capability update:
  - `scripts\verify-full-save-log.cmd --no-pause` exited `0`.
  - Encoding scanned 167 files: UTF-8 without BOM, no NUL bytes.
  - Frontend verify passed: build succeeded and Playwright `13 passed`.
  - Frontend `audit:high`: `found 0 vulnerabilities`.
  - Separate root `npm audit --audit-level=high --json` remains failing because of Claude-Flow transitive dependencies: 1 critical, 10 high.
- Claude-Flow cautious sandbox validation:
  - Created isolated Git worktree `D:\openclaw-tools\ion-dex-nuke-claude-flow-sandbox` on branch `claude-flow-sandbox`, leaving the main dirty worktree untouched.
  - Ran `npx claude-flow@3.7.0-alpha.35 init --minimal --skip-claude --no-global`; it succeeded but still generated `CLAUDE.md`, `.claude/`, `.claude-flow/`, and `.mcp.json`.
  - Sandbox diagnostics passed: `init check` reports initialized, `doctor --component mcp` reports 1 `ruflo` MCP server configured, and `agent list` reports no active agents.
  - Generated `.mcp.json` uses `ruflo@latest` and `autoStart: false`; do not copy it to the main repo without pinning and review.
  - Generated `.claude/settings.json` enables hooks and broad command permissions; do not import it without security review.
- Added Cursor Agent Review rules:
  - `BUGBOT.md`
- Completed the 100-pass full green verification gate:
  - `PASSED=100`
  - `FAILED=0`
  - `RESULT=GREEN`
- Indexed Cursor official documentation into local project memory:
  - `docs/cursor-docs-feature-memory.md`
  - Source: `https://cursor.com/cn/docs`
  - Sitemap: `https://cursor.com/llms.txt`
- Indexed development accelerators into local project memory:
  - `docs/development-accelerators-memory.md`
  - Includes Git worktrees, Cursor `/worktree`, `/best-of-n`, Hooks, Agent Review, Bugbot, Cloud Agents, Cursor CLI/GitHub Actions, CI permission patterns, MCP, Rules, and Skills.
- Added external reference architecture index:
  - `docs/09-reference-architecture.md`
  - Maps backend gateway patterns, blockchain development references, AI agent references, advanced web design, and AI media repositories into ION DEX phases.
  - Establishes the immediate Phase 3 recommendation: a minimal typed backend API gateway/BFF with health, config, token list, ticker, burn, staking, bridge, domain, and profile mock endpoints.
- Completed the interactive `Trade` and `Grid` frontend milestone:
  - `Trade` now has side/order controls, amount, price, slippage validation, preview, disabled submit state, and wallet-signing draft confirmation.
  - `Grid` now has mode, price bounds, grid count, investment validation, preview, disabled submit state, and AI Sentinel gated draft confirmation.
  - Playwright smoke coverage now includes Trade limit-order drafting and Grid bound validation/strategy drafting.
  - `frontend/playwright.config.ts` wraps the preview command with `cmd.exe /d /c` for stable Windows webServer startup.
- Latest Trade/Grid verification:
  - Encoding: `ENCODING_EXIT=0`
  - Frontend verify: `VERIFY_EXIT=0`
  - Audit high: `AUDIT_EXIT=0`
  - Playwright: `6 passed`
- Trade/Grid 100-pass verification gate completed on 2026-05-17:
  - `PASS 100/100`
  - `RESULT=GREEN`
  - exit code `0`
- Completed interactive `Pool` and `Stake` frontend milestone:
  - Pool liquidity panel with slippage validation, preview, and liquidity mint draft confirmation.
  - Stake hub with stake/unstake modes, validation, APR preview line, and per-mode draft confirmations.
  - Playwright smoke extended for pool and stake flows; submit-button assertions use `stake-submit` test id to avoid strict-mode ambiguity.
- Completed Wallet/Profile shell milestone:
  - `AppShell` wallet button now opens a local provider picker for Online+ Wallet, ION Browser Wallet, and WalletConnect / OKX.
  - Selecting a provider creates a draft profile session, shows ION ID / profile copy, and supports draft disconnect without private keys, RPC calls, or signatures.
  - Playwright smoke now covers wallet panel open, provider selection, profile draft confirmation, and disconnect.
  - Single full verification after the change: encoding OK, frontend `npm run verify` **13 passed**, `audit:high` **0**.
  - 100-pass gate after the change: `PASS 100 OK`, `PASSED=100`, `FAILED=0`, `RESULT=GREEN`.

## Known Issues

- Memory Bank MCP config is written but tools are not yet verified. Cursor needs MCP reload/restart.
- UI has initial dashboard plus business page shells. `Trade`, `Grid`, `Pool`, `Stake`, `Bridge`, `Burn`, `Domain`, and `AI` now have interactive validated draft flows; wallet/profile is a draft shell with no real wallet SDK yet.
- After pulling changes, run locally: `cd frontend && npm install && npx playwright install chromium && npm run verify` (agent shell may not update `package-lock.json` in this environment).
- Visual regression / pixel-diff vs design mockups not yet set up.
- Smart contracts are not yet implemented. Backend now has a minimal mock API gateway; production data adapters, auth/user endpoints, cache, DB/indexer integration, and chain-facing services remain pending.
- ION official codebase path confirmed: `D:/openclaw-tools/ion`.
- Confirmed remote: `https://github.com/ice-blockchain/ion`.
- Memory Bank file `official-source-index.md` now records official reusable areas and DEX caveat.
- Runtime frontend connection issue resolved for current session: Vite dev server started on `http://127.0.0.1:3001/`, and both `http://127.0.0.1:3001/` and `http://localhost:3001/` returned `HTTP/1.1 200 OK`.
- Added frontend script `npm run dev:local` to start Vite directly on `127.0.0.1:3001` without fragile CLI argument forwarding.
- Next feature development can proceed from the completed 100-run verification baseline.
- Domain-specific future work must load the matching project skill before planning or editing.
- Meaningful diffs should run Cursor Agent Review (`/agent-review`) using `BUGBOT.md` before final verification.
- Cursor workflow/tooling questions should first consult `docs/cursor-docs-feature-memory.md`.
- The `cursor-engineering-workflow` skill should be loaded proactively for every development, verification, review, debugging, workflow, or tooling task.
- The `ion-dev-accelerators` skill should be loaded proactively for every development task to consider faster or safer workflows such as worktrees, best-of-n, hooks, CI automation, Cloud Agents, MCP, Rules, or Skills.
- The user should not need to request these accelerators explicitly; selecting and applying them is now part of the agent's development responsibility.

## Next Step

1. One-shot verification:

```powershell
cd C:\Users\admin\.cursor\projects\empty-window\ion-dex-nuke\frontend
npm install
npx playwright install chromium
cd ..
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-full.ps1
```

2. For local interactive dev: `cd frontend && npm run dev:local` then open `http://localhost:3001/`.
3. Next milestone: run `scripts\verify-100.ps1`（100-pass `RESULT=GREEN`）；Profile/ticker 等区域继续只读接线；upstream 超时/重试契约；将 `/api/bridge/routes` 等对齐 adapter/cache 层；Redis 契约与 PostgreSQL schema 脚手架。
4. Official ION reference: `D:/openclaw-tools/ion`.
5. After meaningful diffs, run Cursor Agent Review (`/agent-review`) and then the verification baseline.
