# ION DEX 完整整合计划

> 生成时间：2026-05-23 21:45
> 扫描基础：contracts/ion/ 全绿编译通过 + 源码审计

---

## 一、合约层 — 已完成 ✅

| 模块 | 状态 | 详情 |
|------|------|------|
| router.fc | ✅ 已对齐 | swapExactIn / min_out 语义与 IonSwapRouter.sol 一致 |
| pool.fc | ✅ 已对齐 | handle_swap() 含 slippage 检查 `throw_unless(error::slippage, amount_out >= min_out)` |
| lp_account/wallet | ✅ 已对齐 | LP 凭证管理 |
| vault.fc | ✅ 已对齐 | 金库核心逻辑 |
| staking-pool.fc | ✅ 已对齐 | 质押池 |
| FeeDistributor.fc | ✅ 已对齐 | 手续费分发 |
| sandwich.fc | ✅ 已对齐 | 三明治攻击防御 |
| BridgeInbox.fc | ✅ 已对齐 | 跨链收件箱 |
| 压力测试 | ✅ 1300/1300 | 13合约×100次 = 1300次编译全绿 |
| 业务测试 | ✅ 100/100 | run_tests.ps1 ×100 全绿 |

### 合约层需要关注的精度问题

| 问题 | 严重度 | 说明 |
|------|--------|------|
| FunC int257 精度 | ⚠️ 低 | FunC 用 int257（模运算），EVM 用 uint256。当前 amm::get_amount_out 用 muldiv 处理，但 int257 溢出时不会 revert（会 wrap）。需要在 mul_div 函数中加入 `throw_unless(error::overflow, result >= 0)` |
| sqrt LP 计算 | ⚠️ 中 | `pool::mint_lp` 中初始流动性用 `sqrt(amount0 * amount1)`，FunC 没有原生 sqrt，用的牛顿迭代。精度是否足够需要在测试网验证 |
| fee_numerator 硬编码 9970 | ⚠️ 低 | 对应 0.30% LP fee。但与 `backend/src/lib/minimum-output.ts` 的 PROTOCOL_FEE_BPS=25 不符——25bps=0.25%。Fee 分成有两层：LP fee（全给 LP）+ protocol fee（团队/国库），目前合约和后台的定义不同 |
| collect_fees | ❌ 缺失 | handle_collect_fees 只是用 `reserve0+reserve1` 算 5bps 协议费送 FeeDistributor，但缺乏真正的 swap fee 累积逻辑。标准 DEX 应该从每笔 swap 中累加 protocol fee 到单独积蓄 |

---

## 二、后端层 ⚠️

| 服务 | 文件数 | 状态 |
|------|--------|------|
| API Gateway | 4 | ⚠️ 有路由框架，需验证路由完整性 |
| Market Service | 6 | ⚠️ 有 CMC/Gecko 适配器，但价格是 hardcoded seed（quotes.ts 里 BNB=$642, ION=$6.02） |
| Data Service | 2 | ⚠️ 同上 |
| DB | 4 | ⚠️ SQLite 文件存在，schema 未知 |
| Bridge Service | 1 | ⚠️ 骨架 |
| Burn Service | 2 | ⚠️ 骨架 |
| Staking Service | 1 | ⚠️ 骨架 |
| Tokens Service | 1 | ⚠️ 骨架 |

### 后端核心问题

| 问题 | 严重度 | 说明 |
|------|--------|------|
| **价格数据 hardcoded** | 🔴 高 | `backend/src/services/quotes.ts` 中 BNB=$642.20, ION=$6.02 是写死的。与当前实际价格（ION=$0.000139）差 43,000 倍！原因是 quote 服务用的微美元计价，但 seed price 是旧的 |
| **provenance="local-seed"** | 🔴 高 | 所有 quote 的 provenance 都是 local-seed，没有接 CMC/Gecko 真实数据 |
| **priceImpact 是拍脑袋** | 🟡 中 | priceImpactBps 函数用 if/else 硬编码的阈值，不是基于实际池子流动性算的 |
| **最小输出公式不同** | 🟡 中 | 前端 `computeSwapQuoteBreakdown` 和 后端 `computeMinimumOutputUnits` 的计算顺序不同：前端先扣 protocol fee 再扣 slippage，后端也是。但合约层 `pool.fc` 只检查 `min_out`，不检查 protocol fee（contract 层不收 protocol fee，只收 LP fee） |
| indexer | 🔴 空 | 只有 .gitkeep |
| relayer | 🔴 空 | 只有 .gitkeep |
| sentinel | 🔴 空 | 只有 .gitkeep |

---

## 三、前端层 🔴

| 页面 | 文件 | 状态 |
|------|------|------|
| SwapPage | ✅ 有 | 核心功能：token 选择、报价预览、连接钱包 |
| PoolPage | ✅ 有 | 流动性池管理 |
| StakePage | ✅ 有 | 质押页面 |
| BridgePage | ✅ 有 | 跨链桥页面 |
| DashboardPage | ✅ 有 | 仪表盘 |
| BusinessPages | ✅ 有 | 业务页面 |
| AppShell | ✅ 有 | 布局外壳 |

### 前端核心问题

