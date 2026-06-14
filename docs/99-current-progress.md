# Current Progress

## 2026-06-14 README / whitepaper language-switch honesty repair

- **Scope**: fixed the public documentation language-switch entry layer so GitHub readers are no longer told that every listed language is a full same-language sitewide switch.
- **What changed**:
  - rewrote the root language bars in `README.md`, `README.zh-CN.md`, and the other public `README.*.md` entry pages so they now distinguish:
    - full public docs currently available in `English` and `简体中文`
    - entry pages for the remaining listed languages
  - updated `docs/whitepaper-index.md` to label only `English + Simplified Chinese` as continuous public doc navigation;
  - updated `docs/whitepaper/zh/WHITEPAPER.zh-CN.md` and the other `docs/whitepaper/*/WHITEPAPER.*.md` entry files so they now describe themselves honestly as whitepaper entry editions / entry pages instead of implying a completed full-language document tree.
- **Files touched**:
  - `README.md`
  - `README.zh-CN.md`
  - `README.ar.md`
  - `README.de.md`
  - `README.es.md`
  - `README.fr.md`
  - `README.hi.md`
  - `README.id.md`
  - `README.it.md`
  - `README.ja.md`
  - `README.ko.md`
  - `README.pt.md`
  - `README.ru.md`
  - `README.tr.md`
  - `README.zh-TW.md`
  - `docs/whitepaper-index.md`
  - `docs/whitepaper/zh/WHITEPAPER.zh-CN.md`
  - `docs/whitepaper/ar/WHITEPAPER.ar.md`
  - `docs/whitepaper/de/WHITEPAPER.de.md`
  - `docs/whitepaper/es/WHITEPAPER.es.md`
  - `docs/whitepaper/fr/WHITEPAPER.fr.md`
  - `docs/whitepaper/hi/WHITEPAPER.hi.md`
  - `docs/whitepaper/id/WHITEPAPER.id.md`
  - `docs/whitepaper/it/WHITEPAPER.it.md`
  - `docs/whitepaper/ja/WHITEPAPER.ja.md`
  - `docs/whitepaper/ko/WHITEPAPER.ko.md`
  - `docs/whitepaper/pt/WHITEPAPER.pt.md`
  - `docs/whitepaper/ru/WHITEPAPER.ru.md`
  - `docs/whitepaper/tr/WHITEPAPER.tr.md`
  - `docs/whitepaper/zh-TW/WHITEPAPER.zh-TW.md`
- **Verification**:
  - local relative-link check across all edited README / whitepaper language-entry files: `badCount=0`
  - per-file UTF-8 without BOM / no NUL validation across all edited files: `encodingBadCount=0`
- **Important decision**:
  - do not present entry pages as if they were full same-language sitewide switching.
  - only claim continuous public language support where the repository actually has a linked doc tree.
- **Residual gap**:
  - languages other than English and Simplified Chinese still remain entry-page level until their public doc trees are actually built out.

## 2026-06-14 Frontend verify stabilization for autonomous gate

- **Scope**: removed the frontend/E2E regressions that were blocking the new autonomous `verify-100` hard gate from resuming on a real green baseline.
- **What changed**:
  - stabilized English-only E2E baseline handling in `frontend/e2e/helpers.ts` without changing product default language;
  - hardened `frontend/e2e/domain-manage.spec.ts` to wait on the actual register response instead of relying on brittle click timing;
  - switched the wallet smoke assertion in `frontend/e2e/smoke.spec.ts` to stable `data-testid` targeting;
  - added extra port-teardown tolerance in `frontend/scripts/verify-e2e.mjs` to reduce verify-time `EADDRINUSE` cleanup races.
- **Files touched**:
  - `frontend/e2e/helpers.ts`
  - `frontend/e2e/domain-manage.spec.ts`
  - `frontend/e2e/smoke.spec.ts`
  - `frontend/scripts/verify-e2e.mjs`
