# ION DEX 项目工作计划 📋

> 制定时间：2026-05-23 22:20
> 执行模式：Cursor Agent 全自动 + 100次验证每步
> 监督人：旺财
> 总工期：29 天

---

## 项目阶段总览

```
阶段0：基础设施（1天） → 阶段1：后端数据（3天） → 阶段2：前端装修（7天）
→ 阶段3：AI板块（7天） → 阶段4：生态模块（7天） → 阶段5：合约完善（4天）
```

---

## 阶段 0：基础设施 — 1 天（2026-05-23）

**目标：后端能跑、数据源通、部署工具链配好**

| 任务 | 工期 | 负责人 | 交付标准 |
|------|------|--------|---------|
| 0.1 backend/.env 配真实 RPC + CMC key | 0.5h | 旺财 | ✅ 已完成 |
| 0.2 后端 quotes.ts 接 GeckoTerminal 实时价 | 1h | 旺财 | ✅ 已完成（编译通过） |
| 0.3 启动后端验证 markets/tickers 返回真实 ION 价格 | 0.5h | 子 agent | markets 返回 ION=$0.000139 ±20% |
| 0.4 启动 Cursor 桌面 GUI | 0.5h | 子 agent | MainWindowHandle != 0 |
| 0.5 下发 TASK-AUTO-WORKFLOW.md 给 Cursor | 0.5h | 子 agent | Cursor 开始执行 TASK 1 |

**里程碑 M0：** 后端所有端点返回真实数据 ✅ / ❌

---

## 阶段 1：后端真实数据 — 3 天（D1-D3）

**目标：9 个 mock services 全部换成真实数据源**

| # | 任务 | 工期 | 验收条件 |
|---|------|------|---------|
| 1.1 | markets.ts 接 CMC adapter（已配 key） | 1d | 返回 ION/BNB/ETH/BTC/SOL/USDT 真实价 |
| 1.2 | quotes.ts 已改 GeckoTerminal实时价 | 0.5d | ✅ 已完成 |
| 1.3 | staking.ts 接官方 elector-code 获取真实 APR | 1d | APR = ~12%（±1%）不是 18%/25%/31% |
| 1.4 | burn.ts 读 BSC 链上燃烧事件 | 0.5d | 燃烧量 = 链上真实值 |
| 1.5 | bridge.ts 接真实桥路由 | 0.5d | 路由不硬编码 |
| 1.6 | tokens.ts 改成 ION 链上 token 注册表 | 0.5d | 返回真实合约地址 |
| 1.7 | domain.ts 接 dns.ice.io API | 0.5d | 能查真实 .ion 域名 |
| 1.8 | sentinel/indexer/relayer 至少写骨架 | 0.5d | 不是 .gitkeep |

**里程碑 M1：** 9/9 services 非mock，后端自我验证全绿 ✅ / ❌

---

## 阶段 2：前端装修 — 7 天（D4-D10）

**目标：17/17 页面齐全，ION 品牌 UI**

| # | 页面 | 工期 | 验收 |
|---|------|------|------|
| 2.0 | ION 品牌 CSS + 霓虹玻璃态（#00e5ff / #ff3bd4 / backdrop-filter:blur） | 1d | 所有页面应用品牌色 |
| 2.1 | SwapPage — 接后端真实 quote 数据 | 0.5d | 显示 ION=$0.000139 不是 $6.02 |
| 2.2 | SwapPage — 接入 ionSwapTx.ts 真实交易 | 1d | 点击 swap 能调 wallet 发交易 |
| 2.3 | PoolPage — 接真实池子数据（总流动性、APR） | 1d | 显示真实 TVL |
| 2.4 | StakePage — 接真实 staking APR + 质押操作 | 1d | 质押能调合约 |
| 2.5 | BridgePage — 接桥后端 | 0.5d | 显示真实桥状态 |
| 2.6 | TradePage（新增） | 1d | 完整的交易界面 |
| 2.7 | TreasuryPage（新增） | 0.5d | 国库数据面板 |
| 2.8 | TransparencyPage（新增） | 0.5d | 公开数据审计面板 |
| 2.9 | AdminPage（新增） | 0.5d | 管理面板 |
| 2.10 | GridPage / 限价单（新增） | 1d | V3 高级交易功能 |
| 2.11 | 前端 100 次 TypeScript 编译全绿 | 0.5d | `npx tsc --noEmit` ×100 |

