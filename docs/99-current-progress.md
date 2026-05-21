# Current Progress

## Latest Verified Status

- **NeonGlassCard 第二阶段（2026-05-20）**：`PageHero` / Dashboard `dashboard-market-stage` 换用 `NeonGlassCard`；`useDashboardMarket`、`usePoolDeskData`、`poolDeskData.buildPoolRowsFromApi` 仅消费 gateway 数据；`useApiResource` 取消不稳定 effect 依赖并忽略 Strict Mode 清理 abort。验证：`cd frontend && npm run verify` → build OK、Playwright **16 passed**。`.memory-bank/live-data-reference.md` 补全 **Hard Data Rules**（security-preflight）。
- **P0 市场面（2026-05-22）**：后端 `market-surface`（`/api/markets/candles|depth|orderbook|swap-stats`）；前端 `IonCandleChart`（lightweight-charts）、`useMarketSurface` hooks、`DataProvenanceBadge`；Dashboard/Trade 移除硬编码 K 线/盘口/深度/TVL。验证：`verify-full` 绿灯（backend **15** tests、frontend **16** Playwright）。自检：`docs/ui-deliverable-self-audit-2026-05-22-p0.md`。下一步：P0 续 Burn/Bridge/AI API，P1 视觉统一。
- **UI 视觉自检铁律（2026-05-21）**：用户要求每次 UI 做完必须产出「对照设计图 + 总体框架」自检报告。已固化：`docs/11-ui-visual-self-audit-gate.md`、模板 `docs/templates/ui-visual-self-audit-TEMPLATE.md`；并写入 `docs/00-engineering-standards.md` §1.7、`docs/10-ui-design-route.md`、`AGENTS.md`、`.cursor/rules/ion-ui-design-workflow.mdc`、`ion-web3-ui` Skill。
- **UI 交付自检实例（2026-05-21）**：`docs/ui-deliverable-self-audit-2026-05-21.md`（思考过程 + 审计结论）；精简结论 `docs/ui-visual-self-audit-2026-05-21.md`。结论：**工程 verify 绿灯 ≠ 视觉门禁通过**。参考图：`docs/ui-audit-screenshots/ref-*.png`。
- **Dashboard / Trade 共享玻璃层（2026-05-20）**：`DashboardPage` 全面改用 `GlassPanel`（`flowBorder`）、`ChartFrame`、`MetricTile`；`TradeDeskPage` 与 Grid/Pool 等页对齐 `PageHero` + `ChartFrame` + `GlassPanel` 子模块。Playwright 默认 `channel: chrome`（云 Agent 免下载浏览器）。验证：`verify-full` 绿灯（frontend **16** Playwright、audit high 0）。
- **Minimum-output + liquid-glass business desks（2026-05-20）**：合约层 `IonSwapRouter.swapExactIn` 强制 `amountOutMinimum`（`IonDexMinOutput`）；链下 `backend/src/lib/minimum-output.ts` 与 quote API 对齐；`scripts/verify-contracts.mjs` 接入 `verify-full.sh`。UI：`frontend/src/components/ui/glass/*` 共享 primitive；`Grid`/`Pool`/`Bridge`/`Burn`/`Domain`/`AI`/`Stake` 升级为 `*DeskPage`（`PageHero` + `ChartFrame` + 种子数据 provenance）。Playwright **16 passed**（含 `grid pool bridge burn domain ai pages show liquid-glass desk modules`）。验证：`node scripts/agent-workflow.mjs --tier verify --execute` 绿灯（backend 14 tests、audit high 0）。
- **Agent automatic workflow（2026-05-20）**：新增 `scripts/agent-workflow.mjs` 作为 Cloud/本地 Agent 统一入口：开发前强制 `dev-preflight` + `security-preflight`，打印 `docs/10-ui-design-route.md` 11 步循环与 `SESSION_STATE` 下一步；`--tier verify --execute` 自动串联 `verify-full`。POSIX 等价入口 `scripts/agent-verify.sh`。验证：`node scripts/agent-workflow.mjs --tier verify --execute` 绿灯（backend 12 tests、stress OK、frontend 15 passed、audit high 0）。
- **TonConnect UI 内置 QR 模态（2026-05-20）**：依赖 `@ion-gateway/ui-react@2.1.1-beta.0`、`@ion-gateway/ui@2.1.1-beta.0`；根节点 `IonConnectUiProvider` 与 SDK 共享 `getIonConnect()`；`IonConnectModalBridge` 注册 `openIonConnectWalletModal()`；Profile Hub 点 WalletConnect 优先弹出应用内 QR 模态（暗色主题 token），保留 `startTonConnectRemoteSession` + 新标签 universalLink 回退。验证：`verify-full` 绿灯（backend 12、frontend 15 Playwright、audit high 0）。
- **TonConnect 远程桥 + 会话监听（2026-05-20）**：接入 `@ion-gateway/sdk`：`walletconnect` 探测为 TonConnect bridge 可用；连接时 `restoreConnection` / 远程 `universalLink`（默认 MyTonWallet 或 Tonkeeper）；Profile Hub 显示 `walletconnect-awaiting` 并自动打开钱包链接；`AppShell` 订阅 `onStatusChange` 与 EVM `accountsChanged`/`chainChanged`/`disconnect`、ION bridge `listen`。验证：`verify-full` 绿灯（backend 12、frontend 15 Playwright）。
- **官方 Online+ / ION Browser 注入对齐（2026-05-20）**：对照 `ice-blockchain/ion-chrome-wallet`、`ice-blockchain/ion-browser-wallet`、`ice-blockchain/ion-gateway` 校正探测与连接：Online+ → `window.ionmask.ionconnect`（`jsBridgeKey: ionmask`）；ION Browser → `window.tonwallet.tonconnect`（遗留字段，与 gateway `tonwallet` 一致）。移除臆造的 `window.ionWallet`/`iceWallet`/`ionBrowserWallet`。ION native 连接走 TonConnect `restoreConnection`/`connect` + `ton_addr`，manifest `frontend/public/ionconnect-manifest.json`；链 ID `-239`/`-3` 映射 ION Mainnet/Testnet。无扩展时 Online+ 仍可走 local-seed（E2E）。验证：backend **12** tests、frontend 15 Playwright、`verify-full` 绿灯。
- **真实钱包检测器（2026-05-20）**：Profile Hub 接入浏览器注入探测（`frontend/src/lib/wallet/`）：EVM 钱包需检测到扩展后才可 `eth_requestAccounts` 连接，并将真实 `address`/`chainId` 传给 `GET /api/profile/session`（`detectionSource: browser-injected`）。`realWalletAdapters: true`。
- **Profile Hub（2026-05-20）**：按 `.memory-bank/overall-design-framework.md` 将右上角入口升级为完整 Profile Hub（非仅钱包下拉）：新增 `GET /api/profile/session`（typed local seed，含 provenance）、扩展 `supportedWallets` 至 10 个（Online+ / ION Browser / WalletConnect + 7 个 EVM 检测器）。前端 `ProfileHub` 展示头像选择、NFT 来源、ION ID/KYC、`.ion` 记录、语言/主题/隐私模式、快捷入口（安全日志、授权、订单、网格、质押、跨链、通知、推荐）及连接后会话检测（网络/地址/身份）。Ticker 在隐私模式下隐藏价格。E2E 覆盖 hub 打开、钱包连接、会话检测与隐私切换。验证：`bash scripts/verify-full.sh`（backend 10 tests、frontend 15 passed、audit high 0）。
- **Quote / slippage / precision completion（2026-05-20）**：补全交易报价与滑点精度最小闭环并修复 `Minimum received` fee 口径：当前 typed backend quote API 以 bigint-floor 先扣 `protocolFeeBps=25`，再用净额计算 `minimumReceived`。前端 Swap 消费 backend quote API，显示 `bigint-floor / ION 9d`、25 bps fee、BNB/USD -> ION/USD route，并为 minimum/fee 行提供稳定 E2E test id。后端 API test 精确断言 1 BNB、1% slippage：`protocolFeeUnits=266694352`、`estimatedOutputUnits=106411046511`、`minimumReceivedUnits=105346936045`；后端 stress 覆盖 quote endpoint；前端 Playwright 断言 UI 显示 `0.266694 ION (25 bps)` 和 `105.346936 ION`。修复 E2E preview 子进程残留问题后，100-pass 门禁完成：`PASSED=100`，`FAILED=0`，`RESULT=GREEN`，摘要保存为 `/opt/cursor/artifacts/swap_quote_precision_verify_100_summary.txt`。浏览器手动验证录制 `/opt/cursor/artifacts/swap_quote_precision_walkthrough.mp4` 与 `/opt/cursor/artifacts/swap_min_received_fee_fix_walkthrough.mp4`。
- **Security audit and stress framework completion（2026-05-20）**：补全防御攻击和压测沙盒体系，新增 `.memory-bank/security-audit-and-stress-framework.md`、`docs/23-security-audit-and-stress-sandbox.md`、`scripts/security-preflight.mjs`。框架覆盖合约、后端/API/数据、前端/钱包/Profile、AI Sentinel 的攻击防御矩阵；列出 40 类测试方法；定义 backend load、frontend 10k-row render、contract gas/fuzz/invariant、bridge chaos 四类沙盒；明确代码审计 11 步流程和审计报告模板。`dev-preflight` 已强制读取 security framework。
- **Overall design framework memory consolidation（2026-05-20）**：按用户要求全量检索 `.memory-bank`、`docs`、`SESSION_STATE.md`、`.cursor/skills`、前端源码和 Git 历史，恢复/新增 `.memory-bank/live-data-reference.md`、`.memory-bank/implementation-playbook.md`、`.memory-bank/overall-design-framework.md`。`scripts/dev-preflight.mjs` 现在强制读取这些记忆文件；`AGENTS.md` 与 `ion-dex-memory` Skill 已加入“当前记忆不完整时必须搜索 Git 历史”的规则。整体框架明确：5D liquid-glass 视觉、无空数据/伪代码、钱包/Profile Hub、真实数据源、页面框架、验证铁律。
- **Data red-line correction（2026-05-20）**：用户明确纠正：空数据和伪代码是不可触碰红线，不能作为产品 UI 内容；加载/错误态只能是真实请求生命周期状态，不能掩盖缺失的数据对接。已写入 `.cursor/skills/ion-web3-ui/SKILL.md`、`.cursor/skills/ion-data-backend/SKILL.md`、`docs/10-ui-design-route.md`、`docs/05-product-prd.md`、`docs/09-reference-architecture.md`、`.memory-bank/architecture-audit.md` 和 `SESSION_STATE.md`。后续产品值必须来自 typed backend/data integration、source adapter、cache、indexer/upstream API 或有 provenance 的 reviewed local seed data。
- **UI reference-style correction（2026-05-20）**：用户明确纠正：目标不是普通 neon table UI，而是参考图级 4D liquid-glass 风格：银河/极光背景、厚 cyan/magenta/violet 霓虹光边、透明高光玻璃卡、柔性/异形圆角轮廓、3D 功能图标。已写入 `.cursor/skills/ion-web3-ui/SKILL.md`、`docs/10-ui-design-route.md`、`.memory-bank/architecture-audit.md` 和 `SESSION_STATE.md`。后续 UI 自检必须对照该视觉风格；扁平表格线、灰条控件、小字压缩、普通工程表单即使测试通过也判定为设计失败。
- **Trade desk UI continuation（2026-05-20）**：继续 UI correction route，将 `Trade` 从通用业务卡片升级为独立 OKX-style 专业交易台：顶部行情状态卡、3D K 线/深度视觉、`TWAP guard active`、右侧 Limit order、Order book、Market trades、Orders and risk。Playwright 新增 `trade page shows professional desk modules`，前端验证现在 **14 passed**。浏览器手动验证完成并录制 `/opt/cursor/artifacts/trade_desk_ui_walkthrough.mp4`；关键截图保存为 `/opt/cursor/artifacts/trade_desk_final.webp` 和 `/opt/cursor/artifacts/trade_order_review.webp`。100-pass 门禁完成：`PASSED=100`，`FAILED=0`，`RESULT=GREEN`，摘要保存为 `/opt/cursor/artifacts/trade_desk_verify_100_summary.txt`。
- **swap.ion UI conformance（2026-05-20）**：按用户要求重做首页视觉合规层：`AuroraGalaxyBackground` 改为 Canvas 240 粒子场 + #03050f 暗底；`DashboardPage` 改为 `swap.ion` ION Chain native DEX surface，包含玻璃拟态卡、流光霓虹边框、三层市场深度、3D 浮动交易图和受控 Swap 报价；清理 `frontend/src` 可见 `mock/placeholder/shell/draft/TBD/Build Checklist` 文案，`ION_UI_STRICT=1 node scripts/dev-preflight.mjs` 通过。浏览器手动验证完成并录制 `/opt/cursor/artifacts/swap_ion_ui_conformance_walkthrough.mp4`；关键截图保存为 `/opt/cursor/artifacts/swap_ion_ui_conformance_final.webp` 和 `/opt/cursor/artifacts/swap_ion_ui_quote_interaction.webp`。`.memory-bank/architecture-audit.md` 已补充 UI 合规审计记忆。
- **UI workflow lock（2026-05-20）**：新增 `docs/10-ui-design-route.md`，把用户要求的 OKX Web3 / cyberpunk neon / glassmorphism / aurora-galaxy / no unfinished panels UI 路线固化为开发门禁；新增 `scripts/dev-preflight.mjs`，自动读取 `docs/00-engineering-standards.md`、`ion-web3-ui` Skill、PRD、页面流程、UI 路线、`AGENTS.md`、`SESSION_STATE.md`，并检查 UTF-8 no BOM / NUL。`scripts/verify-full.cmd`、`scripts/verify-full.ps1`、`scripts/verify-full.sh` 已在编码检查前自动运行 preflight；`scripts\agent-verify.cmd` 和 `scripts\verify-full-save-log.cmd --no-pause` 因调用 full verify 自动继承该步骤。当前 unfinished UI copy 先作为 `UI_DEBT_WARNINGS` 输出；设置 `ION_UI_STRICT=1` 可升级为失败。
- **Contracts batch（2026-05-21）**：新增 ION FunC 池/路由/部署器/MEV 防御/手续费分配/跨链收件箱/DNS 三件套/质押池；BSC 侧 `BSCVault`、`FeeReceiver`、`BridgeRelay` 与测试用 `MockERC20`；`node scripts/verify-contracts.mjs` 通过。待办：安装 Foundry 后 `forge test -C contracts`。