- **Verification**:
  - targeted recovery:
    - `cd frontend && $env:PLAYWRIGHT_TEST_PATH='e2e/domain-manage.spec.ts'; node scripts/verify-e2e.mjs`
    - `cd frontend && $env:PLAYWRIGHT_TEST_PATH='e2e/smoke.spec.ts'; node scripts/verify-e2e.mjs`
  - full frontend verify:
    - `cd frontend && npm run verify`
    - result: `34 passed`, `2 skipped`
  - full repository verify:
    - `scripts\verify-full-save-log.cmd --no-pause`
    - `%TEMP%\ion-verify-full.txt` tail confirms `34 passed`, `2 skipped`, frontend `audit:high` `found 0 vulnerabilities`, and `OK - verify-full completed.`
- **Operational note**:
  - the old `verify-100` status recorded in the autonomous queue/watchdog from 2026-06-13 is stale and has been reset for a fresh rerun.
  - the next required step is a brand-new guarded `verify-100` run; no commit or push is allowed until that proof is green.

## 2026-06-14 Autonomous workflow hard gate upgrade

- **Scope**: upgraded the repository work-order pipeline so every stage now requires a fresh `verify-100` GREEN proof before any commit or push is allowed.
- **What changed**:
  - added `scripts/verify-100-gate.mjs` as the unified proof recorder and commit/push guard;
  - added versioned repository hooks under `.githooks/` plus installer `scripts/install-git-hooks.mjs`;
  - changed `scripts/verify-100.ps1` to record a proof immediately after `RESULT=GREEN`;
  - changed `scripts/autonomous-work-watchdog.mjs` to pass queue/stage activation metadata into guarded verify and guarded auto-commit flows;
  - replaced unsafe auto-shipping behavior in `scripts/verify-100-until-green.ps1` and `scripts/verify-100-watch-and-ship.ps1` so they no longer perform direct git commit/push;
  - changed `scripts/autonomous-git-commit-push.mjs` and `scripts/ui-design-phase-pipeline.mjs` to use guarded commit flow plus scoped staging instead of `git add -A`;
  - removed the `--skip-verify-100` bypass from the UI batch pipeline;
  - updated automation/work-order docs so `verify-full` is only the fast loop and `verify-100` is the required stage-exit gate before commit/push.
- **Files touched**:
  - `.githooks/*`
  - `.cursor/automations/ion-dex-autonomous-build.yml`
  - `scripts/verify-100-gate.mjs`
  - `scripts/install-git-hooks.mjs`
  - `scripts/lib/git-stage-scope.mjs`
  - `scripts/verify-100.ps1`
  - `scripts/autonomous-work-watchdog.mjs`
  - `scripts/autonomous-git-commit-push.mjs`
  - `scripts/ui-design-phase-pipeline.mjs`
  - `scripts/verify-100-until-green.ps1`
  - `scripts/verify-100-watch-and-ship.ps1`
  - `docs/08-ci-agent-automation.md`
  - `docs/cursor-autonomous-work-order-2026-05-25.md`
- **Verification planned in this task**:
  - hook install
  - script syntax smoke
  - guarded proof path smoke
- **Residual risk**:
  - old ad hoc scripts outside the active workflow may still describe legacy commit habits in comments or history;
  - local clones must run `node scripts/install-git-hooks.mjs` once to activate the versioned hooks.

## 2026-06-14 Daily security loop unblock

- **Scope**: unblocked the new daily security automation path so local security preflight and Docker security sandbox checks can run in this repository.
- **What changed**:
  - added `Hard Data Rules` to `.memory-bank/live-data-reference.md` so `node scripts/security-preflight.mjs` can complete successfully;
  - hardened `docker/security-sandbox/docker-compose.yml` to avoid Docker Desktop address-pool exhaustion by reusing `network_mode: bridge` for networked sandbox profiles;
  - kept the sandbox read-only while redirecting Python user install/cache paths into `tmpfs`-backed `/tmp`;
  - updated `sast-audit` to invoke `python -m semgrep ...` and `python -m bandit ...`, avoiding PATH assumptions inside the container.
- **Verification**:
  - `node scripts/security-preflight.mjs` -> `OK - security preflight completed.`
  - `node scripts/verify-security-1000.mjs` -> `OK - SecurityMatrix: 10 test functions × 100 iterations = 1000 checks (Foundry).`
  - `docker compose -f docker/security-sandbox/docker-compose.yml --profile sast-audit run --rm sast-audit` -> completed successfully after compose fixes.
