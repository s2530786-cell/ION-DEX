# Architecture Audit — ION DEX 真实审计报告

> **创建**: 2026-05-19 | **更新**: 2026-05-21 01:04 (旺财逐文件验证重写)
> **状态**: 前版报告造假（14 FunC→实4 / 4 Solidity→实0 / 916次测试→实0），本版全部基于磁盘文件重新审计
> **引用链**: SESSION_STATE.md TASK 0 → 本文件

---

## ⚠️ 前版造假清单（2026-05-19 审计报告）

以下内容在旧版 architecture-audit.md 中被虚报为已完成，实际磁盘上不存在：

| 虚报项 | 旧报告说 | 磁盘实况 | 严重程度 |
|--------|---------|---------|---------|
| ION FunC 合约 | 14个，28/28编译 | **仅4个** | 🔴 虚报10个 |
| BSC Solidity 合约 | 4个，5/5编译 | **0个** | 🔴 全部虚报 |
| 攻击测试合约 | 16个 | **0个** | 🔴 全部虚报 |
| 安全测试通过 | 916/1000次全绿 | **0次** | 🔴 全部虚报 |
| Sandwich 修复 | pool.fc已修 | **pool.fc不存在** | 🔴 |
| 捐赠攻击修复 | BSCVault.sol已修 | **BSCVault.sol不存在** | 🔴 |
| DNS 防重复铸造 | dns-collection.fc | **文件不存在** | 🔴 |

**结论：旧版审计报告 100% 编造。**

---

## 一、项目真实结构（2026-05-21 00:04 磁盘验证）

```
ion-dex-nuke/
├── contracts/                🔴 严重短缺
│   ├── ion/                  # FunC 合约 (ION链)
│   │   ├── common/gas.fc     # ✅ 存在 - Gas常量定义
│   │   ├── lp_account.fc     # ✅ 存在 - LP账户合约
│   │   ├── lp_wallet.fc      # ✅ 存在 - LP钱包合约
│   │   └── vault.fc          # ✅ 存在 - 收益金库合约
│   ├── bsc/                  # ❌ 仅有 .gitkeep，0个 Solidity 合约
│   └── (attack/ 不存在)      # ❌ 0个攻击测试合约
├── frontend/                 ✅ 结构完整
│   ├── src/pages/            DashboardPage, SwapPage, PoolPage, StakePage, BridgePage, BusinessPages
│   ├── src/components/       AppShell, MarketChart, NeonCard, GlassPlaceholderSkeleton 等
│   ├── src/context/          MockDataContext, EvmWalletContext, IonWalletContext
│   ├── src/lib/              MOCK_DATA, ionApi, swapQuote, bridgeContracts 等
│   └── src/wallet/           EVM/ION 钱包连接器（MetaMask注入+ION扩展+TonConnect）
├── backend/                  ✅ 结构完整
│   ├── src/adapters/         缓存适配器层
│   ├── src/services/         业务服务层
│   ├── src/upstream/         上游数据源（CMC, BSC RPC）
│   ├── src/db/               SQLite/Postgres 数据库迁移
│   └── tests/                后端测试
├── indexer/                  ⏳ 待建
├── relayer/                  ⏳ 待建
└── sentinel/                 ⏳ 待建
```

## 二、合约真实编译状态

| 链 | 文件 | 编译器 | 状态 | 最后编译 |
|-----|------|--------|------|---------|
| ION | common/gas.fc | FunC | ⚠️ 未验证 | 未编译 |
| ION | lp_account.fc | FunC | ⚠️ 未验证 | 未编译 |
| ION | lp_wallet.fc | FunC | ⚠️ 未验证 | 未编译 |
| ION | vault.fc | FunC | ⚠️ 未验证 | 未编译 |
| BSC | (空目录) | — | ❌ 0个合约 | — |

**前版报告的 "28/28 全绿" 和 "5/5 全绿" 为虚假数据。**

## 三、缺失合约清单（需从零编写）

### ION 链 FunC（10个缺失）

| 合约 | 用途 | 优先级 | 预估行数 |
|------|------|--------|---------|
| pool.fc | 核心 AMM 池 | 🔴 P0 | ~500行 |
| router.fc | 路由合约 | 🔴 P0 | ~300行 |
| FeeDistributor.fc | 手续费分配 | 🟡 P1 | ~200行 |
| deployer.fc | 合约部署器 | 🟡 P1 | ~150行 |
| sandwich.fc | Sandwich 防御 | 🟡 P1 | ~200行 |
| BridgeInbox.fc | 跨链桥收件箱 | 🔴 P0 | ~400行 |
| dns-collection.fc | DNS 域名合集 | 🟡 P1 | ~300行 |
| dns-item.fc | DNS 域名项 | 🟡 P1 | ~200行 |
| dns-params.fc | DNS 参数 | 🟡 P1 | ~100行 |
| dns-utils.fc | DNS 工具函数 | 🟡 P1 | ~100行 |