- **Phase 2 Task 1 — 合约静态审计（2026-05-18）**：已通读 `contracts/ion/**/*.fc`（22 文件）、`contracts/bsc` 下 `IonWrapper.sol` / `BSCVault.sol` 与 Foundry 测试。结论：FunC 侧存在未校验 LP 回调发送方、router 部署池静态数据与 deployer 不一致、`#include` 路径错误、`gas::pool::swap` 缺失、stableswap 未接入 swap 等 **Critical/High** 级草稿问题；`BSCVault` 存在 `withdrawalId` 不含 nonce 导致的重复 `requestWithdrawal`/日限额会计风险等 **Medium** 级问题。详见 `SESSION_STATE.md`「Current Task → Task 1」。**本轮未改合约代码**；下一步 Task 2 编译与修复。

- **Phase 3 adapter/cache + frontend read slice（2026-05-18）**：后端新增 `MemoryCache`（TTL/stale）、`CachedSourceAdapter` registry（market/burn/staking/domain）、`gateway-data` 层；`meta` 扩展 `cacheHit`/`adapter`；`/api/health` 含 `dataSources` 健康快照。后端 **19 tests** + stress 9 endpoints 全绿。前端 Stake/Burn 指标卡接入 `/api/staking/summary`、`/api/burn/summary`，保留 offline fallback，E2E 断言 `stake-metrics-source` / `burn-metrics-source`。`scripts\verify-full.cmd`（`ION_VERIFY_NONINTERACTIVE=1`）exit `0`。100-pass gate 已重新启动（前次因开发中前端中断于 PASS 2）。

