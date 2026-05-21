# Current Session State

## Project

ION DEX: an engineering-grade OKX Web3 wallet style DEX for the ION ecosystem.

## Hard Rules

- All source files must be UTF-8 without BOM.
- Communicate with the user in Simplified Chinese by default.
- Before any development work, read `docs/00-engineering-standards.md` as the development iron law.
- Before UI/frontend work, read `docs/10-ui-design-route.md` and run `node scripts/dev-preflight.mjs` when shell access is available.
- No UTF-16, GBK, ANSI, or NUL bytes in source files.
- Every file write must be followed by read-back and encoding verification.
- No implementation step is complete without test evidence.
- Feature development cannot continue past a completed change until the project has passed 100 full green verification runs, unless the user explicitly waives that gate for a narrow investigation.
- If shell execution is unavailable, the user must run the verification commands and paste the output.
- Search for working MCP/tooling before accepting a tooling limitation.

## Master's Permanent Rules（Master 钦定，永久有效）

**① 严格按设计架构写代码**
> 所有代码必须严格对照 `docs/03-technical-architecture.md`、`docs/04-development-roadmap.md`、`docs/05-product-prd.md` 执行。不得偏离设计文档自行发挥。每一项功能必须能找到对应的设计文档依据。

**② 区块链审计公司标准——最严厉级别**
> 合约代码必须达到 CertiK / Trail of Bits / OpenZeppelin 审计标准。每次提交前按 `.cursor/skills/ion-contract-audit/SKILL.md` 的 10 项安全检查逐条过：重入、溢出、精度丢失、访问控制、重放保护、预言机操纵、MEV/夹子、代币兼容性、跨链一致性、事件完整性。任何一个检查项不过，代码不能标记完成。

**③ 发现漏洞立刻修复，不许留到明天**
> 安全漏洞零容忍。编译警告、lint 报错、审计发现——修完才能继续下一项。不得注释 TODO 跳过安全问题。

**④ 100 次压力测试，100 全绿才过**
> 任何功能实现后必须跑 100 轮验证：`scripts/verify-100.ps1`。结果必须是 `PASS 100/100`、`FAILED=0`、`RESULT=GREEN`、exit code `0`。少一轮、黄一个、红一个——都不算过。不得跳过、不得缩减、不得解释原因。

**⑤ 每步提交，出了问题能追溯**
> 每完成一个合约/一个 service/一个页面功能 → 立即 git commit，写清楚做了什么。不给后续排错留坑。

**⑥ 全自动工作流执行，不等不靠**
> Agent 必须自主推进开发流程。不等用户喊才干活。检测到任务 → 自动加载对应 Skill → 自动执行 → 自动验证 → 自动汇报。用户不需要手动触发每一步。

**⑦ 根据项目需要主动搜索 GitHub 开源项目，下载安装依赖**
> 缺工具自己找。GitHub 是第一搜索源。找到合适的开源库 → 下载 → 安装依赖 → 集成到项目 → 验证能跑通。最少 50 ⭐ 才考虑。装全跑通才算完，不下完就跑不算数。

**⑧ 安装任何 Skill 前必须先安全检查**
> 使用 `.cursor/skills/skill-vetter/SKILL.md` 审计每个新 Skill。检查权限范围、危险模式、外部请求。有红标（red flag）的一律不装，报 Master 决策。

**⑨ 充分利用 Cursor 已安装的能力**
> 开发加速器（worktree、Agent Review、Bugbot、Cloud Agents、Hooks、CI automation）、MCP 工具（Desktop Commander、Memory Bank）、Rules、Skills——全部要用起来。不等用户提醒，自动选最优路径。
- The agent must proactively use Cursor engineering workflow and development accelerator guidance for every development task. The user should not need to ask for worktrees, Agent Review, Bugbot, Hooks, MCP, Cloud Agents, CLI automation, Rules, Skills, or verification strategy.
- The agent must use `cursor-engineering-workflow` as the automatic development workflow and `self-evolving` as the post-work learning loop so useful lessons improve project memory, docs, rules, or Skills.
- The agent must evaluate parallel development worktrees, `/best-of-n`, Agent Review, Bugbot, and code audit paths for non-trivial work; high-risk surfaces require review/audit before being accepted.

## Current State

