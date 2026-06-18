# ION DEX — 全自动派工单（记忆库缺口闭环）

**Project**: `D:\openclaw-tools\ion-dex-nuke`  
**Branch**: `security-test-fix`（执行期保持；合并策略由 Master 定）  
**基线**（2026-05-25）：派工单 P1A–P3A + AI 订阅 ✅ · `verify-full` 绿 · 模块级 stress 100/100 已有多项证据  
**前置派工单**：[`cursor-dispatch-work-order-2026-05-24.md`](cursor-dispatch-work-order-2026-05-24.md)（Phase 1 已完成，勿重复）

**Agent 入口（TASK 0）**：`docs/00-engineering-standards.md` → 根目录 `SESSION_STATE.md` → **本文档** → `.memory-bank/architecture-audit.md` + `.memory-bank/live-data-reference.md` + `.memory-bank/wallet-connect-requirements.md`

---

## 执行模式：全自动（零人工确认）

| 规则 | 要求 |
|------|------|
| 人工确认 | **禁止** 每步「继续吗」；禁止等待 Review/Keep All（自动接受自有 diff） |
| 阻塞时暂停 | 仅当：缺密钥（主网/测试网私钥、CMC API、Pinata）、需求歧义、不可逆删除 |
| 修复循环 | 实现 → 快验 → 失败则读日志 → 根因修复 → 重验，**直到本阶段出口门禁 100 绿** |
| 提交 | 每阶段 **出口 100 绿后** 才能 `git commit`；必须经过 `scripts/verify-100-gate.mjs` proof + `.githooks` 守门 |
| 进度 | 每阶段结束更新 `SESSION_STATE.md`、`docs/99-current-progress.md`、`.memory-bank/SESSION_STATE.md` |

### 新的硬门禁

```text
verify-full 通过
  -> stress / 功能子门禁通过
  -> verify-100 = PASSED=100 FAILED=0 RESULT=GREEN
  -> verify-100-gate 记录 fresh proof
  -> pre-commit 验 proof 仍匹配当前 HEAD + working tree
  -> post-commit 记账
  -> pre-push 验每个待推 commit 都有 proof trailer + ledger
  -> 才允许 push
```

### 门禁双层模型

```text
[开发快验] 每批有意义改动后
  scripts\verify-full-save-log.cmd --no-pause
  或 set ION_VERIFY_NONINTERACTIVE=1 && scripts\verify-full.cmd
  stdout 空 → 读 %TEMP%\ion-verify-full.txt

[阶段出口] 本阶段全部文件改完 + 快验连续 1 次绿后
  ① 触达面模块 stress 100/100（见下表）
  ② 全仓 verify-100：powershell -File scripts\verify-100.ps1
  必须：PASSED=100 FAILED=0 RESULT=GREEN exit 0
  模块 stress 红一次 → 从 0 重计 100 轮
```

### 编排命令（Agent 每轮调用）

```cmd
cd /d D:\openclaw-tools\ion-dex-nuke
set ION_VERIFY_NONINTERACTIVE=1
set ION_AGENT_AUTONOMOUS=1

REM 快验（开发循环）
node scripts\autonomous-phase-gate.mjs --gate verify-full

REM 阶段出口（示例：E2E 模块 100 轮）
node scripts\autonomous-phase-gate.mjs --gate stress-e2e --spec e2e/wallet-connect.spec.ts

REM 阶段出口（全仓）
node scripts\autonomous-phase-gate.mjs --gate verify-100
```

失败时脚本打印 `%TEMP%` 日志尾部 + 结构化 `FAIL_STAGE=`，Agent **不得** 声称通过。

---

## 全局铁律（继承 2026-05-24，不可弱化）

