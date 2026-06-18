# Current Session State

## 🤖 全自动工单 W 系列 — 2026-05-25（当前执行队列）

**主文档**：[`docs/cursor-autonomous-work-order-2026-05-25.md`](docs/cursor-autonomous-work-order-2026-05-25.md)  
**门禁脚本**：`node scripts/autonomous-phase-gate.mjs --gate verify-full|verify-100|stress-e2e|...`  
**模式**：零人工确认 · 每阶段出口 **`verify-100` → PASSED=100 FAILED=0 RESULT=GREEN** · 失败自动读 `%TEMP%` 日志修复后重跑

| 阶段 | 目标 | 状态 |
|------|------|------|
| **W0** | 文档/记忆库同步 + 基线 verify-full | ✅ |
| **W1** | 六引擎真实数据层 | ✅ |
| **W2** | 7 wallets + chain switch + sign summary | OK |
| **W3** | UI Pixel Correction（仅 CSS） | ✅ |
| **W4** | 链上接线（Copy/Batch/Domain） | ✅ verify-full · stress×3 · verify-100 GREEN（2026-05-27 续跑完成） |
| **W5** | Indexer 骨架 + burn/staking 读路径 | ✅ 已 push `a80534dd` · verify-100 GREEN（2026-05-28） |
| **W6** | Sandwich + Bridge 双重签功能测 | ✅ 安全矩阵 1000 checks + 后端回归通过（2026-06-19） |
| **W7** | CI/CD + 测试网脚本（无密钥则 W7-SKIP） | ⏳ |
| **W8** | 全仓收口 verify-100 | ⏳ |

**CURRENT_PHASE=W7**（W6 出口：`%TEMP%\ion-w6-security-1000-current.log` · SecurityMatrix 10 tests passed / 1000 checks；`backend/dist/tests/security-w6-sandwich-bridge.test.js` 11/11；`backend/dist/tests/bridge-e2e.test.js` 3/3）

**Backend dependency audit hotfix（2026-06-19）**：
- 修复：`backend/package.json` / `backend/package-lock.json` 将直接依赖 `undici` 从 `^8.3.0` 提升并锁定到安全路径 `^8.5.0` / `8.5.0`。
- 验证：`npm install --package-lock-only` ✅；`npm audit --audit-level=high` ✅ `found 0 vulnerabilities`；`npm run build` ✅；`npm run test` ✅ backend **101/101**；`node scripts/security-preflight.mjs` ✅；`node scripts/dev-preflight.mjs` ✅（仅既有 UI debt warnings，未触碰）；编码扫描 ✅ **39686** files。
- Aikido：MCP `aikido_full_scan` 已重试扫描本轮修改文件，返回需要用户登录 Aikido；如需完成该额外扫描，先运行 Aikido 登录流。
- 注意：工作区存在大量既有改动；本轮仅触碰 backend 两个依赖文件与进度状态文档。

**P1 Dashboard quote 收口流水线（2026-05-29）**：
- 队列：`p1-dashboard-w6-pipeline`（active）· 旧 `ui-design-phase-b` → **paused**
- 步骤：`dashboard-p1-quote-ui` ✅ → `verify-full` → `verify-100`（新 activatedAt）→ W6 Agent
- 看门狗：`scripts/run-autonomous-work-watchdog.cmd` / `node scripts/autonomous-work-watchdog.mjs --once`
- **未授权 commit**：`git-commit-push` 仍 blocked（需用户明确说 commit）

**进度汇报节奏（Master 2026-05-28）**：verify-100 未 GREEN 前 **每 30 分钟**汇报（`node scripts/verify-100-progress-snapshot.mjs` + 看门狗队列）；全绿后汇报 GREEN + commit+push + 下一阶段。

**GitHub 每日高星发现（2026-05-27）**：
- 脚本：`scripts/github-daily-discovery.mjs` + `github-daily-install.mjs` + `github-daily-queries.json`（20 品类：AI/Web3/合约/全栈/UI/视频/音频/3D/量化/MCP 等）
- Skill 路由：`.cursor/skill-routing.manifest.json` 已增 `kw-github-daily`、`kw-video-ai`→HyperFrames、`kw-audio-media`、`kw-3d-webgl` 等
- **机密落点**：`ion-private-core`（https://github.com/s2530786-cell/ion-private-core）— `.memory-bank/github-daily/`、`github-discovered` Skills；公开仓仅脚本 + 指针 Skill
- **计划任务**：`ION-GitHub-Daily-Discovery` 每日 08:00 → `scripts\github-daily.cmd`
- **Token**：`scripts/.github-token.local`（从 `github-daily-token.local.example` 复制）
- **已克隆**（`d:\vendor-ion-discovery`）：OpenZeppelin、mem0、tonutils-go、langchain、composio
- **Skill 存根**（仅 private-core）：`.cursor/skills/github-discovered/github-discovered-*`（5 个，已迁出公开仓）