- **P1 玻璃 HUD（2026-05-20）**：`glass-hud-panel`/`glass-hud-strip`；AppShell/ProfileHub/Dashboard FeatureGrid 玻璃化。计划 `docs/ui-development-plan-2026-05-20.md`；自检 `docs/ui-deliverable-self-audit-2026-05-20-p1-glass.md`（视觉未过、工程绿灯）。UI 验证：`bash scripts/ui-round-verify.sh` 或 `--tier ui`。Playwright **16 passed**。
- **Bridge 链上 + Domain（2026-05-20）**：`BridgeTransferPanel` 组件嵌入 Desk（vault/wrapper + 离线 staging）；`/api/domain/showcase`。`verify-full` 绿灯。
- **Stress + 100-pass GREEN（2026-05-20）**：`stress.mjs` health/config p95 250ms。`bash scripts/verify-100.sh 100` → PASSED=100、RESULT=GREEN。分支 `cursor/ui-design-workflow-44c9`。
- **Desk API + Dashboard stat glass（2026-05-20）**：Burn/Bridge/AI Desk 指标与图表接 gateway；Dashboard 右侧三张 stat 卡为 NeonGlassCard。POSIX `scripts/verify-100.sh`；Playwright **16 passed**。
- **NeonGlassCard phase 2（2026-05-20）**：`PageHero` + Dashboard 首屏 `NeonGlassCard`；Pool/Grid/Trade desk Hero 指标接 API；`useApiResource` 稳定性修复；frontend `npm run verify` **16 passed**。分支 `cursor/ui-design-workflow-44c9` 待 push 本批提交。
- P0 market surface shipped 2026-05-22: `market-surface` API + `IonCandleChart` on Trade; provenance badges; merged `origin/main` (sidebar shell, wallet providers, gateway adapters). Self-audit: `docs/ui-deliverable-self-audit-2026-05-22-p0.md`. Next: P0 burn/bridge/ai feeds alignment, P1 glass/ProfileHub. Iron law: `docs/11-ui-visual-self-audit-gate.md`.
- **Contracts batch（2026-05-21）**：补全 10 个 FunC + 4 个 Solidity + `scripts/verify-contracts.mjs`；`node scripts/verify-contracts.mjs` exit `0`（本机无 `forge` 时 Solidity SKIP）。路径见 `contracts/README.md`。
- Critical correctness automation on 2026-05-20 found and fixed a CI verification gap:
  - PR #2 added `scripts/dev-preflight.mjs` to local `verify-full.*`, but GitHub Actions did not run it.
  - `.github/workflows/ion-dex-verify.yml` now runs `node scripts/dev-preflight.mjs` after Node setup and before encoding/build/audit steps.
  - Validation: after installing backend/frontend dependencies, `bash scripts/verify-full.sh` passed with preflight OK, encoding 92 files OK, backend 6 tests passed, backend audit 0 vulnerabilities, backend stress passed, frontend build + Playwright 14 passed, and frontend audit 0 vulnerabilities.
- Frontend scaffold exists under `frontend/`.
- Current frontend has a Vite/React/Tailwind skeleton and initial dashboard components.
- There are generated `.js` ghost files under `frontend/src/` from earlier TypeScript emits; these must be cleaned once shell/filesystem execution is reliable.
- `index.html` was rewritten after parse5 reported NUL/UTF-16 corruption.
- Built-in Shell tool appeared non-functional in this environment; Desktop Commander MCP installation was selected as the next tooling fix.
- Desktop Commander was installed by the user, but its setup initially wrote only Claude config. Cursor global MCP config was then created at `C:\Users\admin\.cursor\mcp.json`.
- After Cursor restart, Desktop Commander was still not visible in loaded MCP descriptors, so project-level MCP config was also created at `.cursor/mcp.json`.
- After the next restart, Desktop Commander loaded successfully as MCP server `user-desktop-commander`.
- Desktop Commander command execution was verified with `DC_OK`, `node v22.22.0`, and `npm 11.3.0`.
- Frontend build was executed through Desktop Commander and passed after removing corrupted generated `.js` ghost files and updating Tailwind v4 PostCSS configuration.
- Memory Bank MCP was configured as `ion-dex-memory-bank` in both global Cursor MCP config and project `.cursor/mcp.json`, with root `.memory-bank/`.
- Project-level memory skill has been added at `.cursor/skills/ion-dex-memory/SKILL.md`.
- Chinese language skills have been added globally and at project level:
  - `C:\Users\admin\.cursor\skills\chinese-language\SKILL.md`
  - `.cursor/skills/chinese-language/SKILL.md`
- Cursor IDE Simplified Chinese UI was configured:
  - Installed extension `ms-ceintl.vscode-language-pack-zh-hans`
  - Set `C:\Users\admin\AppData\Roaming\Cursor\User\argv.json` to `{ "locale": "zh-cn" }`
  - Set `C:\Users\admin\.cursor\argv.json` to include `"locale": "zh-cn"` because Cursor may read this runtime arguments file.
  - Set `C:\Users\admin\AppData\Roaming\Cursor\User\settings.json` to include `"locale": "zh-cn"` as compatibility fallback.
  - Verified `argv.json` has no BOM and no NUL bytes.
  - If Chinese UI still does not take effect, fully terminate all Cursor processes before reopening; multiple Cursor background processes were observed.
  - Later diagnostics showed Cursor child processes were launched with `--lang=zh-CN`, and `AppData\Roaming\Cursor\languagepacks.json` registered the Simplified Chinese language pack. If UI panels remain English, it is likely Cursor proprietary UI text not covered by the VS Code Chinese language pack, not an Agent Skill issue.
  - User approved cache reset. Backed up Chinese/NLS cache to `.maintenance/cursor-i18n-backup-20260517-094321`, removed old duplicate zh-hans language pack directory and `languagepacks.json`, then reinstalled `ms-ceintl.vscode-language-pack-zh-hans@1.105.0`.
  - After cleanup, only current zh-hans extension directory remains. Project encoding check passed after the operation.