1. 所有费用仅 **ION**。  
2. 禁止 mock/fake **链上**结果；不可用时 `console.warn("[module] not yet wired")` + 明确 `pending` / `null` txHash。  
3. 组件 ≤300 行、util ≤200 行。  
4. UTF-8 **无 BOM**；中文文件写后读回。  
5. 官方地址/合约：`.memory-bank/ion-dex-nuke/official-source-index.md`、`docs/ion-official-canonical-addresses.md`。  
6. UI 任务：`ION_UI_STRICT=1 node scripts/dev-preflight.mjs` + [`docs/11-ui-visual-self-audit-gate.md`](11-ui-visual-self-audit-gate.md) 自审报告。

---

## 阶段总览

| 阶段 | 代号 | 目标 | 出口门禁 |
|------|------|------|----------|
| 0 | **W0** | 文档/记忆库与基线对齐 | `verify-full` ×1 绿 |
| 1 | **W1** | 六引擎真实数据层 | `verify-full` + 新增 backend 测试 + **`verify-100`** |
| 2 | **W2** | 7 钱包 + 链切换 + 签名摘要 | 新/扩 `e2e/wallet*.spec.ts` **stress 100/100** + **`verify-100`** |
| 3 | **W3** | UI Pixel Correction Protocol | `ION_UI_STRICT=1` preflight + `verify-full` + UI 自审 md + **`verify-100`** |
| 4 | **W4** | 链上接线波次 1（Copy/Batch/Domain 读路径） | 相关 E2E **stress 100/100** + **`verify-100`** |
| 5 | **W5** | Indexer / 缓存 / 非 mock 读路径扩展 | backend stress + **`verify-100`** |
| 6 | **W6** | Sandwich + Bridge 双重签功能测 | Forge/security 矩阵 + **`verify-100`** |
| 7 | **W7** | CI/CD + 测试网部署脚本就绪 | CI workflow 绿 + `verify-100`（广播需密钥则 **W7-SKIP** 见下） |
| 8 | **W8** | 全项目收口 | **`verify-100`** + 更新全部进度文档 |

**W7-SKIP**：无 `DEPLOYER_KEY` / 测试网 RPC 时，只验收「脚本 + dry-run + 文档」，不广播交易；在 `SESSION_STATE` 记 `W7-SKIP reason=missing secrets`，不阻塞 W8。

---

## W0 — 文档与基线同步

**输入**：记忆库与根 `SESSION_STATE` 分叉、work-plan P1 仍标 ⏳、`99-current-progress` 过时段落。

**执行清单**

1. 更新 `.memory-bank/SESSION_STATE.md`：Phase → **W 系列**；删除 2026-05-19 过期 commit/Step。  
2. 同步 [`docs/ion-dex-work-plan.md`](ion-dex-work-plan.md)：P1A–P3A → ✅；追加 W1–W8 表。  
3. 修订 `docs/99-current-progress.md`：删除「合约未实现」等过时句；链到本文档。  
4. 根 `SESSION_STATE.md` 增加 **「全自动工单 W0–W8」** 进度表（当前阶段指针 `CURRENT_PHASE=W0`）。

**出口**：`node scripts/autonomous-phase-gate.mjs --gate verify-full` → exit 0。

**Commit 消息模板**：`docs: sync memory bank and autonomous work order W0 baseline`

---

## W1 — 六引擎真实数据层（P0）

**依据**：`.memory-bank/live-data-reference.md`

**交付**

| # | 路径 | 说明 |
|---|------|------|
| 1 | `backend/src/services/pancake.ts` | ION/WBNB `getReserves` + BNB 价换算 |
| 2 | `backend/src/services/binance.ts` | BNB/USDT ticker |
| 3 | `backend/src/services/gecko.ts` | OHLCV 缓存 TTL 30s |
| 4 | `backend/src/services/dexscreener.ts` | 秒级价 + 24h 统计 |
| 5 | `backend/src/services/ion-indexer.ts` | Indexer v3 封装 |
| 6 | `backend/src/services/price-aggregator.ts` | TTL 15s 聚合 `/api/price/ion` 等 |
| 7 | `backend/src/gateway/routes.ts` | 挂 `GET /api/price/ion`、`/api/klines/ion`、`/api/market/ion`、`/api/pool/ion` |
| 8 | `backend/src/services/markets.ts` | **移除** `provenance: mock` 作为默认；改为 upstream/cache |
| 9 | `backend/tests/` 或 `backend/src/**/*.test.ts` | 适配器契约测试（mock upstream 仅测试层） |
| 10 | `frontend` | ticker/K 线接新 API；失败显示真实 stale/error |