**AI 文明内核公私拆分（2026-05-29）**：
- **机密全量**：`ion-private-core/.memory-bank/ai-civilization-kernel/`（战略正文与 allowlist，不推公开 remote）
- **公开范围概要**：`docs/28-public-development-scope.md`（对外路线图，点到为止）
- **公开指针**：`.memory-bank/ai-civilization-kernel/README.md` · 契约 `docs/ai-sentinel-gateway-contract.md` · Skill 存根 `.cursor/skills/ion-ai-civilization-kernel/`
- **Phase 1 stub**：`backend/src/ai/sentinel/` + `backend/src/ai/gateway/routes.ts`（`GET /v1/ai/health|capabilities`；Phase C `POST` design/video brief stub；禁止 `/v1/ai/tx/*`）
- **泄漏门禁**：`scripts/check-public-ip-leak.mjs`（verify-full 步骤 1b）
- **路径解析**：`scripts/ion-private-core-path.mjs` → `aiCivilizationKernelDir()`
- **验证（2026-05-29）**：`verify-full` ✅（backend 89/89 · frontend 33 passed · encoding · leak gate · audit:high）
- **Phase C（Creator OS + Gateway stub，2026-05-29）**：
  - `POST /v1/ai/design/prototype` · `POST /v1/ai/content/video/brief`（mock stub，经 Sentinel + 私有 allowlist）
  - `backend/src/ai/registry/` 读私有 `capability-registry.json` · `draft-routes.ts` + `ai-gateway-draft.test.ts`
  - I1：`execute_swap` 等下划线工具名经 normalize 后硬拒
  - **验证**：`npm run build && npm run test` 89/89 ✅ · `verify-full-save-log.cmd --no-pause` ✅
- **附带修复**：`frontend/src/hooks/useSwapTradeQuote.ts`（Dashboard swap 报价 hook，解除 frontend build 阻塞）

**W5 进行中（2026-05-27）**：
- `backend/src/indexer/`：ION/BSC worker 骨架、`IndexerReadCache`、burn/staking enrich
- `reconcile-burn.ts` + `backend/tests/reconcile-burn.test.ts`
- `burn.ts` / `staking.ts` / `bridge.ts` / live loaders：provenance 叠加 indexer-cache 元数据
- 后端 **50/50** tests 绿（含 indexer + reconcile）

**W4 进行中（2026-05-27）**：
- **CopyTrade**：`startCopyTrade` 非 test-mock 时 BSC `eth_getCode` 只读校验 leader 须为 EOA；`provenance` → `bsc-readonly`
- **BatchTransfer**：补齐 `/stats` `/history` `/send` `/collect`；`send` 返回 `txHash: null` + `pending_signature`；`BATCH_TRANSFER_CONTRACT_ADDRESS` env
- **Domain**：`ion-dns-adapter.ts` + `resolveDomainWithAdapter`；lookup/register 走 indexer 探针，无假 resolver 默认注入
- **E2E 稳定**：`verify-e2e.mjs` + `stress-playwright-100.mjs` 启动 backend 时设 `ION_DATA_MODE=test-mock`（修复 domain-manage 注册后 owned 行不可见）
- **前端 verify**：**32/32** Playwright 绿（2026-05-27）；`bootVideoCarousel.ts` Navigator.connection 类型修复
- **出口（2026-05-27）**：`verify-full` ✅ · `stress-e2e` copy-trade/batch-transfer/domain-manage 各 100 ✅ · `verify-100` GREEN（续跑 pass 11→100；摘要 `%TEMP%\ion-verify-100-summary-20260527-234453.txt`）
- **编码门禁**：`check-encoding.ps1` 改为递归跳过排除目录（4247 文件 ~12s，不再卡死）