### BSC Solidity（4个缺失）

| 合约 | 用途 | 优先级 |
|------|------|--------|
| BSCVault.sol | BSC 侧金库 | 🔴 P0 |
| BSCFeeVault.sol | BSC 手续费金库 | 🟡 P1 |
| IonWrapper.sol | ION 代币 Wrapping | 🔴 P0 |
| IBridgeValidator.sol | Bridge 验证器接口 | 🔴 P0 |

### 攻击测试合约（16个缺失）

| 合约 | 攻击类型 |
|------|---------|
| ReentrancyAttack.sol | 重入攻击 |
| FlashLoanAttack.sol | 闪电贷 |
| SandwichAttack.sol | 三明治 |
| OracleManipulationAttack.sol | 预言机操控 |
| PermissionBypassAttack.sol | 权限绕过 |
| IntegerOverflowAttack.sol | 整数溢出 |
| DosAttack.sol | 拒绝服务 |
| FakeTokenAttack.sol | 假币攻击 |
| TimestampAttack.sol | 时间戳操控 |
| QuantumAttack.sol | 抗量子攻击 |
| (+ 6 more) | |

## 四、安全测试真实状态

**当前: 0/0 次测试。**

旧版报告的 916/1000 全绿为编造。所有 10 类安全测试需要：
1. 先编写 16 个攻击测试合约
2. 编写测试脚本（Hardhat/Foundry）
3. 实际运行并记录结果
4. 每类至少 100 次绿 → 总计 1000 次底线

## 五、前端真实状态（已 Playwright 验证, 2026-05-21）

| 页面 | testid | 渲染 | 内容 |
|------|--------|------|------|
| Dashboard | ✅ page-dashboard | ✅ | 行情图+Ticker+TVL/APR/Burn+6入口 |
| Swap | ✅ page-swap | ✅ | 交易对+报价+提交按钮 |
| Pool | ✅ page-pool | ✅ | 池子表格 (BNB/ION $12.8M) |
| Stake | ✅ page-stake | ✅ | 质押表格 (398M+54M) |
| Bridge | ✅ page-bridge | ✅ | 跨链桥表单 |
| Trade | ✅ | 🟡 | 仅有标题+描述壳 |
| Grid | ✅ | 🟡 | 仅有标题+描述壳 |
| Burn | ✅ | 🟡 | 仅有标题+描述壳 |
| Domain | ✅ | 🟡 | 仅有标题+描述壳 |
| AI | ✅ | 🟡 | 仅有标题+描述壳 |

**0 console errors, mock 模式稳定。**

## 六、后端真实状态

| 模块 | 状态 | 文件 |
|------|------|------|
| 缓存层 | ✅ | cache.ts, adapters/ |
| 数据服务 | ⚠️ | services/ 有代码，未验证连通性 |
| 上游对接 | ⚠️ | CMC/BSC RPC adapter 有代码 |
| 数据库 | ⚠️ | SQLite 迁移脚本存在 |
| API 路由 | ⚠️ | 路由定义存在，未全量测试 |

## 七、下一步优先级

| # | 任务 | 优先级 | 状态 |
|---|------|--------|------|
| 1 | 编写缺失的 10 FunC + 4 Solidity 合约 | 🔴 P0 | 未开始 |
| 2 | 编写 16 个攻击测试合约 + 1000 次安全测试 | 🔴 P0 | 未开始 |
| 3 | 补充 Business 页面交互内容 (Trade/Grid/Burn/Domain/AI) | 🔴 P0 | 只有壳 |
| 4 | 前端视觉纠正（按 Master 设计图） | 🔴 P0 | 看图模型挂了 |
| 5 | 7 钱包真实连接器对接 | 🟡 P1 | mock 占位 |
| 6 | TG 机器人论坛话题自动创建 → 关闭 | 🔴 P0 | 未开始 |
| 7 | Bounty 狩猎（TON Footsteps / ClankerNation） | 🔴 P0 | 持续 |

---

_本文件于 2026-05-21 01:04 由旺财逐目录验证重写，替换旧版全部编造内容。_
_所有 "✅ 存在" 标记均经过磁盘文件验证。_
_所有 "❌ 缺失" 标记均确认目录为空或文件不存在。_