- Memory Bank MCP is now loaded as `user-ion-dex-memory-bank`.
- User provided the ION official codebase path: `D:/openclaw-tools/ion`.
- Confirmed `.git/config` remote is `https://github.com/ice-blockchain/ion` and README describes it as `Reference implementation of ION Node and tools`.
- Indexed official reusable areas in Memory Bank file `official-source-index.md`: `crypto/smartcont` wallet/multisig/DNS FunC references, `crypto/func`, `tonlib`, `lite-client`, `validator`, and TL API schemes.
- Important caveat: official repo does not contain ready-made DEX/AMM/staking/burn/bridge contracts; DEX contracts must be designed separately while reusing official patterns.
- Runtime frontend connection issue resolved for current session. Vite is running on `http://127.0.0.1:3001/`; `curl` checks against both `127.0.0.1:3001` and `localhost:3001` returned `HTTP/1.1 200 OK`.
- Added `frontend` npm script `dev:local` as a stable local startup command for port `3001`.
- Frontend now has state-driven page switching for `Swap`, `Trade`, `Grid`, `Pool`, `Stake`, `Bridge`, `Burn`, `Domain`, and `AI`.
- Business page shells are implemented in `frontend/src/pages/BusinessPages.tsx` using the existing neon UI system.
- Playwright smoke tests now cover the dashboard, responsive visibility, and navigation into every business page shell.
- `Trade` and `Grid` are now interactive:
  - `Trade` supports side/order selection, amount, price, slippage validation, preview, disabled submit state, and wallet-signing draft confirmation.
  - `Grid` supports mode selection, lower/upper bounds, grid count, investment validation, invalid-bound error state, preview, disabled submit state, and AI Sentinel gated draft confirmation.
  - Playwright smoke tests cover Trade limit-order drafting and Grid bounds/strategy drafting.
- `Pool` and `Stake` are now interactive (draft payloads only, no on-chain mint/stake):
  - Pool: BNB/ION amounts, slippage bounds, preview, submit enables liquidity mint draft confirmation.
  - Stake: stake/unstake mode, amount validation, APR preview line, draft confirmations per mode.
  - Playwright smoke covers pool slippage error/recovery and stake/unstake draft flows.
  - Stake E2E uses `data-testid="stake-submit"` for enabled assertions (avoids Playwright strict-mode collisions with mode toggle buttons labeled similarly).
- `frontend/playwright.config.ts` uses a Windows-safe `cmd.exe /d /c` wrapper for preview webServer startup.
- Trade/Grid milestone verification completed on 2026-05-17:
  - single baseline: encoding, frontend verify, and high audit all exited `0`
  - required 100-pass gate: `PASS 100/100`, `RESULT=GREEN`, exit code `0`
- Agent-side automated verification is working through a log-file loop:
  - run commands from the agent
  - write outputs to `%TEMP%`
  - read the result files back into the agent
  - use exit codes as the source of truth
- A 100-pass verification gate is now required before continuing feature development.
- Project-specific Cursor Skills added:
  - `.cursor/skills/ion-official-source/SKILL.md`
  - `.cursor/skills/ion-web3-ui/SKILL.md`
  - `.cursor/skills/ion-contract-audit/SKILL.md`
  - `.cursor/skills/ion-data-backend/SKILL.md`
  - `.cursor/skills/cursor-engineering-workflow/SKILL.md`
  - `.cursor/skills/ion-dev-accelerators/SKILL.md`
- User-requested agent capability Skills installed:
  - `.cursor/skills/skill-vetter/SKILL.md`
  - `.cursor/skills/self-evolving/SKILL.md`
  - `.cursor/skills/tavily/SKILL.md`
  - `.cursor/skills/find-skill/SKILL.md`
  - `.cursor/skills/luke-agent-browser-clawdbot/SKILL.md`
  - `.cursor/skills/summarize-pro/SKILL.md`
  - `.cursor/skills/claude-flow/SKILL.md`
- Claude-Flow/RuFlo status:
  - Root dev dependency `claude-flow@3.7.0-alpha.35` is installed and pinned in `package.json`.
  - CLI verified with `npx claude-flow@3.7.0-alpha.35 --version`, output `ruflo v3.7.0-alpha.35`.
  - `init check` reports RuFlo is not initialized in this directory.
  - `doctor --component mcp` reports no Claude-Flow MCP config found.
  - `agent wasm-status` reports `@ruvector/rvagent-wasm` is not installed.
  - Root `npm audit --audit-level=high --json` reports 1 critical and 10 high vulnerabilities in Claude-Flow transitive dependencies; use only as a controlled local accelerator unless isolated and explicitly planned.
  - A `mcp start --help` attempt started the stdio MCP server instead of showing help; the process was stopped. Do not run `mcp start`, `start`, `daemon`, `autopilot`, or `init --start-all` casually.
  - Post-update project verification: `scripts\verify-full-save-log.cmd --no-pause` exited `0`; encoding scanned 167 files OK; frontend build and Playwright passed (`13 passed`); frontend `audit:high` found 0 vulnerabilities. Separate root Claude-Flow audit still reports high/critical findings.
  - Cautious sandbox validation created isolated Git worktree `D:\openclaw-tools\ion-dex-nuke-claude-flow-sandbox` on branch `claude-flow-sandbox`.
  - Sandbox `init --minimal --skip-claude --no-global` succeeded but still generated `CLAUDE.md`, `.claude/`, `.claude-flow/`, and `.mcp.json`; do not initialize directly in main repo.
  - Sandbox diagnostics: `init check` initialized, `doctor --component mcp` healthy with 1 `ruflo` server, `agent list` no active agents.
  - Generated `.mcp.json` used `ruflo@latest`; main integration must pin to `claude-flow@3.7.0-alpha.35` or a reviewed command.
  - Generated `.claude/settings.json` enabled hooks, auto learning, security scans, and broad command permissions; do not import into main without security review.
