# 17 — 发布里程碑

> 单页设计 | 关联：`docs/05-product-prd.md`（V1/V2/V3）、`.memory-bank/architecture-audit.md`（P0）

## 目标

- 对齐 **产品 V1/V2/V3** 与工程 **P0–P6**，消除「PRD 说 V1 不含桥、审计说 P0-5 桥优先」类冲突。
- 给出可检查的 **里程碑退出标准** 与 **主网 checklist**。
- 作为 Agent / CI 判断「能否进入下一 Phase」的单一引用。

## 边界

| 范围内 | 范围外 |
|--------|--------|
| 里程碑定义、依赖顺序、门禁引用 | 市场营销上线日 |
| P0 与 V1 最小可交易（MVP）划分 | 代币上所谈判 |

## 依赖

- `docs/10`–`docs/16` 单页设计（逐项落地）
- `docs/04-development-roadmap.md`
- 铁律验证脚本族（`dual-chain-audit`、`verify-100`）

## 里程碑矩阵（权威对齐）

| 里程碑 | 产品范围（PRD） | 工程队列 | 用户可感知能力 |
|--------|-----------------|----------|----------------|
| **M0 工程基线** | — | P0-1～P0-3 ✅ | CI 绿、DB 存在 |
| **M1 V1 可交易 MVP** | Dashboard, Swap, Pool, Stake, Burn, Ticker, Transparency；钱包壳 | P0-4 + 钱包 V1 + 真实 swap 模拟 | 测试网可连钱包、可模拟 swap |
| **M2 V1.5 安全与数据** | 同上 + 真实行情 | Indexer 最小 + Oracle 读 | 图表/TVL 来自索引 |
| **M3 V2 跨链与身份** | Bridge, Domain, ION ID, Treasury | P0-5 + P1 indexer/oracle + `docs/14–15` | 桥可用、域名/ID 徽章 |
| **M4 V3 专业交易** | Limit, Grid, AI, Keeper | Phase 6 FunC + keeper + sentinel | 限价/网格/AI 顾问 |
| **M5 主网** | 全模块生产 | P0-6 部署 + `docs/16` 门禁 | 主网地址公开、审计报告 |

**Master 决策（默认）：** 跨链桥可同时标为 **V2 产品** 与 **P0-5 工程**，以 **M3** 交付，但 **M1 不阻塞桥合约开发**（并行 worktree）。

## 能力成熟度（避免「Phase 5 85%」误判）

每个对外模块标注四维：**UI / Data / On-chain / Production**

| 模块 | UI | Data | On-chain | Production | 备注 |
|------|----|------|----------|------------|------|
| Dashboard | 🟢 | 🟡 mock | 🔴 | 🔴 | |
| Swap | 🟢 | 🟡 | 🔴 | 🔴 | 无钱包签名 |
| Pool / Stake | 🟢 | 🟡 | 🔴 | 🔴 | |
| Bridge | 🟡 shell | 🟡 mock | 🔴 | 🔴 | BusinessPages 壳；**无 BridgePage.tsx** |
| Wallet | 🟡 shell | — | 🔴 | 🔴 | `docs/11` |
| Backend API | 🟢 | 🟡 mock | — | 🟡 | P0-3 DB ✅ |
| Contracts | — | — | 🟢 testnet | 🔴 | 1500 审计绿；主网未部署 |

**规则：** 对外宣称「完成」需 **四维均 🟢**，或 Master 书面豁免某一维。

## P0 与里程碑映射

| P0 | 里程碑 | 状态 |
|----|--------|------|
| P0-1 SecurityAttackTest | M0 | ✅ |
| P0-2 FunC test gate | M0 | ✅ |
| P0-3 Backend DB | M0 | ✅ |
| P0-4 Real data RPC+CMC | M1 | ⬜ 当前 |
| P0-5 Bridge stack | M3 | ⬜ |
| P0-6 Deploy scripts | M5 | ⬜ |

## 主网 Checklist（摘要）

### 合约与安全

- [ ] `dual-chain-audit` 绿 + 外部审计报告
- [ ] `verify-100` 绿（或书面豁免）
- [ ] 多签地址与 timelock 在区块浏览器 verified

### 配置与运营

- [ ] `docs/10` 无 blocking pending
- [ ] 桥 24h 对账绿（若启用）
- [ ] `docs/16` 告警与 runbook 演练记录

### 产品

- [ ] V1 页面生产数据非 mock（`provenance != mock`）
- [ ] 钱包主路径 E2E 通过
- [ ] Transparency 展示费率、金库、审计链接

### 发布

- [ ] staging 14 天无 P0 事故（见 `docs/00-engineering-standards`）
- [ ] 灰度 5% → 20% → 100% 记录
- [ ] 回滚剧本 ≤ 15 分钟验证

## 退出标准（本文档自身）

- [ ] 团队在 `SESSION_STATE.md` 注明当前目标里程碑（如 M1）。
- [ ] `docs/99-current-progress.md` Phase 表与上表一致。
- [ ] 新功能 PR 必须标注影响的里程碑 ID（M1–M5）。
- [ ] 自动化门：`M0`=`standard` gate；`M5` 前强制 `verify-100` 绿。