| 问题 | 严重度 | 说明 |
|------|--------|------|
| **UI 是毛坯房** | 🔴 高 | UI 用的是基础 React 组件+Tailwind，没有做 ION 品牌定制（#24f7ff 青色、#ff3bd4 品红、5D 未来感霓虹风格） |
| **汇率 hardcoded fallback** | 🔴 高 | SwapPage 的 `fallbackRates: BNB=642.2, ION=6.02` — 跟后端一样是老数据。当前 ION=~$0.000139 |
| **没有真实交易按钮** | 🟡 中 | UI 上有 Swap 表单，但没有接入 IonSwapTx（wallet/ionSwapTx.ts），只是显示 quote |
| **AI 市场/AI 模块** | 🔴 不存在 | docs 里 PRD 和架构都提到了 AI Market、AI Sentinel，但代码里没有任何 AI/AI 相关的页面或组件。你提到跟豆包聊了很久 AI 的内容，但代码中没有落地 |
| **Grid/限价单** | 🔴 不存在 | V3 范围包括限价单和网格策略，页面没有 |
| **缺少页面** | 🟡 中 | PRD 里列了 17 个页面（Trade、Grid、Treasury、Transparency、Admin 等），代码只有 6 个 |
| **Wallet 连接** | ⚠️ 未验证 | IonWalletContext/EvmWalletContext 结构有了，但实际连接 ION 链的功能是否工作未知 |
| **全局 CSS** | 🟡 中 | 只有 global.css，没有 ION 品牌色系统，没有霓虹/玻璃态效果 |

---

## 四、AI 板块 — 🔴 基本不存在

你说跟豆包聊了很久 AI 内容，但代码层面：

| 需求 | 代码状态 |
|------|---------|
| AI Market 页面 | ❌ 不存在 |
| AI 市场分析/预测 | ❌ 不存在 |
| AI Sentinel（自动监控） | ❌ 不存在（sentinel/ 目录为空） |
| AI 风险评分 | ❌ 不存在 |
| AI K线/技术分析 | ❌ 不存在 |
| AI 交易策略推荐 | ❌ 不存在 |
| AI 自动网格 | ❌ 不存在 |
| Keeper 自动化 | ❌ 不存在 |
| Oracle | ❌ 不存在 |

文档里提到了这些设计（PRD V3 Scope、03-technical-architecture.md 的 ai-market-service、ai-sentinel），但实现是零。

---

## 五、核心精度/计算差异总结

| 项目 | EVM 设计 | FunC 实现 | 问题 |
|------|----------|-----------|------|
| **swap fee** | 0.30% LP fee + 0.25% protocol fee | pool.fc 只收 0.30% LP fee（9970/10000），相当于 0.3% 输入作为 fee 留给 LP | protocol fee 没在 swap 时收，collect_fees 从储备金扣 0.05% 跟设计不符 |
| **滑点** | amount_out >= amountOutMinimum | pool.fc handle_swap() 正确实现了 `throw_unless(error::slippage, amount_out >= min_out)` | ✅ 正确 |
| **最小输出计算** | (gross - protocolFee) * (1 - slippage%) | 后端和前端公式一致 | ⚠️ 前端 fallback 价格数据是错的，导致 UI 显示 quote 也是错的 |
| **价格精度** | 微美元计价 | 后端用 bigint 微美元 + pow10 | ⚠️ seed price 未更新 |
| **LP 精度** | uint256 | int257 (FunC) | ⚠️ 需验证 sqrt 牛顿迭代在边界条件的精度 |
| **手续费代币** | 只收 ION | contracts 写 ION，但前端和 Quote 没有 ION 计价逻辑 | ⚠️ 不一致 |

---

## 六、优先级修复计划

### P0（今晚能修的）
1. **更新后端 seed price** — ION=$0.000139，BNB=$600+，用 GeckoTerminal API 拉实时价
2. **git commit FIX-LOG.md** — 已完成
3. **Cursor 继续修前端 UI** — 给 Cursor 发布任务：UI 装修 + AI 模块

### P1（明天）
4. **合约 fee 逻辑统一** — pool.fc 加 protocol fee 累计逻辑，与 backend 的 25bps 对齐
5. **后端接真实数据源** — CMC/GeckoTerminal adapter 替换 local-seed
6. **前端接后端 API** — 让 SwapPage 调 `backend/services/quotes.ts` 而不是 fallback

### P2（本周）
7. **AI 模块建设** — AI Market 页面、AI 分析、AI Sentinel
8. **补齐缺失页面** — Trade、Grid、Treasury、Transparency、Admin
9. **indexer/relayer/sentinel 填充真实逻辑**
10. **ION 品牌 UI 装修** — 霓虹玻璃态 + 5D 极光背景

### P3（中长期）
11. **网格交易/限价单**
12. **Oracle 接入**
13. **Keeper 自动化**

---

## 七、现在最该做的事

根据优先级，建议你：

A) **让 Cursor 继续干前端 UI** — 发任务装修 SwapPage + Dashboard，用 ION 品牌色系
B) **修后端价格数据** — 我手动修 quotes.ts 把 seed price 改成 GeckoTerminal 实时拉取
C) **今晚让 Cursor 开始搞 AI 模块** — 先落地 AI Market 页面和 AI 价格分析组件

你选哪个方向先搞？