- Cursor Agent Review rules added at `BUGBOT.md` for ION DEX security, verification, UI, backend, and review-output standards.
- The 100-pass verification gate completed successfully on 2026-05-17:
  - `PASSED=100`
  - `FAILED=0`
  - `RESULT=GREEN`
- Cursor official documentation was indexed into project memory:
  - `docs/cursor-docs-feature-memory.md`
  - Source pages: `https://cursor.com/cn/docs` and `https://cursor.com/llms.txt`
  - Covered areas include Agent, Agent Review, Rules, Skills, MCP, Hooks, Subagents, Inline Edit, Tab, Cloud Agents, Bugbot, CLI, SDK, integrations, models/pricing, security/privacy, Teams, Enterprise, and troubleshooting.
  - The `cursor-engineering-workflow` skill turns this documentation memory into a proactive workflow for every development, verification, review, debugging, workflow, or tooling task.
- Development accelerators were indexed into project memory:
  - `docs/development-accelerators-memory.md`
  - Covered areas include Git worktrees, Cursor `/worktree`, `/best-of-n`, Hooks, Agent Review, Bugbot, Cloud Agents, Cursor CLI/GitHub Actions, CI autonomy levels, MCP tools, Rules, and Skills.
  - The `ion-dev-accelerators` skill proactively selects the right accelerator while preserving ION DEX safety and verification gates.
- UI design workflow lock added on 2026-05-20:
  - `docs/10-ui-design-route.md` defines the required OKX Web3 / cyberpunk neon / glassmorphism / aurora-galaxy route and page upgrade order.
  - `scripts/dev-preflight.mjs` reads the development iron law, UI Skill, PRD, page flow, UI route, `AGENTS.md`, and `SESSION_STATE.md` before verification continues.
  - `scripts/verify-full.cmd`, `scripts/verify-full.ps1`, and `scripts/verify-full.sh` now run preflight as step 0; agent and save-log verification inherit it.
  - `.cursor/rules/ion-ui-design-workflow.mdc` enforces reading the iron law and UI route before frontend work.
- swap.ion UI conformance completed on 2026-05-20:
  - `.memory-bank/architecture-audit.md` now records UI audit requirements and implementation memory.
  - `frontend/src/components/background/AuroraGalaxyBackground.tsx` uses a Canvas 240-particle aurora/galaxy field on #03050f.
  - `frontend/src/pages/DashboardPage.tsx` is now a `swap.ion` ION Chain DEX surface with glass cards, flowing neon border, three market depth layers, 3D floating chart, and controlled quote math.
  - `frontend/src`, `backend`, and E2E tests were cleared of visible `mock/placeholder/shell/draft/TBD/Build Checklist` wording.
  - Strict preflight, encoding, frontend verify, backend verify/audit/stress, and strict full verify passed.
  - Manual browser validation produced `/opt/cursor/artifacts/swap_ion_ui_conformance_walkthrough.mp4`.
- Trade desk UI continuation completed on 2026-05-20:
  - `frontend/src/pages/BusinessPages.tsx` now renders `TradeDeskPage` outside the generic product module layout.
  - Trade has market stat cards, 3D chart/K-line surface, `TWAP guard active`, right-side Limit order, Order book, Market trades, and Orders and risk.
  - Playwright now has 14 tests including `trade page shows professional desk modules`.
  - Strict preflight, encoding, frontend verify, and strict full verify passed.
  - 100-pass gate completed: `PASSED=100`, `FAILED=0`, `RESULT=GREEN`.
  - Manual browser validation produced `/opt/cursor/artifacts/trade_desk_ui_walkthrough.mp4`.
- User UI correction on 2026-05-20:
  - The true front-end UI target is the provided 4D liquid-glass reference style: aurora/galaxy background, thick cyan/magenta/violet neon rims, glossy translucent cards, irregular rounded glass silhouettes, and 3D feature icons.
  - Flat table-line pages, grey strip controls, tiny compressed typography, and plain engineering forms are design failures even if tests pass.
  - Before claiming UI completion, manually compare rendered screenshots/video against the reference style, not just E2E success.
- User data correction on 2026-05-20:
  - Empty data and pseudo-code are untouchable red lines. They must never be used as product UI content.
  - Loading/error states are allowed only as real request lifecycle states tied to concrete integrations; they cannot hide missing implementation.
  - Product values must come from typed backend/data integrations, source adapters, cache, indexer/upstream APIs, or reviewed local seed data with provenance.
- Overall memory consolidation on 2026-05-20:
  - `.memory-bank/live-data-reference.md`, `.memory-bank/implementation-playbook.md`, and `.memory-bank/overall-design-framework.md` were restored/added from current memory plus Git-history decisions.
  - `scripts/dev-preflight.mjs` now requires the full memory set before verification continues.
  - If a user says a requirement was decided earlier and current memory is incomplete, search Git history before answering or implementing.
  - Right-top avatar is the Profile Hub: avatar, NFT avatar source, wallets, primary wallet, `.ion`, ION ID/KYC, language, theme, privacy, security logs, approvals, orders, grid strategies, staking, bridge history, domains, notifications, referral, badges, and full Profile entry.