**W1 完成摘要（2026-05-25）**：
- 后端 `/api/price/ion`、`/api/klines/ion` + 前端 Dashboard/Trade K 线已接线；`ION_DATA_MODE=auto` live 冒烟 ✅
- E2E：`verify-e2e.mjs` workers=1 + retries=1；`smoke.spec.ts` shell 重试
- **verify-100 GREEN** (ion-verify-100-summary-20260527-011731.txt): PASSED=100 FAILED=0 RESULT=GREEN
- **100 轮门禁**：`scripts/verify-100.ps1` 全绿（日志 `%TEMP%\ion-verify-100-20260525-183924.log`）→ W1 ✅ commit + push

**W2 完成摘要（2026-05-26）**：
- 目标：7 钱包 + 链切换 + 签名摘要（`frontend/e2e/wallet-connect.spec.ts`）
- **钱包 stress 100/100 ✅**：`e2e/wallet-connect.spec.ts` 100/100 green，日志 `%TEMP%\ion-wallet-stress-100-20260526-064048.log`
- **verify-100 GREEN** (ion-verify-100-summary-20260527-011731.txt): PASSED=100 FAILED=0 RESULT=GREEN
- **前台可见（后续阶段默认）**：`scripts\verify-100-until-green-foreground.cmd` / `scripts\verify-100-follow-progress.cmd`（优先显示已 GREEN 的摘要，避免被重跑中的 0/100 误导）

**UI 铁律 + 设计图模板入库（2026-05-26）**：
- 铁律：`.memory-bank/ui-cyber-glass-iron-law.md` · 规则 `.cursor/rules/ion-cyber-glass-iron-law.mdc` · Prompt `docs/cursor-prompt-ion-ui-1to1.md`
- **设计图模板**：`.memory-bank/ui-design-master-template.md` · 资产 `.memory-bank/design-refs/`（7 屏 PNG + Logo + 2 开机动画母片）
- Dashboard 主验收图：`design-refs/screens/04-dashboard-galaxy-spiral.png`
- Logo：`design-refs/brand/ion-dex-brand-logo.png` → `frontend/public/brand/ion-dex-logo-master.png`
- 开机动画母片：`boot-master-square-landscape.mp4` / `boot-master-portrait.mp4`（`scripts/process-boot-videos.ps1` 可重编码到 `frontend/public/boot/`）
- **新功能 UI**：必须延续模板全局一致（铁律 §0 + 设计模板 §0）；禁止另起一套视觉风格

**UI 设计阶段 Batch B（2026-05-28，自动流水线）**：
- 代码：Dashboard 去 `Modules` 副标题；`FeatureGrid` → `gap-4` + `items-stretch` + `auto-rows-fr`
- 签收：`docs/ui-gap-analysis-batch-b-2026-05-26.md` · 截图 `docs/screenshots/ui-signoff/batch-b/`
- 流水线：`scripts/run-ui-design-phase-batch.cmd --batch B --commit-push --auto-next`
- 门禁：`verify-full` ✅（33/33 E2E，含 `dashboard-visual-signoff`）
- 进行中：终端 `verify-100.ps1`（勿并行第二路）→ **PASSED=100 GREEN 后看门狗自动 `git commit` + `git push`**
- **全自动下一阶段**：`git-commit-push-b` 完成 → `ui-design-phase-pipeline --batch C --commit-push --auto-next`（含 D）
- **自动续跑**：`scripts/run-autonomous-work-watchdog.cmd` · 队列 `activatedAt=2026-05-28T07:40:00Z` · `scripts/autonomous-git-commit-push.mjs --batch B`
- stress×100 排在 commit 与 Batch C 之后，不阻塞进入 C

**W3 完成摘要（2026-05-27）**：
- `.glass-surface` 玻璃/噪点/截光（`frontend/src/styles/global.css`）；E2E 稳定：`VITE_E2E_STABLE=1`、`domClick`/`fillControlledInput`、`verify-e2e` 专用 backend **:8788**
- **verify-full** ✅（编码 · 合约 · backend verify+audit+stress · **34/34** Playwright · frontend audit:high 0）
- **verify-100 GREEN** ✅ `%TEMP%\ion-verify-100-summary-20260527-140839.txt` · `PASSED=100` `FAILED=0` `RESULT=GREEN` · 日志 `%TEMP%\ion-verify-100-20260527-140839.log`（2026-05-27 17:10）
- `scripts/verify-100.ps1` 支持 `-StartAt` / `-InitialPassed` / `-ResumeSummary` / `-ResumeLog` 续跑