- **Residual risk**:
  - current `sast-audit` installs tooling on every run, so the daily job is functional but slower than an image with prebuilt tools;
  - `bandit` remains low-value for this mostly TypeScript/FunC/Solidity repository and reported `Total lines of code: 0`; `semgrep` is the more relevant part of the current SAST pass;
  - this task did not run `verify-full` or `verify-100` because no product code path was changed beyond security-memory/compose unblock work, and the worktree already contains unrelated in-progress edits.

## 2026-06-14 Daily security loop acceleration

- **Scope**: reduced cold-start cost for the daily Docker SAST path and aligned the automation to the one confirmed Docker entry.
- **What changed**:
  - added `docker/security-sandbox/Dockerfile.sast-audit` to preinstall `semgrep` and `bandit`;
  - switched `docker/security-sandbox/docker-compose.yml` `sast-audit` from ad-hoc `python:3.12-slim` + runtime `pip install` to a local built image: `ion-dex/sast-audit:local`;
  - removed the per-run `pip install` step from the `sast-audit` command;
  - updated `docker/security-sandbox/README.md` to use `docker compose ... run --build --rm sast-audit`.
- **Expected impact**:
  - daily security automation no longer needs to reinstall SAST tooling on every run;
  - the confirmed Docker entry for defensive SAST is now `docker/security-sandbox` profile `sast-audit`.

## 2026-06-14 README / Whitepaper public-disclosure audit

- **Scope**: reviewed and corrected public-facing documentation language in `README.md`, `docs/WHITEPAPER.md`, `docs/whitepaper-index.md`, `docs/developer-index.md`, and `docs/public-structure.md`.
- **Key fixes**:
  - downgraded misleading "already live / already proven" wording into explicit `current repo evidence` vs `roadmap / draft design` boundaries;
  - added a top-level whitepaper boundary note clarifying that the document is not proof of deployed mainnet functionality;
  - repaired `docs/whitepaper-index.md` dead links by replacing missing private-memory references with public repository-local documents;
  - removed BOM from `docs/WHITEPAPER.md`;
  - corrected whitepaper TOC drift and removed duplicated TOC fragments;
  - aligned economic language to `draft / pre-mainnet / audit-required` status instead of presenting conflicting fee splits as immutable fact.
