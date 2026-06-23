# ION DEX 全仓库安全审计报告

> **审计日期:** 2026-06-24 06:30 UTC+8
> **审计范围:** `ion-dex-nuke` 全仓库（合约/前端/后端/基础设施）
> **审计人:** 旺财
> **方法:** Evidence-based 静态分析（9 类检查：重入/权限/整数安全/Gas DoS/硬编码地址/费用销毁/事件发射/夹子保护/密钥泄露）

---

## 🚨 严重问题 (CRITICAL)

### CRIT-1: CMC API Key 泄露到公开仓库

| 项目 | 详情 |
|------|------|
| **文件** | `backend/.env` |
| **泄露内容** | `CMC_API_KEY=342475df9fa5451aafbb3346be049f03` |
| **Git 跟踪** | ✅ 已被跟踪，3 个历史 commit 中包含 |
| **严重性** | 🔴 CRITICAL — API Key 在公开 GitHub 仓库中完全暴露 |
| **影响** | 任何人可消耗 CMC 配额（11,000 次/月），可能导致 API Key 被 CMC 吊销 |

**修复方案:**
1. 立即到 CMC 后台重置 API Key
2. `git rm --cached backend/.env` 停止跟踪
3. 使用 `git filter-branch` 或 `bfg` 清除历史记录中的 Key
4. 更新 `backend/.env.example` 为模板（不含真实 Key）

---

## 🟡 高风险问题 (HIGH)

### HIGH-1: OrderBookV2.matchOrder() 永久不可用

| 项目 | 详情 |
|------|------|
| **文件** | `contracts/bsc/OrderBookV2.sol:107` |
| **问题** | `matchOrder()` 函数末尾 `revert IonDexSettlementDisabled()` — 永远 revert |
| **严重性** | 🟡 HIGH — 订单簿核心匹配功能完全不可用 |
| **影响** | 所有限价单只能创建/取消，无法成交。OrderBook 沦为纯展示层 |

```solidity
function matchOrder(uint256 orderId, uint256 fillAmount) external nonReentrant {
    // ... 所有验证通过 ...
    revert IonDexSettlementDisabled(); // ← 永远失败
}
```

**修复:** 实现真实的结算逻辑（token 转移 + order filled 更新），或标注为"未实现"并禁用前端入口。

### HIGH-2: OrderBookV2 只支持买单

| 项目 | 详情 |
|------|------|
| **文件** | `contracts/bsc/OrderBookV2.sol:72` |
| **问题** | `placeOrder()` 中 `if (!isBuy) revert IonDexUnsupportedOrderSide()` |
| **严重性** | 🟡 HIGH — 订单簿只有买单没有卖单 |
| **影响** | 无法创建卖单，OrderBook 功能残缺 |

### HIGH-3: DexSwapV2 缺少 slippage 保护

| 项目 | 详情 |
|------|------|
| **文件** | `contracts/bsc/DexSwapV2.sol:53` |
| **问题** | `swap()` 使用 `amountOutMinimum` 参数但 AMM 公式 `(amountInAfterFee * reserveOut) / (reserveIn + amountInAfterFee)` 没有使用滑点保护中间值 |
| **严重性** | 🟡 HIGH — 虽然有 minOutput 检查，但 AMM 计算基于当前 reserves，存在 sandwich attack 窗口 |
| **影响** | 用户可能在大额交易中被三明治攻击 |

### HIGH-4: IonOracleV2 单源预言机风险

| 项目 | 详情 |
|------|------|
| **文件** | `contracts/bsc/IonOracleV2.sol` |
| **问题** | 主预言机 + 1 个备份预言机，两者都可能同时失效（如 Chainlink 同节点宕机） |
| **严重性** | 🟡 HIGH — 预言机操控是 DeFi 最高频攻击向量 |
| **影响** | 预言机价格被操控 → FeeReceiver 市场模式误判 → 销毁/分配比例错误 |

**修复:** 增加 TWAP 机制或至少 3 源中位数聚合。

### HIGH-5: FeeReceiverV2 无 timelock

| 项目 | 详情 |
|------|------|
| **文件** | `contracts/bsc/FeeReceiverV2.sol` |
| **问题** | `setDestinations()` / `setOracle()` / `setThresholds()` 均为即时生效，无 timelock |
| **严重性** | 🟡 HIGH — owner 私钥泄露可瞬间重定向所有费用 |
| **影响** | 所有手续费流向可被单笔交易劫持 |

### HIGH-6: BridgeRelayV2 无 timelock / 无多签

| 项目 | 详情 |
|------|------|
| **文件** | `contracts/bsc/BridgeRelayV2.sol` |
| **问题** | `setQuorum()` / `addRelayer()` / `removeRelayer()` 均为单 owner 即时操作 |
| **严重性** | 🟡 HIGH — 跨链桥是中继器信任模型，owner 可单方面降低 quorum 到 1 |
| **影响** | 恶意 owner 可将 quorum 设为 1，单中继器即可盗取所有锁定资产 |

### HIGH-7: BSCVault 无 timelock

| 项目 | 详情 |
|------|------|
| **文件** | `contracts/bsc/BSCVault.sol` |
| **问题** | `setRelayer()` 即时生效，无 timelock，无多签 |
| **严重性** | 🟡 HIGH — 与 HIGH-6 联动，owner + 1 恶意中继器 = 全部资金可被盗 |

---

## 🟠 中风险问题 (MEDIUM)

### MED-1: block.timestamp 用于关键逻辑