---

## 🎯 旺财派工单 Phase 1 — 2026-05-24（已完成）

**主文档**：[`docs/cursor-dispatch-work-order-2026-05-24.md`](docs/cursor-dispatch-work-order-2026-05-24.md)  
**Branch**：`security-test-fix` · **CI**：31/31 E2E ✅ · Forge ✅ · Stress 120/120 ✅

| Task | 状态 | 100 轮门禁 |
|------|------|------------|
| **P1A CopyTrade** | ✅ 已完成 | E2E `copy-trade.spec.ts` **100/100** · verify-full 绿 |
| **P1B LiquidityMine** | ✅ 已完成 | Forge LiquidityMine **100/100** · verify-full **20/20** E2E 绿 |
| **P2A DomainManage** | ✅ 已完成 | verify-full **24/24** E2E 绿 · backend domain-manage 4 tests |
| **P2B SettingPage** | ✅ 已完成 | verify-full **26/26** E2E 绿 · settings.spec 2 tests |
| **AI 订阅 #/ai** | ✅ 已完成 | `AiSubscriptionPage` · `ai-subscription.spec.ts` 2 · Python pytest **19/19** |
| P3A BatchTransfer | ✅ 已完成 | E2E `batch-transfer.spec.ts` **100/100** · verify-full **31/31** 绿 · backend batch-transfer 4 tests |

**硬规则**：费用仅 ION · 无 fake 链上数据 · 新模块 **100/100 绿才 commit**（红一次从 0 重计）。

**P0 已完成**：P0-1c 桥 E2E ✅ · P0-2b ION 费 ✅ · P0-3 安全矩阵 1000 ✅ · `verify-full` 绿 ✅

**派工单 Phase 1 全部完成**（P1A–P3A）。AI 订阅 Docker 联调 ✅（2026-05-25：`postgres` healthy · `api` :8000 · `/health` + `/api/ai/price`）。

---

## FunC `router.fc` 编译修复 — 2026-05-24 ✅

- **根因（多轮）**：
  1. 早期版本：非法 `int const op::...` 语法、与 `common.fc` 冲突 opcode、`udict_get?` 解构错误、`my_balance()` 未定义。
  2. 重写版本：`if (op == A || op == B)` — FunC 不支持 `||`；`udict_get?` 使用 `(_, int)` 解构错误。
  3. `FeeDistributor.fc` 曾被误替换为 router 辅助片段 → 已从 HEAD 恢复完整合约。
- **修复**：
  - `router.fc`：TEP-74 分支拆成两个 `if`；`udict_get?` 改为 `(slice _pool_entry, int is_pool)`。
  - `FeeDistributor.fc`：`git checkout HEAD --` 恢复标准 fee 分发合约。
  - `common.fc` / `gas.fc`：TEP-74、meta-tx opcode 与 gas 常量（前一轮已迁入）。
- **验证**：`verify-func-ion.mjs` **13/13 × 100 PASS · RESULT=GREEN**。
- **全量 verify-full**（2026-05-24，`security-test-fix` + cherry-pick `6affce54` pool E2E）：`verify-full-save-log.cmd --no-pause` **exit 0** — 编码 ✅ · FunC **RESULT=GREEN** · backend **43/43** · Playwright **31/31** · audit:high **0**（`%TEMP%\ion-verify-full.txt`，~3.3min）。

---

## P3A BatchTransfer — 2026-05-24 ✅

- **后端**：`batchTransfer.ts` + `batchTransfer.routes.ts`（stats / history / send / collect）；`MAX_RECIPIENTS=100`；`txHash: null` + `pending_signature`（不伪造链上哈希）；启动 warn `BatchTransfer.sol not wired`。
- **前端**：`BatchTransferPage.tsx`（Transfer/Collect 双 Tab、CSV 解析、收款人表、Token 选择、确认弹窗、历史）；`batchTransferCsv.ts`；`ionApi` BatchTransfer API；路由/导航 `batch-transfer`。
- **E2E**：`batch-transfer.spec.ts`（5 tests）；smoke 导航断言对齐 `batch-transfer-tabs` / `batch-transfer-csv-input`。
- **修复**：`AppShell.tsx` 重复 `batch-transfer` PageKey/nav 项删除。
- **验证**：`verify-full-save-log.cmd --no-pause` exit **0**（Playwright **31/31**；backend **42** tests）。
- **UI 自审**：[`docs/ui-deliverable-self-audit-2026-05-24.md`](docs/ui-deliverable-self-audit-2026-05-24.md) P3A 节。