- **Verification**:
  - local link check for edited public docs: `badCount=0`;
  - BOM/NUL scan on edited files: all clean;
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-encoding.ps1 -Path .\docs` -> `Scanned: 81 files`, `OK - All files are UTF-8 without BOM, no NUL bytes.`
- **Residual risk**:
  - other public docs outside this pass may still contain older economic or capability language;
  - translated README/whitepaper editions were not synchronized in this task and may still reflect the old wording.

## 2026-06-14 README / Whitepaper language-switch repair

- **User correction**: the requested fix was not wording polish alone. The user explicitly required that README language switching stop being a placeholder and that switching should lead into a same-language documentation path instead of immediately falling back to English.
- **What changed**:
  - replaced the old short placeholder `README.zh-CN.md` with a full Chinese flagship README;
  - added `docs/README.md` as a language-aware docs hub for GitHub directory entry;
  - added a new public Chinese document tree under `docs/zh-CN/`;
  - created same-language Chinese entry pages for:
    - `index.md`
    - `whitepaper-index.md`
    - `developer-index.md`
    - `api-overview.md`
    - `contracts-overview.md`
    - `sdk-overview.md`
    - `quick-start.md`
    - `merchant-onboarding.md`
    - `payment-access.md`
    - `settlement-integration.md`
    - `ecosystem-entry.md`
    - `public-structure.md`
    - `roadmap-guide.md`
  - upgraded `docs/whitepaper/zh/WHITEPAPER.zh-CN.md` from a pure scaffold into a Chinese whitepaper entry page that points into the new Chinese public-doc tree;
  - updated `docs/whitepaper-index.md` to state the real support boundary clearly: practical continuous language navigation is now available for **English + Simplified Chinese**, while other languages remain entry editions.
- **Verification**:
  - local relative-link check across `README.zh-CN.md`, `docs/README.md`, `docs/whitepaper-index.md`, `docs/whitepaper/zh/WHITEPAPER.zh-CN.md`, and all `docs/zh-CN/*` files: `badCount=0`;
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-encoding.ps1 -Path .\docs\zh-CN` -> `Scanned: 13 files`, `OK - All files are UTF-8 without BOM, no NUL bytes.`
- **Residual risk**:
  - GitHub Markdown cannot provide runtime whole-site machine translation; this fix implements a static same-language document tree instead;
  - non-Chinese language READMEs and whitepaper entry files are still mostly entry editions, not full same-language public document trees;
  - the Chinese whitepaper itself is still not a full synchronized translation of `docs/WHITEPAPER.md`.

## 2026-05-29 AI Gateway — Phase C draft stub + 公开范围文档

- **Phase C**：AI Gateway 增加 design / video brief 类 **draft stub**（经 Sentinel + deny-by-default allowlist）；详见 `docs/ai-sentinel-gateway-contract.md`。
- **公开范围**：新增 `docs/28-public-development-scope.md`（对外路线图概要，无战略细节）；AI 指针文档已脱敏。
- **测试/验证**：backend **89/89** · `verify-full-save-log.cmd --no-pause` ✅。
- **未 commit**（需 Master 明确授权）。

## 2026-05-29 AI Gateway — Phase 1 Sentinel stub + 公私拆分

- 公开仓：I1–I8 摘要、Gateway/Sentinel **契约**、`backend/src/ai/` stub、`check-public-ip-leak.mjs`。
- 完整 AI 内核与白名单正文：**非公开仓**（授权访问）。
- **Dashboard 报价 hook**：`useSwapTradeQuote.ts`。

## 2026-05-28 W5 出口收尾（verify-100 GREEN）

- **阶段状态**：W5 已达出口门禁，`verify-100` 最终 **100/100 全绿**，`RESULT=GREEN`，退出码 `0`。
- **关键证据**：
  - 运行终端：`terminals/330371.txt`
  - 摘要文件：`%TEMP%\ion-verify-100-summary-20260528-114641.txt`
  - 日志文件：`%TEMP%\ion-verify-100-20260528-114641.log`
- **里程碑结果**：
  - `PASS 100 OK (100/100 green)`
  - `RESULT=GREEN`
  - 结束时间：2026-05-28 14:47:57 (UTC+8)
- **代码与提交现状**：
  - W5 功能提交：`a80534dd`（indexer 骨架 + burn/staking 读路径）
  - E2E 稳定性提交：`e3afdaa5`（verify 稳定修复）
- **阶段切换**：`SESSION_STATE.md` 已从 `CURRENT_PHASE=W5` 更新为 `CURRENT_PHASE=W6`。
- **下一步**：进入 W6（Sandwich + Bridge 双重签功能测）并按同门禁流程执行 `verify-full` + `verify-100`。

## 2026-05-26 UI 铁律入库（赛博极光玻璃）

- **记忆库**：`.memory-bank/ui-cyber-glass-iron-law.md`（Master 锁定三色 `#00FFFF` / `#6020FF` / `#FF00FF`、五区布局、玻璃 CSS、避坑、验收）。
- **Cursor**：`docs/cursor-prompt-ion-ui-1to1.md`；规则 `.cursor/rules/ion-cyber-glass-iron-law.mdc`（`frontend/**`）。
- **代码 token**：`frontend/src/styles/global.css` `:root` 与 `.ion-glass-panel` / `.ion-glass-border`；`flow-border` 改为 90deg 三色流光；Tailwind `ion.cyan|purple|magenta` 对齐。
- **技能/文档**：`ion-web3-ui`、`ion-dex-memory`、`docs/10-ui-design-route.md`、`AGENTS.md` 已指向铁律。
- **下一步**：按铁律 + `docs/ui-round2-visual-alignment.md` 做 K 线玻璃舞台与五宫格专属渐变（Batch A/B）。

## Latest — 2026-05-25 全自动工单 W 系列（执行中）

- **主文档**：[`docs/cursor-autonomous-work-order-2026-05-25.md`](cursor-autonomous-work-order-2026-05-25.md)
- **门禁**：`node scripts/autonomous-phase-gate.mjs --gate verify-full|verify-100`
- **CURRENT_PHASE**：W0（见根 `SESSION_STATE.md`）
- **说明**：2026-05-24 产品页派工单（P1A–P3A + AI）已完成；本队列承接记忆库缺口（六引擎、钱包、UI 像素、索引、链上接线、CI）。

## 2026-05-24 派工单 Phase 1 完成

- **P3A BatchTransfer**：✅ 已完成 — verify-full **31/31** E2E 绿；`batch-transfer.spec.ts` 5 tests。
- **派工单 P1A–P3A**：全部交付完成。
- **AI 订阅**：主前端 `#/ai` → `AiSubscriptionPage`；E2E `ai-subscription.spec.ts` 2 tests；Python `pytest` **19/19**；Docker 联调 ✅（`:8000/health` + `/api/ai/price` mock）。

## TASK-P3A BatchTransfer — 2026-05-24 ✅

- **后端**：`batchTransfer.ts` + `batchTransfer.routes.ts`；`batch-transfer.test.ts`（3 tests）；gateway `/api/batch-transfer/*`。
- **前端**：`BatchTransferPage.tsx` + `batchTransferCsv.ts`；Transfer/Collect Tab；ION 协议费；`data-testid` 前缀 `batch-transfer-*`。
- **E2E**：`batch-transfer.spec.ts`（5 tests）；smoke 导航 batch-transfer 断言已对齐。
- **验证**：`verify-full-save-log.cmd --no-pause` exit **0**（Playwright **31/31**；backend **42** tests）。
- **UI 自审**：[`docs/ui-deliverable-self-audit-2026-05-24.md`](ui-deliverable-self-audit-2026-05-24.md) P3A 节。

## TASK-P2B SettingPage — 2026-05-24 ✅

- **前端**：`frontend/src/lib/appSettings.ts` + `SettingPage.tsx`；路由/导航 `settings`；`SwapPage` 默认滑点联动；`global.css` 浅色对比 profile。
- **E2E**：`settings.spec.ts`（2 tests）；只证明 settings 页面壳体、局部 UI 状态更新、本地缓存清理 banner，以及 verify 环境中的 sentinel self-test 结果可见。
- **验证**：历史上曾有 `verify-full-save-log.cmd --no-pause` exit **0**（当时 Playwright **26/26**）；这不是 skill toggle / reconnect / OAuth / 远端持久化 的验证证据。
- **UI 自审**：[`docs/ui-deliverable-self-audit-2026-05-24.md`](ui-deliverable-self-audit-2026-05-24.md) P2B 节。

## TASK-P2A DomainManage — 2026-05-24 ✅

- **后端**：`domainManage.ts` + `domainManage.routes.ts`；`domain-manage.test.ts`（4 tests）。
- **前端**：`DomainManagePage.tsx` + 路由；`ionApi` DomainManage API；`verify-e2e` 检测 domain-manage overview。
- **E2E**：`domain-manage.spec.ts`（2 tests）；只证明 verify 环境中的 lookup/register intent 类流程，不等同真实链上注册完成。
- **验证**：历史上曾有 `verify-full-save-log.cmd --no-pause` exit **0**（当时 Playwright **24/24**）；当前会话重新跑 `frontend npm run verify` 时，`domain-manage.spec.ts` 的注册断言曾出现 `HTTP 502`，因此这里不能继续表述为稳定的 live completion。
- **UI 自审**：[`docs/ui-deliverable-self-audit-2026-05-24.md`](ui-deliverable-self-audit-2026-05-24.md) P2A 节。

## TASK-P1B LiquidityMine — 2026-05-24 ✅

- **合约**：`contracts/bsc/LiquidityMine.sol` + `LiquidityMine.t.sol`（6 tests）；`stress-forge-contract-100.mjs --match-contract LiquidityMine` **100/100**。
- **后端**：`liquidityMine.ts` + `liquidityMine.routes.ts`（pools / stake / unstake / claim）；backend **35** tests 绿。
- **前端**：`LiquidityMinePage.tsx` + 路由/导航；`e2e/liquidity-mine.spec.ts`（2 tests）。
- **验证**：历史上曾有 `verify-full-save-log.cmd --no-pause` exit **0**（当时 Playwright **20/20**）；当前 E2E 只证明 verify 环境中的页面壳体与 stake intent 提交流程，不等同真实链上 staking 执行。
- **修复**：`verify-e2e.mjs` Windows 端口释放（PowerShell）；E2E stake 用例改为 UI intent 断言，避免 stale backend 405。
- **UI 自审**：已并入 [`docs/ui-deliverable-self-audit-2026-05-24.md`](ui-deliverable-self-audit-2026-05-24.md) P1B 节。

## TASK-P1A CopyTrade — 2026-05-24 ✅

- **后端**：`copyTrade.ts` 服务 + `copyTrade.routes.ts`（GET stats / POST start / POST stop）；gateway CORS 支持 POST；**32** backend tests 绿。
- **前端**：`CopyTradePage.tsx` + 路由/导航；`ionApi` CopyTrade API；默认 API `8787`。
- **E2E**：`e2e/copy-trade.spec.ts`（2 tests）；只证明 verify 环境下的页面/本地 API start/stop 交互，不等同 live copy-trading execution。
- **全量**：历史上曾有 `verify-full-save-log.cmd --no-pause` exit **0**（18 Playwright，含 copy-trade）；当前会话重新跑 `frontend npm run verify` 时，`copy-trade.spec.ts` 的 toggle 断言失败，因此这里不能继续表述为稳定 live-complete。
- **UI 自审**：[`docs/ui-deliverable-self-audit-2026-05-24.md`](ui-deliverable-self-audit-2026-05-24.md)
- **附带修复**：FunC `lp_account.fc` / `lp_wallet.fc` / `vault.fc` 迁移至 `ctx::` 访问器；bridge smoke 数据源断言兼容 `upstream`。

---

## Latest Verified Status

- **Phase 2 Task 1 — 合约静态审计（2026-05-18）**：已通读 `contracts/ion/**/*.fc`（22 文件）、`contracts/bsc` 下 `IonWrapper.sol` / `BSCVault.sol` 与 Foundry 测试。结论：FunC 侧存在未校验 LP 回调发送方、router 部署池静态数据与 deployer 不一致、`#include` 路径错误、`gas::pool::swap` 缺失、stableswap 未接入 swap 等 **Critical/High** 级草稿问题；`BSCVault` 存在 `withdrawalId` 不含 nonce 导致的重复 `requestWithdrawal`/日限额会计风险等 **Medium** 级问题。详见 `SESSION_STATE.md`「Current Task → Task 1」。**本轮未改合约代码**；下一步 Task 2 编译与修复。

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
- Visual regression / pixel-diff vs design mockups not yet set up（W3 含 Pixel Correction Protocol）。
- **数据/索引缺口（W1/W5）**：六引擎 upstream、Indexer 生产读路径仍待接；backend 已有 gateway + 多业务路由（43 tests）与 FunC/Forge 合约树，非「零合约」状态。
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
3. Next milestone: wire Burn/Stake/Bridge/Domain frontend read paths to adapter-backed APIs with loading/stale/source labels; add upstream timeout/retry contracts and optional Redis cache; then PostgreSQL schema scaffolding.
4. Official ION reference: `D:/openclaw-tools/ion`.
5. After meaningful diffs, run Cursor Agent Review (`/agent-review`) and then the verification baseline.

