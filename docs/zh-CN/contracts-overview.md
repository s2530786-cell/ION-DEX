# 合约概览

> ION DEX 在 ION Mainnet 与 BSC 上的双链合约结构导读。

## 双链架构

| 链 | 角色 | 语言 | 运行时 |
|----|------|------|--------|
| **ION Mainnet** | 主 DEX、质押、域名、身份 | FunC / Tact | TON 兼容虚拟机 |
| **BSC** | Bridge vault、费率金库、辅助流动性 | Solidity | EVM |

## ION Mainnet 合约方向

### 核心交易

| 合约 | 作用 |
|------|------|
| `DexRouter.fc` | swap 路由与手续费收集 |
| `IonAmmPool.fc` | AMM 流动性池 |
| `LimitOrderBook.fc` | 限价单簿 |
| `GridStrategyVault.fc` | 网格策略执行 |

### 费用与经济层

| 合约 | 作用 |
|------|------|
| `FeeDistributor.fc` | 费用分发到销毁 / 质押 / 国库 |
| `StakingPool.fc` | 质押仓位与奖励 |
| `Treasury.fc` | 平台国库管理 |

### 基础设施

| 合约 | 作用 |
|------|------|
| `OracleAdapter.fc` | 价格源聚合 |
| `DomainMarketplace.fc` | `.ion` 域名交易 |
| `DomainResolverAdapter.fc` | 域名到地址解析 |

## BSC 合约方向

| 合约 | 作用 |
|------|------|
| `BSCVault.sol` | 跨链资产托管 |
| `BridgeVerifier.sol` | 跨链转账验证 |
| `BSCFeeVault.sol` | BSC 侧费率收集与路由 |

### BSC 公开参考

- PancakeSwap V3 ION/WBNB 公开交易对：`0x6487725b383954e05cA56F3c2B93a104B3DD2C25`
- `wION` 作为 ION 在 BSC 上的桥接表示
- 目标中的桥流程：源链监控 → 确认计数 → 验证人签名 → 目标链提交 → refund / retry 状态机

## 地址发布边界

- 合约地址不应在文档里被提前伪装成“已经主网发布”。
- 正式地址发布时应同时给出：
  1. 交易哈希
  2. 合约地址
  3. 对应源码
  4. ABI
  5. 审计报告

## 交互建议

- DApp / SDK 集成前，先看 [API 概览](./api-overview.md) 与 [SDK 概览](./sdk-overview.md)。
- 任何涉及真实资产流的执行路径，都不应只依赖前端校验。
- 桥、预言机、多签与 timelock 都属于高风险面，最终应以已审计实现与发布文档为准。

## 当前阅读方式

本页提供的是**结构导读**，帮助中文读者保持同语言导航；涉及精确函数、ABI、最终地址与审计结论时，请回到英文原文与代码仓库核对。

---

返回 [开发者入口](./developer-index.md) | [API 概览](./api-overview.md) | [SDK 概览](./sdk-overview.md) | [英文合约概览](../contracts-overview.md)
