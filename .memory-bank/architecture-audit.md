# Architecture Audit — ION DEX 真实审计报告

> **创建**: 2026-05-19 | **更新**: 2026-05-21 07:58 (旺财逐文件验证)
> **状态**: Cursor 06:47 推合约大 commit `912ca2c` → 磁盘验证 14 FunC + 5 Solidity + 2 Test ✅ 真代码
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

## 一、项目真实结构（2026-05-21 07:58 磁盘验证 — commit 912ca2c）

```
ion-dex-nuke/
├── contracts/                ✅ Cursor 06:47 交付
│   ├── ion/                  # FunC 合约 (ION链) — 14个
│   │   ├── common/gas.fc     # ✅ Gas常量定义 (2610B)
│   │   ├── common/common.fc  # ✅ 公共库 (9322B)
│   │   ├── pool.fc           # ✅ 核心AMM池 (8988B)
│   │   ├── router.fc         # ✅ 路由合约 (6153B)
│   │   ├── deployer.fc       # ✅ 合约部署器 (3886B)
│   │   ├── sandwich.fc       # ✅ MEV Sandwich防御 (4288B)
│   │   ├── FeeDistributor.fc # ✅ 手续费分配 (4228B)
│   │   ├── BridgeInbox.fc    # ✅ 跨链桥收件箱 (3574B)
│   │   ├── dns-auction.fc    # ✅ DNS拍卖 (3791B)
│   │   ├── dns-registrar.fc  # ✅ DNS注册 (2601B)
│   │   ├── dns-resolver.fc   # ✅ DNS解析 (3835B)
│   │   ├── staking-pool.fc   # ✅ 质押池 (6101B)
│   │   ├── lp_account.fc     # ✅ LP账户 (4229B)
│   │   ├── lp_wallet.fc      # ✅ LP钱包 (4816B)
│   │   └── vault.fc          # ✅ 收益金库 (3654B)
│   ├── bsc/                  # Solidity 合约 (BSC链) — 5个
│   │   ├── BSCVault.sol      # ✅ BSC金库 (4842B)
│   │   ├── BridgeRelay.sol   # ✅ 桥中继 (3812B)
│   │   ├── FeeReceiver.sol   # ✅ 手续费接收 (4661B)
│   │   ├── IonSwapRouter.sol # ✅ Swap路由 (2557B)
│   │   └── MockERC20.sol     # ✅ 测试代币 (2065B)
│   └── test/                 # 测试合约 — 2个
│       ├── BSCContracts.t.sol # ✅ BSC合约测试 (3124B)
│       └── MinimumOutput.t.sol # ✅ 最小输出测试 (929B)
│   └── (attack/ 不存在)      # ❌ 16个攻击测试合约仍缺失
├── frontend/                 ✅ 结构完整
├── backend/                  ✅ 结构完整
├── indexer/                  ⏳ 待建
├── relayer/                  ⏳ 待建
└── sentinel/                 ⏳ 待建
```

## 二、合约真实编译状态（2026-05-21 07:58）

| 链 | 合约数 | 编译器 | 状态 | 备注 |
|-----|--------|--------|------|------|
| ION | 14 FunC | FunC | ⚠️ 待编译验证 | 文件到位，需 FunC 编译器 |
| BSC | 5 Solidity | solc/forge | ⚠️ 待编译验证 | 文件到位，需 forge build |
| 测试 | 2 Foundry | forge test | ⚠️ 待运行 | 测试框架就绪 |

**旧版报告的 "28/28 全绿" 是假的。本次 commit 912ca2c 合约文件真实，但编译未验证。**

## 三、合约清单 — ✅ 已交付（commit 912ca2c）

### ION 链 FunC（14/14 ✅）

| 合约 | 用途 | 大小 | 状态 |
|------|------|------|------|
| pool.fc | 核心 AMM 池 | 8988B | ✅ |
| router.fc | 路由合约 | 6153B | ✅ |
| FeeDistributor.fc | 手续费分配 | 4228B | ✅ |
| deployer.fc | 合约部署器 | 3886B | ✅ |
| sandwich.fc | Sandwich 防御 | 4288B | ✅ |
| BridgeInbox.fc | 跨链桥收件箱 | 3574B | ✅ |
| dns-auction.fc | DNS 拍卖 | 3791B | ✅ |
| dns-registrar.fc | DNS 注册 | 2601B | ✅ |
| dns-resolver.fc | DNS 解析 | 3835B | ✅ |
| staking-pool.fc | 质押池 | 6101B | ✅ |
| lp_account.fc | LP账户 | 4229B | ✅ |
| lp_wallet.fc | LP钱包 | 4816B | ✅ |
| vault.fc | 收益金库 | 3654B | ✅ |
| common/common.fc | 公共库 | 9322B | ✅ |
| common/gas.fc | Gas常量 | 2610B | ✅ |

### BSC Solidity（5/5 ✅）

| 合约 | 用途 | 大小 | 状态 |
|------|------|------|------|
| BSCVault.sol | BSC 侧金库 | 4842B | ✅ |
| BridgeRelay.sol | 桥中继 | 3812B | ✅ |
| FeeReceiver.sol | 手续费接收 | 4661B | ✅ |
| IonSwapRouter.sol | Swap路由 | 2557B | ✅ |
| MockERC20.sol | 测试代币 | 2065B | ✅ |

### ⏳ 仍缺失

| 项目 | 数量 | 优先级 |
|------|------|--------|
| 攻击测试合约 | 16个 | 🔴 P0 |
| 安全测试运行 | 0/1000次 | 🔴 P0 |
| FunC 编译验证 | 14个 | 🟡 P1 |
| Solidity 编译验证 | 5个 | 🟡 P1 |

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

## 七、下一步优先级（旺财定方向）

| # | 任务 | 优先级 | 状态 |
|---|------|--------|------|
| 1 | FunC 编译验证 (14个) | 🔴 P0 | 待编译 |
| 2 | Solidity 编译验证 (5个) | 🔴 P0 | forge build |
| 3 | 编写 16 个攻击测试合约 | 🔴 P0 | 未开始 |
| 4 | 1000 次安全测试 (10类×100次) | 🔴 P0 | 0/1000 |
| 5 | 补充 Business 页面交互内容 (Trade/Grid/Burn/Domain/AI) | 🔴 P0 | 只有壳 |
| 6 | 前端视觉纠正（按 Master 设计图） | 🟡 P1 | 看图模型挂了 |
| 7 | 7 钱包真实连接器对接 | 🟡 P1 | mock 占位 |
| 8 | Bounty 狩猎 | 🔴 P0 | 持续 |

---

_本文件于 2026-05-21 07:58 由旺财逐文件验证重写。_
_合约文件已从 commit 912ca2c 拉到磁盘，逐文件确认存在且包含实质代码。_
_所有 "✅" 标记均经过磁盘文件长度验证（非零字节）。_