## 2026-06-14 FunC / ION Contract Batch 1

- Scope:
  - `contracts/ion/common/common.fc`
  - `contracts/ion/common/gas.fc`
  - `contracts/ion/BridgeInbox.fc`
  - `contracts/ion/router.fc` (minimal bridge execution + ack path for closed-loop delivery)
- What changed:
  - `ctx::body()` now exposes payload after the 32-bit opcode; added `ctx::raw_body()`.
  - Replaced the unsafe `msgs::send_simple()` serialization with a proper internal-message wrapper built on `send_raw_message`.
  - Added bridge opcodes, bridge error codes, and bridge gas/storage constants.
  - Reworked `BridgeInbox.fc` from single-relayer immediate execution into:
    - relayer registry with stable relayer index
    - `pending_dict` approval aggregation
    - quorum gating
    - router forward
    - router ack
    - `executed_dict` replay protection after successful ack
  - Added minimal `router.fc` support for `op::bridge_execute` and `op::bridge_ack`, plus optional `bridge_inbox_address` storage slot appended after the legacy router layout.
- Verification:
  - `node scripts/verify-func-ion.mjs` with `ION_FUNC_COMPILE_PASSES=1` -> PASS
  - `node scripts/verify-func-ion.mjs` with `ION_FUNC_COMPILE_PASSES=5` -> PASS
  - `node scripts/verify-contracts.mjs` -> PASS
    - backend minimum-output tests passed
    - FunC compile verification passed 100x per contract
    - deploy phase-2 readiness passed
    - fift dry-run skipped because `fift` binary is not installed in this environment