- Security audit and stress framework completed on 2026-05-20:
  - `.memory-bank/security-audit-and-stress-framework.md` defines attack defenses, 40 test families, pressure/chaos sandboxes, and code audit procedure.
  - `docs/23-security-audit-and-stress-sandbox.md` turns the framework into an execution checklist and sandbox plan.
  - `scripts/security-preflight.mjs` verifies security memory/docs/skills are present before high-risk work.
  - `scripts/dev-preflight.mjs` now requires the security framework.
- Agent automatic workflow on 2026-05-20:
  - `scripts/agent-workflow.mjs` orchestrates memory preflight, security preflight, SESSION_STATE next-action printout, and optional `verify-full` tiers (`memory` | `verify` | `strict`).
  - `scripts/agent-verify.sh` is the POSIX non-interactive entry (same intent as `scripts/agent-verify.cmd`).
  - `node scripts/agent-workflow.mjs --tier verify --execute` passed: encoding 100 files OK, backend 12 tests, stress OK, frontend 15 Playwright passed, audit high 0.
- Quote / slippage / precision minimum loop completed on 2026-05-20:
  - `backend/src/lib/decimal.ts` uses BigInt floor math for decimal parsing/formatting and bps calculations.
  - `backend/src/services/quotes.ts` provides typed quote output with amount units, estimated output, minimum received, protocol fee, fee bps, slippage bps, price impact bps, route, precision, and provenance.
  - Confirmed and fixed the financial quote bug where the previous frontend minimum received path could apply slippage to gross output before protocol fee. Current calculation uses `estimatedOutputUnits = grossOutputUnits - protocolFeeUnits`, then computes `minimumReceivedUnits` from that net amount.
  - `/api/trade/quote` is wired through the API gateway.
  - Frontend Swap consumes the backend quote API and displays `bigint-floor / ION 9d`, protocol fee bps, route, minimum received, and price impact.
  - Backend tests cover valid quote precision and invalid slippage; backend stress includes quote endpoint; frontend E2E covers backend precision/slippage bps.
  - Fixed frontend E2E runner to avoid orphaned Vite preview processes during repeated verification.
  - Quote precision 100-pass gate completed after the runner fix: `PASSED=100`, `FAILED=0`, `RESULT=GREEN`.
  - Remaining gaps: contract minimum-output enforcement, oracle/TWAP adapter, and MEV simulations wait for contract/oracle services.
- Minimum-output + liquid-glass desks（2026-05-20）：
  - `backend/src/lib/minimum-output.ts` 与 `quotes.ts` 共享公式；`contracts/bsc/IonSwapRouter.sol` + `IonSwapPoolMock`；`docs/24-swap-router-minimum-output.md`。
  - `frontend/src/components/ui/glass/`：`GlassPanel`、`MetricTile`、`PageHero`、`ChartFrame`、`StatusPill`、`RiskNotice`。
  - `BusinessPages.tsx`：`GridDeskPage`、`PoolDeskPage`、`BridgeDeskPage`、`BurnDeskPage`、`DomainDeskPage`、`AIDeskPage`、`StakeDeskPage`（liquid-glass 台面 + local-seed 标注）。
  - `scripts/verify-contracts.mjs` 已接入 `scripts/verify-full.sh`（step 2b）；本环境 `forge` 未安装时 SKIP Solidity 测试。
  - `node scripts/agent-workflow.mjs --tier verify --execute` 绿灯：encoding 127 files OK；backend **14** tests；contract TS math OK；frontend **16** Playwright passed；audit high **0**。
- Phase 3 backend foundation first slice completed on 2026-05-18:
  - Added `backend/` TypeScript API gateway with `GET /api/health`, `GET /api/config/public`, `GET /api/tokens`, and `GET /api/markets/tickers`.
  - Responses use `{ data, meta }` with mock provenance, ISO `updatedAt`, `stale`, and normalized `requestId`.
  - Added backend API tests, typecheck/build, high-severity audit wrapper, and local stress smoke.
  - Frontend ticker strip now fetches `/api/markets/tickers` through `frontend/src/lib/ionApi.ts` and keeps an offline fallback for static preview/E2E.
  - `verify-full.cmd`, `verify-full.ps1`, `verify-100.ps1`, and GitHub Actions now include backend verify, backend audit, backend stress, frontend verify, and frontend audit.
  - Frontend verify now uses a dynamic preview port via `frontend/scripts/verify-e2e.mjs`, avoiding fixed-port collisions during 100-pass loops.
  - `audit:high` now uses retry wrappers for transient npm registry/proxy failures while still failing on real high-severity vulnerabilities.
  - Independent read-only code review found and drove fixes for frontend audit exit-code handling, 100-pass backend stress coverage, generated-file ignores, request-id normalization, and CI/doc verification parity.
  - Verification evidence: direct `scripts\verify-full.cmd` exited `0`; latest 100-pass gate completed `PASS 100/100`, `RESULT=GREEN`, exit code `0` after 4,001,376 ms.
