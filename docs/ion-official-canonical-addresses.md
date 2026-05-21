# ION 官方链上常量（Canonical On-Chain Facts）

> **铁律**：`ice-blockchain/*` 官方仓库与用户已确认的链上事实即标准。写代码前必须先查阅/调取；有现成实现或已确认地址时**禁止臆造**（勿发明 wION、假 wrapper、假 burn 路径）。

## BSC（已确认）

| 用途 | 地址 |
|------|------|
| **ION ERC-20 合约** | `0xe1ab61f7b093435204df32f5b3a405de55445ea8` |
| **ION 销毁地址（BSC dead）** | `0x000000000000000000000000000000000000dEaD` |
| **ION 主网销毁地址（Burn Address）** | `UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ` |

说明：

- BSC 上销毁统计 = 向 **dead** 地址转入的 ION（常见为 `balanceOf(dead)` 汇总）。
- 代币符号仍为 **ION**，无单独 wION 品牌。
- 总供应叙事：**21.1B ION**，不增发（跨链为映射/释放，非随意 mint 新品牌币）。

## 代码引用（本仓单一来源）

- 前端：`frontend/src/lib/officialIonAddresses.ts`
- 后端：`backend/src/constants/official-ion-addresses.ts`
- 跨链语义：`frontend/src/lib/officialBridgeSemantics.ts`
- 质押语义：`frontend/src/lib/officialStakingSemantics.ts`（见 `docs/ion-official-staking-reference.md`）
- 销毁语义：`frontend/src/lib/officialBurnSemantics.ts`（见 `docs/ion-official-burn-reference.md`）
- 官方仓库索引：`.memory-bank/ion-dex-nuke/official-source-index.md`

## 官方仓库（写桥/销毁/钱包前必读）

| 仓库 | 用途 |
|------|------|
| `ice-blockchain/ion` | 节点、钱包参考合约、DNS、tonlib |
| `ice-blockchain/ice-swap` | Bridge-Swap、`Bridge`、`IONBridgeRouter` |
| `ice-blockchain/bridge-solidity` | TON↔EVM 桥上游 |
| `ice-blockchain/ion-gateway` | TonConnect / 钱包注入 |
| `ice-blockchain/ion-address-book` | 生态合约地址簿（优先于猜测） |
| `ice-blockchain/liquid-staking-contract` | 零售流动性质押（ION → LION） |
| `ice-blockchain/nominator-pool` | 大额提名池（非零售 Stake UI） |

## 仍须从官方源确认（勿猜）

- 官方 Pool / LION minter 部署地址（从 address-book 或部署记录读取）
- 主网销毁 **24h/7d/30d 窗口** 趋势（需 indexer 历史，非单次 `getAddressBalance`）
- 主网 RPC / indexer 生产端点细节