**禁止**：在前端直调 Pancake/Binance/CMC；禁止硬编码「看起来像真」的价格。

**开发快验**：每服务落地后 `cd backend && npm run verify`。

**出口**

1. `cd backend && npm run verify && npm run audit:high && npm run stress`  
2. `scripts\verify-full-save-log.cmd --no-pause`  
3. `node scripts\autonomous-phase-gate.mjs --gate verify-100`

**Commit**：`feat(data): six-engine price layer with cached upstream APIs (W1)`

---

## W2 — 7 钱包真实对接（P0）

**依据**：`.memory-bank/wallet-connect-requirements.md`

**交付**

| # | 内容 |
|---|------|
| 1 | `evmConnectors.ts` / `EvmWalletProvider`：7 钱包检测排序（EIP-6963 优先） |
| 2 | BSC(56) + ION 链切换；连接后自动 `switchChain` |
| 3 | Profile Hub：连接/断开/切换；**禁止** localStorage 假地址冒充已连接（除非明确 `demo` 模式且 UI 标注） |
| 4 | 资产操作前：签名摘要（token、amount、fee、slippage、chain） |
| 5 | `e2e/wallet-connect.spec.ts`（或扩展现有 smoke）：7 钱包入口可见 + 连接流（Playwright mock `window.ethereum`） |

**Phase 2+（本阶段仅脚手架，不阻塞出口）**：WalletConnect v2 / ION Browser / Online+ 文件占位 + `warn not yet wired`。

**出口**

```bash
node scripts/stress-playwright-100.mjs --spec e2e/wallet-connect.spec.ts
node scripts/autonomous-phase-gate.mjs --gate verify-100
```

**Commit**：`feat(wallet): seven EVM connectors with chain switch and sign summary (W2)`

---

## W3 — UI Pixel Correction Protocol

**依据**：`.memory-bank/architecture-audit.md` 未勾选项 + `docs/10-ui-design-route.md`

**交付**（**仅 CSS**，不改 DOM）

1. `frontend/src/styles/global.css`：`.glass-surface` SVG 噪点 opacity 0.05  
2. 底层发光 blur 60px + 青→洋红渐变  
3. `border-image` 截光边框  
4. 玻璃底 `rgba(255,255,255,0.03)`，禁止灰底  

**出口**

1. `set ION_UI_STRICT=1&& node scripts/dev-preflight.mjs`  
2. `verify-full` 绿  
3. 填写 `docs/ui-deliverable-self-audit-2026-05-25.md`（从 template 复制）  
4. `verify-100` 绿  

**Commit**：`style(ui): pixel correction protocol glass surfaces (W3)`

---

## W4 — 链上接线波次 1

**范围**：CopyTrade、BatchTransfer、Domain 读/写路径 — 接真实 RPC/合约配置，无假 `txHash`。

| 模块 | 后端 | 前端 | E2E stress 100 |
|------|------|------|----------------|
| CopyTrade | 配置 + 只读链上校验 leader | 保持 pending 直至签名 | `e2e/copy-trade.spec.ts` |
| BatchTransfer | 接 `BatchTransfer.sol` 地址；send → pending_signature | 不变 UI 契约 | `e2e/batch-transfer.spec.ts` |
| DomainManage | ION DNS adapter 或 indexer 路径 | 去掉 mock resolver 默认展示 | `e2e/domain-manage.spec.ts` |

**出口**：三个 spec 各 `stress-playwright-100.mjs` **100/100** + `verify-100`。