- Phase 3 backend gateway second slice completed on 2026-05-18:
  - Added public mock endpoints `GET /api/burn/summary`, `GET /api/staking/summary`, `GET /api/bridge/routes`, `GET /api/domain/resolve?name=`, and `GET /api/profile/demo`.
  - Added `.ion` domain validation, stable `ION_DEX_E_*` error codes, OPTIONS `X-Request-Id` tracing, and payload-level provenance for mock financial/chain data.
  - Expanded backend API tests to 12 passed, including burn/staking/bridge/domain/profile, domain validation errors, stable error contracts, and OPTIONS tracing.
  - Expanded backend stress smoke to all 9 public endpoints, defaulting to 120 requests per endpoint with 24-way concurrency and response/provenance contract checks.
  - Independent read-only review found mock-data mislabeling risk, stress-smoke scope limits, error-code drift, and OPTIONS tracing gaps; code now fixes the contract/tracing/provenance findings, while production-grade k6/wrk load remains a future task.
  - Verification evidence: direct `scripts\verify-full.cmd` exited `0`; expanded 100-pass gate completed `PASS 100/100`, `RESULT=GREEN`, exit code `0` after 3,899,653 ms.

## Current Blocker

Reliable shell execution is confirmed. Memory Bank MCP is loaded. ION official source path is confirmed. No blocker for the automation YAML import; only the pre-existing `package-lock.json` name change remains outside this task.

## Next Action

1. **UI P1 续**：`BusinessPages.tsx` 批量 `NeonCard` → `NeonGlassCard`/`GlassPanel`；WalletConnectPanel 玻璃壳；补 `docs/ui-audit-screenshots/ref-*.png` 后像素对比。
2. **UI P0 续**：Burn/Bridge/AI Desk 真实 API，去 CSS 假图表（见 `ui-deliverable-self-audit-2026-05-22-p0.md`）。
3. 每轮 UI 结束：`bash scripts/ui-round-verify.sh` + 新 `docs/ui-deliverable-self-audit-*.md`。
4. If needed, open/import the automation manually in Cursor Automations using `.cursor/automations/ion-dex-autonomous-build.yml` as the source of truth.
2. Use `cd frontend && npm run dev:local` for frontend runtime verification on `http://localhost:3001/`.
3. Use `D:/openclaw-tools/ion` as the official ION reference source for FunC style, DNS, wallet, multisig, tonlib, lite-client, and API schemes.
4. Use the relevant project skill before each domain task: official source, UI, contract audit, or data backend.
5. Run Agent Review (`/agent-review`) after meaningful diffs and before final verification when available.
6. For every development task, proactively load `.cursor/skills/cursor-engineering-workflow/SKILL.md` and `.cursor/skills/ion-dev-accelerators/SKILL.md` as needed; use `docs/cursor-docs-feature-memory.md` and `docs/development-accelerators-memory.md` as local references.
7. Do not wait for the user to request worktrees, Agent Review, Bugbot, Hooks, MCP, Cloud Agents, CLI automation, Rules, Skills, or verification strategy when they would improve the task.
8. Phase 5 八页业务表单草稿 + E2E：2026-05-18，`scripts/check-encoding.ps1` 已排除本地官方 ION 参考树 `/ion/`（该目录被 `.gitignore` 忽略，不属于本仓源码）；`scripts\verify-100.ps1` 完成 **100-pass**：`PASS 100 OK`，`PASSED=100`，`FAILED=0`，`RESULT=GREEN`。`frontend` `npm run verify` 使用 `start-server-and-test` + **`tcp:127.0.0.1:59333`**，Playwright **`12 passed`**；`audit:high` **`0`**。顶栏导航改为横向滚动可视，修补生产样式下 `hidden lg:flex` 永久隐藏问题。
9. Wallet/Profile shell：2026-05-18，`AppShell` wallet button now opens a local provider picker (Online+ Wallet / ION Browser Wallet / WalletConnect + OKX), drafts a profile session, and supports disconnect without private keys, RPC calls, or signatures. Single full verification after the change: encoding OK, frontend `npm run verify` **13 passed**, `audit:high` **0**. 100-pass gate completed: `PASS 100 OK`, `PASSED=100`, `FAILED=0`, `RESULT=GREEN`.
10. External reference architecture：2026-05-18，`docs/09-reference-architecture.md` added to map the user's reference repositories into ION DEX phases. Key decision: use backend gateway repositories (`tyk`, `shenyu`, `ocelot`) as pattern references only, and start Phase 3 with a minimal typed API gateway/BFF rather than vendoring a full gateway product.
11. Agent capability Skills：2026-05-18，installed project-local Skills `skill-vetter`, `self-evolving`, `tavily`, `find-skill`, `luke-agent-browser-clawdbot`, and `summarize-pro`; registered them in `AGENTS.md` with trigger guidance.
12. Workflow preference：2026-05-18，user explicitly requested making strong use of `self-evolving` and automatic workflow because they help development. Treat `cursor-engineering-workflow` as the pre/during-work operating loop and `self-evolving` as the post-work memory improvement loop.
13. Accelerator/review preference：2026-05-18，user explicitly emphasized that other capabilities are also important, especially parallel development worktrees and code audit/review. For non-trivial work, evaluate worktree isolation and review/audit paths before implementation and before accepting diffs.
14. Claude-Flow/RuFlo：2026-05-18，user required Claude-Flow `3.7.0-alpha.35` / 98-agent capability as installed ability. Package is installed/pinned and CLI works, but RuFlo is not initialized in main, Claude-Flow MCP is not configured in main, WASM agent runtime is missing, and root audit has high/critical findings. Treat as controlled local accelerator, not unrestricted daemon. Project verification after installation passed through `scripts\verify-full-save-log.cmd --no-pause`; root Claude-Flow audit risk remains separate. A sandbox worktree validated minimal init and MCP diagnostics, but showed generated configs require pinning and security review before any main-repo adoption.
15. Profile Hub（2026-05-20）：右上角头像入口升级为 typed Profile Hub：`GET /api/profile/session`、10 钱包列表（ION native + 7 EVM 检测器）、头像/KYC/`.ion`/偏好/快捷入口/连接后会话检测；前端 `ProfileHub.tsx` + 隐私模式 ticker 遮罩。单次 `verify-full` 绿灯（backend 10 tests、frontend 15 passed、audit high 0）。`verify-e2e.mjs` 会在 :8787 旧网关缺少 profile 路由时自动重启。
16. Real wallet detectors（2026-05-20）：`frontend/src/lib/wallet` 浏览器探测 + EVM `eth_requestAccounts`/`eth_chainId`；Profile Hub 显示 Installed/Not detected；live address/chain 合并进 `/api/profile/session`；`realWalletAdapters: true`；`verify-full` 绿灯（backend 11、frontend 15）。
17. Official ION wallet injection（2026-05-20）：对齐 `ion-chrome-wallet`（`window.ionmask.ionconnect`）、`ion-browser-wallet`（`window.tonwallet.tonconnect`）、`ion-gateway` InjectedProvider；`frontend/src/lib/wallet/ion-official.ts` + `ion-bridge.ts`；TonConnect manifest `frontend/public/ionconnect-manifest.json`；`verify-full` 绿灯（backend 12、frontend 15）。
18. TonConnect SDK + session watch（2026-05-20）：`@ion-gateway/sdk` 远程桥、`wallet-session-watch`、`subscribeIonConnectStatus`；`verify-full` 绿灯。
19. TonConnect UI QR 模态（2026-05-20）：`@ion-gateway/ui-react` + `@ion-gateway/ui`；`IonConnectUiProvider` 共享 `getIonConnect()`；`IonConnectModalBridge` + `openIonConnectWalletModal()`；Profile Hub WalletConnect 优先应用内 QR，保留 universalLink 回退；`verify-full` 绿灯（backend 12、frontend 15、audit high 0）。
20. Agent automatic workflow（2026-05-20）：`scripts/agent-workflow.mjs` + `scripts/agent-verify.sh`；开发前强制记忆库 preflight；`--tier verify --execute` 串联 `verify-full` 已绿灯。
21. Minimum-output + liquid-glass desks 已落地并 `verify-full` 绿灯（2026-05-20）；见上条 Current State。
22. Dashboard/Trade 玻璃层（2026-05-20）：`DashboardPage` 与 `TradeDeskPage` 统一玻璃 primitive；`GlassPanel.flowBorder`；Playwright `channel: chrome`；`verify-full` 绿灯（frontend **16** Playwright）。
23. Next：`burn-service` / `bridge-status-service` / `ai-market-service` 接线替换 local-seed；侧栏钱包面板与 Profile Hub 统一；`origin/main` 合并后重跑 `verify-full`；重大里程碑后 100-pass 门禁。
16. Phase 3 adapter/cache + partial frontend read wiring done: backend adapter/cache layer (19 tests), Stake/Burn metrics from API with fallback, full verify green. Next: Bridge/Domain frontend read paths, upstream timeout/retry contracts, Redis cache, then PostgreSQL scaffolding.