| 文件 | 行数 | 用途 |
|------|------|------|
| DexSwapV2.sol | 54 | `block.timestamp > deadline` |
| OrderBookV2.sol | 73, 101 | deadline 检查 |
| VaultLockV2.sol | 53, 58 | unlockTime 计算 |
| NFTAuction.sol | 78, 90 | 拍卖开始/结束 |
| StakeReward.sol | 64 | 奖励计算 |

**风险:** `block.timestamp` 可被矿工在 ~15 秒窗口内操控。对 deadline/拍卖场景影响有限，但对奖励计算有累积效应。

### MED-2: 无 ERC20 approve 安全检查

| 文件 | 问题 |
|------|------|
| 多个合约 | 使用 `transferFrom` 但未检查 `approve` 返回值一致性 |

部分 ERC20 代币（如 USDT）`approve` 返回 void 而非 bool，可能导致 `transferFrom` 失败。

### MED-3: DexSwapV2 poolWhitelist 依赖管理员

| 项目 | 详情 |
|------|------|
| **文件** | `contracts/bsc/DexSwapV2.sol` |
| **问题** | `poolWhitelist` 完全由 owner 控制，无去中心化治理 |
| **影响** | owner 可单方面添加恶意池子 |

### MED-4: StakeReward 奖励依赖外部充值

| 项目 | 详情 |
|------|------|
| **文件** | `contracts/bsc/StakeReward.sol` |
| **问题** | 合约本身不 mint 奖励代币，依赖外部转入 `rewardToken` |
| **影响** | 如果 rewardToken 余额不足，用户无法 claim 奖励（但不会丢本金） |

### MED-5: NFTAuction 版税无接收地址

| 项目 | 详情 |
|------|------|
| **文件** | `contracts/bsc/NFTAuction.sol:104` |
| **问题** | `uint256 royalty = (a.highestBid * ROYALTY_BPS) / 10000` 被扣除但未转给任何人 |
| **影响** | 2.5% 版税滞留在合约中，卖家收到的是扣除后的金额，但版税无人认领 |

```solidity
// 当前代码:
paymentToken.safeTransfer(a.seller, a.highestBid - royalty);
// royalty 去哪了？留在合约里！
```

### MED-6: NFTAuction 使用 block.timestamp 而非 block.number

| 项目 | 详情 |
|------|------|
| **文件** | `contracts/bsc/NFTAuction.sol:133` |
| **问题** | `_currentTime()` 返回 `block.timestamp`，矿工可操控 |
| **影响** | 矿工可在拍卖结束前几秒插入交易，以略高于当前价抢走 NFT |

---

## 🟢 低风险 / 建议 (LOW / INFO)

### LOW-1: 合约 owner 无 transfer 两步确认

多个合约（IonOracleV2, IonSwapRouterV2, IonBurn, BSCVault, BridgeRelayV2, FeeReceiverV2）使用单步 `transferOwnership`。如果输错地址，合约永久失去控制。

**建议:** 使用 OpenZeppelin `Ownable2Step`。

### LOW-2: Solidity 版本不一致

| 文件 | 版本 |
|------|------|
| 大部分 | `0.8.24` |
| StakeReward.sol | `^0.8.20` |
| LiquidityPool.sol | `^0.8.20` |
| Dividend.sol | `^0.8.20` |
| TokenIssuer.sol | `^0.8.20` |
| NFTAuction.sol | `^0.8.20` |
| LiquidityMine.sol | `^0.8.24` |
| DynamicBurnConfig.sol | `^0.8.24` |

**建议:** 统一为 `0.8.24`（与 foundry.toml 一致）。

### LOW-3: 前端 .env.local 含占位符地址

```env
VITE_BURN_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
VITE_VAULT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

零地址占位符可能导致前端调用失败但不报清晰错误。

### LOW-4: 后端无认证中间件

API Gateway 代码中 auth 仅用于 admin API，公开 API 无限流保护（代码中有 rate limiting 声明但未见实现）。

### INFO-1: 合约数量与文档一致 ✅

101 个唯一合约/接口，与 `03-technical-architecture.md` 描述一致。

### INFO-2: Forge 编译零 warning ✅

`lint_on_build = false` 配置正确，编译通过。

### INFO-3: FeeReceiverAdmin 已全部清理 ✅

9 处历史审计引用已标注 DELETED。

### INFO-4: 费用销毁机制完整 ✅

FeeReceiverV2 + DynamicBurnConfig + IonBurn 三件套，支持熊市/中性/牛市动态分配，Master 25% 铁律硬编码。

### INFO-5: 重入保护覆盖完整 ✅

所有涉及资产转移的公开函数均使用 `nonReentrant` 修饰符。

---

## 📊 统计汇总

| 严重级别 | 数量 | 描述 |
|----------|------|------|
| 🔴 CRITICAL | 1 | CMC API Key 泄露 |
| 🟡 HIGH | 7 | OrderBook 不可用、预言机单源、无 timelock 等 |
| 🟠 MEDIUM | 6 | block.timestamp、版税滞留、ERC20 兼容等 |
| 🟢 LOW | 4 | 两步确认、版本不一致等 |
| ℹ️ INFO | 5 | 正面发现 |

**总计:** 23 项发现

---

## 🔧 优先修复顺序

1. **立即 (今天):** CMC API Key 重置 + 从 Git 历史清除
2. **本周:** OrderBookV2 matchOrder 实现 + 卖单支持
3. **本周:** FeeReceiverV2 / BridgeRelayV2 / BSCVault 加 timelock
4. **本月:** 预言机多源聚合 + TWAP
5. **本月:** NFTAuction 版税修复 + block.timestamp → block.number
6. **迭代:** Solidity 版本统一 + Ownable2Step 迁移