---

## AI 订阅模块（阶段 2 前端接入）— 2026-05-24 ✅

- **前端**：`#/ai` → `AiSubscriptionPage`（四档订阅、周期切换、钱包 + API）；`ionApi.ts` / `integrationConfig.ts` AI 订阅端点。
- **E2E**：`ai-subscription.spec.ts`（2 tests）。
- **Python 模块**：`ai-subscription-module/` · `pytest tests/test_subscription_full.py` **19/19**。
- **Docker 联调** ✅（2026-05-25）：`docker compose -f ai-subscription-module/docker/docker-compose.dev.yml up -d --build` — `postgres:16-alpine` healthy（`:55432`）；`api` `:8000` — `GET /health` → `{"status":"ok"}`；`GET /api/ai/price?tier=Basic&period=monthly` → mock USD/ION 报价。修复：`docker-entrypoint.sh` CRLF 导致容器 `exec … no such file or directory`（已改为 LF + Dockerfile `sed` 去 `\r`）。

---

## P2B SettingPage — 2026-05-24 ✅

- **前端**：`appSettings.ts`（localStorage 偏好 + 清缓存前缀）；`SettingPage.tsx`（深色模式 / 滑点 / 通知 / 清缓存）；`App.tsx` + `AppShell` + `pageRouting` 注册 `settings`；`main.tsx` 启动应用设置；`SwapPage` 读取默认滑点。
- **E2E**：`settings.spec.ts`（2 tests）；smoke 导航含 settings 断言。
- **验证**：`verify-full-save-log.cmd --no-pause` exit **0**（Playwright **26/26**；backend **39** tests）。
- **UI 自审**：[`docs/ui-deliverable-self-audit-2026-05-24.md`](docs/ui-deliverable-self-audit-2026-05-24.md) P2B 节。

---

## P2A DomainManage — 2026-05-24 ✅

- **后端**：`domainManage.ts` + `domainManage.routes.ts`（overview / lookup / register / bind / transfer / renew）；gateway 路由已挂。
- **前端**：`DomainManagePage.tsx`（查询注册 + 已拥有列表 + 绑定/转移/续费）；`App.tsx` 独立 `domain` 路由。
- **E2E**：`domain-manage.spec.ts`（2 tests）；smoke domain/ai 断言已对齐新页面。
- **验证**：`verify-full-save-log.cmd --no-pause` exit **0**（Playwright **24/24**；backend **39** tests）。
- **UI 自审**：[`docs/ui-deliverable-self-audit-2026-05-24.md`](docs/ui-deliverable-self-audit-2026-05-24.md) P2A 节。

---

## 🎯 TASK QUEUE 执行进度 — 2026-05-23（历史）

| # | Task | 状态 | 证据 |
|---|------|------|------|
| 1 | FunC 编译 + Forge build | ✅ | `compile-func.mjs` 13/13；`forge build` exit 0 |
| 2 | 100 轮压力 + Gas | ✅ | stress tests 4/4；`verify-func-ion` GREEN；`gas-snapshot.txt` |
| 3 | 合约地址 + 链上对接 | ✅ | 集中 `config/contracts.ts`；USDT 官方地址；前端 build 绿 |
| 4 | ION-only 手续费 | ✅ | FeeReceiver + Swap ION 费展示 + `fees.currency=ION` |
| 5 | UI 打磨 + 响应式 | ⚠️ 部分 | AsyncState 已有；Swap 响应式边距；E2E 7 项仍失败 |
| 6 | 测试网部署 + E2E | ⚠️ 部分 | `Deploy.s.sol` 就绪；需测试网密钥才能广播 |

**verify-full**：编码 ✅ · 后端 ✅ · 前端 build ✅ · Playwright 9/16

---

### 🚀 EXECUTE ALL 6 TASKS IN ORDER. DO NOT SKIP, DO NOT STOP.

**主文件：`CURSOR-TASK-QUEUE.md`** (~28KB) — 包含全部 6 条超长指令的合并版，一次读完。

**备用（每份独立）：`cursor-queue-result/`** — 6 个编号文件，适合按步执行。