## Memory MCP Candidates

- `alioshr/memory-bank-mcp`: recommended project memory bank.
- `memory-graph/memory-graph`: graph-based persistent memory.
- `Nonymaus/cursor-kg`: local Cursor knowledge graph.
- `gannonh/memento-mcp`: Neo4j-backed memory, more heavyweight.

## Current Task (旺财 dispatched, 2026-05-18 21:46)

**Priority: Phase 2 — Full Audit + Compile + Extend**

### ⚠️ Background

旺财 manually wrote 15 FunC contracts + 2 Solidity contracts + Foundry tests. These have NOT been audited, NOT been compiled (no FunC compiler yet), NOT passed 100-round stress test. **Treat these all as draft code needing review.**

### 🔴 Task 1: Audit All Existing Contracts — **已完成（2026-05-18）**

已按 `ion-contract-audit` 技能通读：`contracts/ion/**/*.fc`（22 个 `.fc`）、`IonWrapper.sol`、`BSCVault.sol` 及对应 Foundry 测试。**结论：全部为草稿级；FunC 与 STON/生产要求差距大；Solidity 有可修复的中高危逻辑问题。**

**关键发现（按严重程度）：**

1. **Critical — FunC 资金与入口安全**
   - `pool.fc` 的 `burn_notification_ext` / 移除流动性路径未验证 `SENDER` 是否为该池约定的 **LP Jetton 钱包**；若消息体可被伪造且 opcode 命中，存在**任意操纵储备**风险。需与官方 Jetton/LP 回调模式对齐并加白名单校验。
   - `router/dex.fc` 将交换消息发到 `token_wallet1`，需在 STON V2 对照下确认目标地址是 **池的 Jetton 钱包** 还是 **池合约**；当前注释写 “target pool”，与 `pool.fc` 的 `recv_internal` 期望不一致风险高。