- Encoding spot-check:
  - `common.fc`, `gas.fc`, `BridgeInbox.fc`, `router.fc` are `BOM=False`, `NUL=False`
  - `BridgeInbox.fc` is LF-only
  - `common.fc`, `gas.fc`, `router.fc` currently still contain CRLF line endings
- Remaining risks:
  - No bridge runtime/integration tests yet for quorum, retry, bounce, duplicate approval, or ack loss.
  - `router.fc` bridge execution path is still a minimal settlement stub, not final token mint/release accounting.
  - `scripts/check-encoding.sh` is currently broken in this workspace because the script itself has CRLF issues; do not treat that specific script failure as a contract regression.

## 2026-06-14 Frontend true sitewide i18n locale switch

- Scope:
  - `frontend/src/components/layout/AppShell.tsx`
  - `frontend/src/components/dashboard/DashboardSwapPanel.tsx`
  - `frontend/src/components/wallet/SignSummaryDialog.tsx`
  - `frontend/src/wallet/signSummary.ts`
  - `frontend/src/pages/SwapPage.tsx`
  - `frontend/src/pages/PoolPage.tsx`
  - `frontend/src/pages/StakePage.tsx`
  - `frontend/src/pages/BridgePage.tsx`
  - `frontend/src/pages/TradeProPage.tsx`
  - `frontend/src/pages/BusinessPages.tsx`
