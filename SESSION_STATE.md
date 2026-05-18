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

1. If needed, open/import the automation manually in Cursor Automations using `.cursor/automations/ion-dex-autonomous-build.yml` as the source of truth.
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
15. Phase 3 adapter/cache + partial frontend read wiring done: backend adapter/cache layer (19 tests), Stake/Burn metrics from API with fallback, full verify green. 100-pass gate re-running. Next: Bridge/Domain frontend read paths, upstream timeout/retry contracts, Redis cache, then PostgreSQL scaffolding.

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