2. **High — FunC 实现与部署一致性**
   - `router.fc` 的 `handle_deploy_pool` 在池子静态数据首字段写入 `storage::admin_address`，而 `deployer.fc` 的 `deploy_pool` 写入 `msgs::get_router_address()`；与 `pool/storage.fc` 中 `router_address` 语义冲突，**可能导致 set_fees 等仅 router 可调的逻辑失效或被错误主体控制**。
   - `vault.fc`、`lp_account.fc`、`lp_wallet.fc` 使用 `#include "../common/common.fc"`，相对 `contracts/ion/` 会解析到 **不存在的** `contracts/common/common.fc`；应与其他入口一致为 `#include "common/common.fc"`（任务 2 编译必爆点）。
   - `router/dex.fc` 引用 `gas::pool::swap`，`common/gas.fc` 中 **未定义**，编译失败。

3. **High — AMM 语义缺口**
   - `pool.fc` 只走 `pool::get_swap_out`（恒定乘积）；`stableswap.fc` 已引入但 **swap 路径未接入**，与“双曲线/稳定池”规格不符。
   - `lp_wallet.fc` 将 `burn_notification_ext` 当用户 burn 处理，与常见 Jetton **`burn` / `burn_notification`** 模型不一致，需对照 TON Jetton 标准与 STON 实现核对 opcode 与负载布局。

4. **Medium — BSC `BSCVault.sol`**
   - `withdrawalId = keccak256(abi.encodePacked(token, to, amount, deadline, sigCount))` **不含 nonce**；在首次提现尚未 `executeWithdrawal` 前，攻击者可用 **相同参数再次** `requestWithdrawal`，覆盖 `pendingWithdrawals` 并 **重复计入 `dailyWithdrawn`**（会计与原计划 timelock 状态混乱）。应用 **nonce 或已消费 digest** 纳入 ID，并在重复请求时 revert。
   - `setThreshold` 不校验 `_threshold <= 当前 SIGNER 人数`，可导致永久无法达标。
   - `recoverETH` 使用 `transfer`（2300 gas），向合约地址 rescue 可能失败。
   - `requestWithdrawal` 中 `amount == 0` 时提前 `return bytes32(0)` 且不 revert，易产生误导调用。

5. **Low — `IonWrapper.sol`**
   - 引入 `EIP712` 但未使用；`mintCap == 0` 表示无上限，属产品参数风险（非代码 bug）。
   - 单地址 `bridge`：符合设计但属中心化信任假设。

6. **测试覆盖**
   - `BSCVault.t.sol` 仅覆盖存款、阈值不足、暂停；**未覆盖** 成功多签提现、timelock、`withdrawalId` 碰撞、双重 `requestWithdrawal`。
   - `IonWrapper.t.sol` 未测 `mintCap` 累加边界、`burn` 与 `totalBridged` 一致性等。

**Task 1 交付：** 以上为本轮静态审计记录；**未改合约代码**（修复留给 Task 2+）。

**下一项：** Task 2 — FunC 工具链 + 全量编译 + 修复编译错误。

### 🔴 Task 1: Audit All Existing Contracts（原始要求清单）

Load `.cursor/skills/ion-contract-audit/SKILL.md` before starting.

Review every contract for:
- Pattern correctness (must match STON.fi V2): pragma, ctx, storage, message dispatch
- funcbox API usage (funcbox at `contracts/ion/node_modules/@ston-fi/funcbox`)
- ION-specific adaptations (gas +10%, burn ops, domain ops)
- Missing imports or missing opcodes
- Security: overflow, reentrancy, auth checks

Files to audit:
- `contracts/ion/common/*.fc` (7 files)
- `contracts/ion/pool.fc` + `pool/*.fc` + `pool/pools/*.fc`
- `contracts/ion/router.fc` + `router/*.fc`
- `contracts/ion/vault.fc`
- `contracts/ion/lp_account.fc`, `lp_wallet.fc`
- `contracts/ion/deployer.fc`
- `contracts/bsc/src/IonWrapper.sol`, `BSCVault.sol`
- `contracts/bsc/test/IonWrapper.t.sol`, `BSCVault.t.sol`

### 🔴 Task 2: Compile Everything

- Find/install FunC compiler for Windows (or `func-js`)
- Compile all 15 `.fc` files. Fix ALL compilation errors.
- Run `forge build` in `contracts/bsc/`, fix any warnings.

### 🔴 Task 3: 100-Pass Stress Test

- Write and run `contracts/bsc/test/IonWrapper.stress.t.sol` — 100 iterations of mint/burn/transfer boundary cases.
- Write and run `contracts/bsc/test/BSCVault.stress.t.sol` — 100 iterations of deposit/withdraw/signature scenarios.
- All 100 passes MUST succeed. Zero failures tolerated.
- Gas snapshot baseline.

### 🔴 Task 4: Write Missing Contracts

- `contracts/ion/staking_pool.fc` — stake/unstake/claim_rewards
  - STON.fi V2 patterns, funcbox, gas from common/gas.fc
  - Reference: `contracts/ion/pool.fc`, `D:/openclaw-tools/dex-core-v2/contracts/`

### 🔴 Task 5: CI Verification Update

- Add Foundry build + test steps to `scripts/verify-full.cmd`
- Add FunC compile step to `scripts/verify-full.cmd`
- Add both to `.github/workflows/ion-dex-verify.yml`

### Spec Document

Full spec at: `docs/phase2-agent-task.md`

### Rules

- Load `ion-contract-audit` skill before any contract work.
- Load `ion-official-source` for ION FunC patterns.
- Run `scripts/agent-verify.cmd` after each task.
- Each task = one commit with clear message.
- 100-round stress: ZERO failures tolerated.
- 旺财 monitors via git log + file timestamps.