**里程碑 M2：** 17/17 页面存在，ION 品牌 UI，前端编译 100/100 ✅ / ❌

---

## 阶段 3：AI 板块 — 7 天（D11-D17）

**目标：AI 所有设计落地**

| # | 任务 | 工期 | 验收 |
|---|------|------|------|
| 3.0 | AI 架构设计（页面上已有的 PRD 文档） | 0.5d | 架构文档定稿 |
| 3.1 | AiMarketPage — AI 市场页面 | 1.5d | 可浏览 AI 分析，看 ION 实时 K 线 |
| 3.2 | AiPriceAnalysis 组件 — 价格预测/趋势分析 | 1d | 显示 AI 评语 |
| 3.3 | AiRiskScore 组件 — 风险评分 | 1d | 每笔交易显示风险等级 |
| 3.4 | AiSentinel（sentinel/ 目录）— 自动安全监控 | 1.5d | 监控后端交易，发现异常发告警 |
| 3.5 | AiStrategyRecommend — 交易策略推荐 | 1d | 基于市场数据推荐操作 |
| 3.6 | Keeper 自动化框架 | 0.5d | 自动执行预设策略 |
| 3.7 | AI 后端 API 实现（豆包/phi4 接入） | 1d | AI 能回答 ION 相关问题 |
| 3.8 | 100 次验证（编译 + 页面渲染） | 0.5d | 全绿 |

**里程碑 M3：** AI 版块 7 个组件全部可工作 ✅ / ❌

---

## 阶段 4：生态模块 — 7 天（D18-D24）

**目标：ION 全生态上齐**

| # | 模块 | 工期 | 验收 |
|---|------|------|------|
| 4.0 | 域名市场 — dns.ice.io 对接 | 1d | 能查、竞价、注册 .ion 域名 |
| 4.1 | DomainMarketPage 前端 | 1d | 域名列表 + 搜索 + 竞价界面 |
| 4.2 | 发币平台 — deployer.fc 前端 LaunchPage | 2d | 对标 Pump.fun：名称/代号/供应量/Logo/一键部署 |
| 4.3 | 发币后端创建接口 | 1d | 调 deployer.fc 部署合约 |
| 4.4 | ION 身份 ID — 集成官方 elector-code 身份体系 | 1d | ProfilePage 显示 ION ID |
| 4.5 | ProfilePage / 身份页面 | 1d | 查看、管理 ION 身份 |
| 4.6 | 100 次合约编译 + 功能测试 | 0.5d | 全绿 |

**里程碑 M4：** 域名市场 + 发币平台 + ION 身份 ID 可用 ✅ / ❌

---

## 阶段 5：合约完善 — 4 天（D25-D28）

**目标：合约精度问题全部修完**

| # | 任务 | 工期 | 验收 |
|---|------|------|------|
| 5.0 | pool.fc protocol fee 累计 | 1d | 每笔 swap 累计 protocol fee 到单独积蓄 |
| 5.1 | FeeDistributor.fc bps 默认值写死 | 0.5d | 后端 25bps = 合约 25bps |
| 5.2 | muldiv overflow 检查 | 0.5d | `throw_unless(error::overflow, result >= 0)` |
| 5.3 | staking-pool.fc 浮动利率 | 1d | Dynamic APR（base+lock+volume+shortage） |
| 5.4 | staking-pool.fc 对接官方 elector-code | 1d | 用官方 PoS 质押体系 |
| 5.5 | 1000 次安全测试全绿 | 1d | 1000/1000 |

**里程碑 M5：** 13 合约全绿，安全测试 1000/1000 ✅ / ❌

---

## 第 29 天：最终交付

- 所有代码 git commit + push
- 前后端启动 `node backend/dist/src/server.js` + `npm run dev`
- wallets 可连接、swap 可真正交易
- 汇报 Master

---

## 🛑 铁律

1. **每步 100 次验证** — 不过不去下一步
2. **不等命令** — Cursor 24h 空窗 > 1h → 旺财自动重启
3. **出问题报 Master** — 但带着解决方案报，不是光报问题
4. **修不好不跳过** — 不限次数，修通为止（铁律㉑）
5. **空代码=撒谎** — 不写 mock，不上假数
6. **写入即验证** — 每次改动自己验证再 commit