**Commit**：`feat(onchain): wire copy-trade batch-transfer domain adapters (W4)`

---

## W5 — Indexer 与读路径扩展

**依据**：`docs/04-development-roadmap.md` Phase 4

**交付（最小可验收）**

1. `backend/src/indexer/` 或 `workers/`：ION + BSC indexer 骨架（burn / staking 事件类型）  
2. `burn.ts` / `staking.ts` / `bridge.ts`：`provenance` 从 mock → indexer/cache，保留 stale 元数据  
3. 对账 job 占位：`reconcile-burn.ts`（单测验证形状）  

**出口**：backend verify + stress 绿 + `verify-100`。

**Commit**：`feat(indexer): scaffold ION/BSC workers and burn staking read paths (W5)`

---

## W6 — 安全功能测

**交付**

1. Sandwich 防御：Foundry 功能场景（非仅部署存在）  
2. Bridge 双重签名：E2E 或 Forge 路径覆盖 reject/accept  
3. 跑 `node scripts/verify-security-1000.mjs`（若已绿则记录证据路径）  

**出口**：security 脚本绿 + `verify-100`。

**Commit**：`test(security): sandwich and bridge dual-sign functional coverage (W6)`

---

## W7 — CI/CD 与测试网就绪

**交付**

1. `.github/workflows/` 与 `scripts/verify-full` 对齐（编码 + backend + frontend + audit）  
2. `Deploy.s.sol` / 部署文档：环境变量表；**无密钥则不广播**  
3. `scripts/deploy-testnet.cmd` dry-run 说明  

**出口**：本地 `verify-100`；CI 配置 lint（`act` 可选，不阻塞）。

**Commit**：`ci: align pipeline with verify-full and testnet deploy docs (W7)`

---

## W8 — 全项目收口

1. 全仓 `verify-100` **100/100 GREEN**  
2. 同步所有进度文档；`.memory-bank/SESSION_STATE.md` 待办改为「W 系列已完成项」  
3. 列出仍 **W7-SKIP** / Phase 2+ 钱包 / 主网 LP 等 Master 决策项（不冒充完成）

**Commit**：`chore: close autonomous work order W8 with 100-pass evidence`

---

## 自动修复 playbook（Agent 必遵）

| 失败阶段 | 日志 | 常见根因 | 修复方向 |
|----------|------|----------|----------|
| encoding | `check-encoding.ps1` | BOM/GBK/NUL | 转 UTF-8；删 `NUL` |
| backend-verify | backend test output | 类型/路由 | 修 test + 实现 |
| frontend-verify | Playwright | testid/路由/超时 | 对齐 `data-testid`；增 wait |
| audit:high | npm audit | 依赖 | 升级或 documented override |
| stress 100 | stress 脚本 stdout |  flaky E2E | 稳定选择器；禁止降断言 |
| verify-100 | `%TEMP%\ion-verify-100*.txt` | 任一轮子步失败 | 按 PASS n FAILED 行拆因 |

**禁止**：为绿而跳过测试、删断言、`--no-verify` commit、`--skip-verify-100`、伪造 `RESULT=GREEN`、伪造 `Verify-100-Proof` trailer。

---

## 进度跟踪（Agent 每阶段更新）

在根 `SESSION_STATE.md` 维护：

```markdown
## 全自动工单 W 系列（2026-05-25）

CURRENT_PHASE=W1
| 阶段 | 状态 | 100 绿证据 |
| W0 | ⏳/✅ | %TEMP%\ion-verify-full.txt |
| W1 | ⏳ | |
...
```

---

## 与旧派工单关系

- **2026-05-24 派工单**：产品页 CopyTrade / LiquidityMine / Domain / Settings / BatchTransfer / AI — **已完成，勿重做**。  
- **本工单**：记忆库 P0/P1 缺口 + 数据/钱包/索引/安全/CI — **接续执行**。

---

*生成：2026-05-25 · 全自动模式 · 每阶段出口必须 `verify-100` RESULT=GREEN*