- **Phase 3 backend gateway second slice（2026-05-18）**：扩展 `backend/` public mock API，从 health/config/tokens/tickers 扩展到 `GET /api/burn/summary`、`GET /api/staking/summary`、`GET /api/bridge/routes`、`GET /api/domain/resolve?name=`、`GET /api/profile/demo`。新增 `.ion` 域名输入校验、稳定错误码枚举（`ION_DEX_E_*`）、OPTIONS `X-Request-Id` tracing、金融/链上 mock payload provenance，避免 mock 价格、APR、burn、token 地址被误认为真实数据。后端 API 测试扩展到 12 passed；stress smoke 覆盖 9 个 public endpoint，每 endpoint 默认 120 requests / 24 concurrency，并校验响应契约和 provenance。只读代码审查发现的 mock 误导风险、错误码、OPTIONS tracing 与 stress 边界说明已修复或记录为后续生产压测风险。验证证据：直接 `scripts\verify-full.cmd` exit `0`，编码扫描 191 files OK，backend verify 12 passed，backend audit 0，backend stress 9 endpoints 全绿，frontend build + Playwright 13 passed，frontend audit 0。扩展 100-pass gate 完成 `PASS 100/100`、`RESULT=GREEN`、exit `0`（耗时 3,899,653 ms）。剩余风险：当前 stress 仍是 CI smoke，不等同 k6/wrk 生产压测；CORS 对 public mock 开放，真实 profile/wallet/KYC 接入前必须引入 origin allowlist 和 auth 边界。
- **Phase 3 backend gateway first slice（2026-05-18）**：新增 `backend/` TypeScript mock API gateway，首批 endpoint 为 `GET /api/health`、`GET /api/config/public`、`GET /api/tokens`、`GET /api/markets/tickers`，统一返回 `{ data, meta }`（`source`、`updatedAt`、`stale`、`requestId`）。新增后端 API 测试（6 passed）、typecheck/build、`audit:high` transient retry wrapper、local stress smoke（80 requests/endpoint，health/config p95 < 200ms，tokens p95 < 250ms，tickers p95 < 300ms）。前端 ticker strip 已接 `/api/markets/tickers` 并保留 offline fallback；前端 verify 改为动态 preview port，修复 100-pass 固定端口抖动。`verify-full.cmd`、`verify-full.ps1`、`verify-100.ps1`、GitHub Actions 与验证文档已同步 backend verify/audit/stress + frontend verify/audit。独立只读审查发现的门禁旁路已修复。最终验证：直接 `scripts\verify-full.cmd` exit `0`；扩展 100-pass gate 完成 `PASS 100/100`、`RESULT=GREEN`、exit `0`（耗时 4,001,376 ms）。
- **Merge `origin/main`（2026-05-22）**：合并侧栏壳层、钱包 Provider、gateway 适配器层与合约批次；保留本分支 `market-surface` + `IonCandleChart` + `/api/profile/session`。合并后待跑 `verify-full`。
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
  - Establishes the immediate Phase 3 recommendation: a minimal typed backend API gateway/BFF with health, config, token list, ticker, burn, staking, bridge, domain, and profile local endpoints.
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
3. Next milestone: wire Burn/Stake/Bridge/Domain frontend read paths to adapter-backed APIs with loading/stale/source labels; add upstream timeout/retry contracts and optional Redis cache; then PostgreSQL schema scaffolding.
4. Official ION reference: `D:/openclaw-tools/ion`.
5. After meaningful diffs, run Cursor Agent Review (`/agent-review`) and then the verification baseline.