- What changed:
  - repaired the broken `AppShell.tsx` wallet-panel copy and removed the corrupted Chinese strings from the provider help text.
  - ensured locale switching now propagates across the visible app shell:
    - sidebar / mobile-nav accessibility labels
    - wallet panel title, provider descriptions, connect status, balance lines, and provider warnings
    - footer and shared wallet signing summary labels
  - completed real route-level copy switching for active frontend pages and shared desk panels:
    - swap token rows, quote summary, CTA, and signature summary
    - pool / stake / bridge form labels, validation text, preview copy, and confirmation text
    - dashboard compact swap panel labels
    - trade-pro chart placeholder title
    - business-page embedded pool / stake / bridge / domain / AI form copy that is reachable from the current routed surfaces
  - preserved the existing global locale store and route wiring instead of adding a parallel i18n path.
- Verification:
  - `node scripts/dev-preflight.mjs` -> PASS
  - `cd frontend && npm run build` -> PASS
  - `cd frontend && npm run audit:high` -> PASS, `found 0 vulnerabilities`
  - `cd frontend && powershell -NoProfile -ExecutionPolicy Bypass -File ..\scripts\check-encoding.ps1 -Path .\src` -> PASS
  - `cd frontend && npm run verify` -> PASS
    - Playwright result: `35 passed`, `2 skipped`
    - includes: `settings.spec.ts › switches locale across navigation and trade page copy`
  - manual in-app browser walkthrough on local preview `http://127.0.0.1:4173/`:
    - `/#/settings` title after default load: `System settings` once locale set to `en-US`
    - `nav-trade`: `Trade`
    - `/#/trade` title: `ION spot order desk`
    - `trade-submit`: `Preview order (no chain submit)`
- Known residual issues:
  - some older non-routed draft/profile helper surfaces still contain English-only copy and were not needed for the current user-facing route chain.
  - Vite still warns about large chunks and the ineffective dynamic import around `ionExtension.ts`; this is unrelated to locale switching and was not changed here.
