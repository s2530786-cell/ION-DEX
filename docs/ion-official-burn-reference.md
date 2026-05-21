# ION 官方销毁参考（ION DEX 必读）

> **铁律**：BSC 与 ION 主网销毁口径不同，须分别对照官方来源。禁止把跨链桥 `burn`、DEX 草稿 `FeeReceiver` 或臆造的 placeholder 当作 ION 主网销毁地址。

## 双链销毁口径

| 链 | 官方销毁 sink | 统计方式（产品） |
|----|---------------|------------------|
| **BSC** | `0x000000000000000000000000000000000000dEaD` | ION ERC-20 `balanceOf(dead)`（已确认） |
| **ION 主网** | `UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ`（**Burn Address**） | 官方 HTTP API `getAddressBalance` / 索引器对销毁地址的入账汇总 |

总供应叙事：**21.1B ION**；`remaining = cap - (bscBurned + ionMainnetBurned)`（需同一资产单位与精度约定）。

## 官方来源

| 来源 | 内容 |
|------|------|
| [ice-blockchain/ion-address-book](https://github.com/ice-blockchain/ion-address-book) → `source/system.yaml` | 条目 **Burn Address** → `UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ` |
| [address-book.explorer.ice.io](https://address-book.explorer.ice.io/addresses.json) | 构建后的浏览器地址簿（与 yaml 同步） |
| [api.mainnet.ice.io/http/v2/](https://api.mainnet.ice.io/http/v2/) | 官方 HTTP API（TON 兼容接口，如 `getAddressBalance`） |
| `ice-blockchain/ice-swap` + `bridge-solidity` | **BSC→ION** 路径上的 Bridge `burn` — 跨链结算，**不是**上表 BSC dead 销毁统计的替代品 |

同文件 `system.yaml` 中与销毁/资金相关的系统地址（供索引器标注，勿与 Burn Address 混淆）：

| 名称 | 地址（yaml） |
|------|----------------|
| BSC Bridge | `Ef8PSnTugXPqSS9HgrEWdrU1yOoy2wH4qCaqsZhCaV2HSNz1` |
| Treasury | `EQBp_r5Urgi1hPK6cH6VBEDCpKya9XgEaXc56UsUA761At9k` |
| Rewards | `EQD6NGWja-1_e1QRL5To1L6O_iLr25pl-7EZ_YlvogcUkmoY` |
| Team | `EQDR2MSm7NVTn0A9k_qSqiYnHQ4wrHC6fFL6jPYLR7rfQOdo` |

## 勿混用的「销毁」

| 场景 | 说明 |
|------|------|
| 跨链桥 BSC `burn` | `IONBridgeRouter` / Bridge 合约销毁 BSC 侧 ION 以释放主网额度 — 见 `officialBridgeSemantics.ts` |
| DEX `FeeReceiver`（BSC 草稿） | 协议费 35% 转入 `0x…dEaD` — 本仓产品经济学，须标注为 DEX 草稿而非官方主网销毁规则 |
| DEX `staking-pool` / LP `burn_notification` | LP 代币销毁通知 — AMM 内部逻辑，不是公链供应销毁看板 |

## ION DEX 实现约定

- 共享常量：`frontend/src/lib/officialIonAddresses.ts`、`backend/src/constants/official-ion-addresses.ts`
- 语义与文案：`frontend/src/lib/officialBurnSemantics.ts`
- 后端 live：`burn-live.ts` 在 `ION_DATA_MODE=live|auto` 时 BSC RPC + ION HTTP API 合并；主网不可达时 `ionMainnetBurnedIon` 为 `0` 且 provenance 标明原因
- Burn Desk 表单：仅 **观测/归因草稿**，不向用户暗示「在此页面销毁」；主网销毁由钱包向 **Burn Address** 转账完成

## 相关文档

- `docs/ion-official-canonical-addresses.md`
- `docs/ion-official-staking-reference.md`
- `frontend/src/lib/officialBridgeSemantics.ts`