| # | Priority | Task | 验收门槛 |
|---|----------|------|----------|
| 1 | 🟥 P0 | FunC 全量编译修复 + Forge build 通过 | 14/14 .fc 编译 + forge build exit 0 |
| 2 | 🟥 P0 | 100 轮压力测试 + Gas 基线 | 100/100 PASS, 0 FAILED |
| 3 | 🟧 P1 | 真实合约地址替换 + 前端链上对接 | 全部占位地址替换, tsc exit 0 |
| 4 | 🟧 P1 | 统一 ION 手续费收费逻辑 | 所有费用只收 ION |
| 5 | 🟨 P2 | UI 打磨 + 响应式适配 | 375px~1440px all pages |
| 6 | 🟩 P3 | 测试网部署 + E2E 验证 | ION 测试网 + BSC 测试网部署通过 |

### 🛑 硬规则
- 先读 `CURSOR-TASK-QUEUE.md` 全文再动手
- 每个 TASK 完成后必须 git commit + push
- 验收集不过时 **不进入下一步**
- 同一问题修三次不过 → 搜全网换思路
- 代码 UTF-8 无 BOM，写后立刻读回验证
- **24 小时不停机**，修通为止
| 2 | 🟥 P0 | 100-round stress test + gas baseline | `cursor-queue-result/002-stress-test-100-rounds.md` |
| 3 | 🟧 P1 | Real contract addresses + frontend on-chain | `cursor-queue-result/003-real-contracts-and-data.md` |
| 4 | 🟧 P1 | ION-only fee enforcement (Master 2026-05-24) | `cursor-queue-result/004-ion-only-fees.md` |
| 5 | 🟨 P2 | UI polish + responsive design | `cursor-queue-result/005-ui-polish-responsive.md` |
| 6 | 🟩 P3 | Testnet deploy + E2E flow | `cursor-queue-result/006-testnet-deploy-e2e.md` |

**After completing each task:** git commit with clear message, then proceed to next file.
**Failed verification:** fix before moving forward. Zero tolerance.

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
> 缺工具自己找。GitHub 是第一搜索源。找到合适的开源库 → 下载 → 安装依赖 → 集成到项目 → 验证能跑通。最少 10k以上 ⭐ 才考虑。装全跑通才算完，不下完就跑不算数。

**⑧ 安装任何 Skill 前必须先安全检查**
> 使用 `.cursor/skills/skill-vetter/SKILL.md` 审计每个新 Skill。检查权限范围、危险模式、外部请求。有红标（red flag）的一律不装，报 Master 决策。

**⑨ 充分利用 Cursor 已安装的能力**
> 开发加速器（worktree、Agent Review、Bugbot、Cloud Agents、Hooks、CI automation）、MCP 工具（Desktop Commander、Memory Bank）、Rules、Skills——全部要用起来。不等用户提醒，自动选最优路径。
- The agent must proactively use Cursor engineering workflow and development accelerator guidance for every development task. The user should not need to ask for worktrees, Agent Review, Bugbot, Hooks, MCP, Cloud Agents, CLI automation, Rules, Skills, or verification strategy.
- The agent must use `cursor-engineering-workflow` as the automatic development workflow and `self-evolving` as the post-work learning loop so useful lessons improve project memory, docs, rules, or Skills.
- The agent must evaluate parallel development worktrees, `/best-of-n`, Agent Review, Bugbot, and code audit paths for non-trivial work; high-risk surfaces require review/audit before being accepted.

## Current State

- **Contracts batch（2026-05-21）**：补全 10 个 FunC（`contracts/ion/`：`pool`, `router`, `deployer`, `sandwich`, `FeeDistributor`, `BridgeInbox`, `dns-resolver`, `dns-registrar`, `dns-auction`, `staking-pool`）+ 扩展 `common.fc`/`gas.fc`；4 个 Solidity（`contracts/bsc/`：`BSCVault`, `MockERC20`, `FeeReceiver`, `BridgeRelay`）+ `contracts/test/BSCContracts.t.sol`；`scripts/verify-contracts.mjs` 已更新；`node scripts/verify-contracts.mjs` exit `0`（本机无 `forge`，Solidity 编译测试 SKIP）。`verify-full` 仍因既有 backend TypeScript 错误失败（非本批合约引入）。路径对照见 `contracts/README.md`。
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
