# 18 — 跨链资产与消息规范

> 单页设计 | 关联：`docs/11-wallet-and-transaction-flow.md`、`docs/14-bridge-operations.md`、`docs/02-tokenomics-and-fees.md`

## 目标

- 统一 **ION 链** 与 **BSC** 上资产表示、LP 份额、桥接映射与**签名消息格式**，避免前后端/relayer 各写一套。
- 明确 **Jetton vs native ION** 在 Swap/Pool/Bridge 中的使用边界。
- 为合约、indexer、钱包适配器提供同一套 **AssetId** 与 **MessageEnvelope** 定义。

## 边界

| 范围内 | 范围外 |
|--------|--------|
| 类型定义、消息 schema、链上/链下 ID 映射 | TON 协议层标准制定 |
| 桥接 `lock/mint/burn/release` 状态枚举 | 具体 FunC 操作码实现细节 |

## 依赖

- `docs/10` Config Registry（代币地址、decimals）
- `docs/19` 官方 indexer / RPC 权威来源
- ION 官方 Jetton 标准与钱包 SDK（Pending）

## 资产模型

### AssetId（逻辑标识，与链无关）

```text
asset_id = chain_family + ":" + kind + ":" + identifier

Examples:
  ion:native:ION
  ion:jetton:<master_address>
  bsc:erc20:0x...
```

| kind | ION | BSC | 用于 |
|------|-----|-----|------|
| `native` | ION coin | BNB | Gas、协议费（ION 侧） |
| `jetton` / `erc20` | Jetton master | ERC-20 | 交易对、LP 代币 |
| `lp_share` | LP Jetton / 内部份额 | LP ERC-20? | 流动性凭证 |

**决策（待 Master 确认）：**

| 选项 | LP 份额 | 优点 | 缺点 |
|------|---------|------|------|
| A | Jetton LP + BSC LP token | 与 AMM 惯例一致 | 双链两种实现 |
| B | 仅内部 accounting + 事件索引 | 合约简单 | 钱包需自定义展示 |

默认建议：**A**，与 `pool.fc` / Pancake 模式对齐。

### 桥接映射表（registry）

| 字段 | 说明 |
|------|------|
| `bridge_asset_id` | 逻辑 ID |
| `ion_address` | 主网合约/Jetton master |
| `bsc_address` | BSC 代币地址 |
| `decimals` | 必须一致或显式换算规则 |
| `min_bridge_unit` | 最小跨链单位 |

## 消息与签名

### 链别格式

| 链 | 用户操作 | 签名载体 | 验证 |
|----|----------|----------|------|
| BSC | Swap / Approve / Bridge | EIP-712 `typedData` | `ecrecover` / permit |
| ION | Swap / LP / Bridge intent | TON **cell/BOC**（官方 SDK） | 链上 / tonlib |

### MessageEnvelope（跨模块共用 JSON，签名前）

```json
{
  "version": 1,
  "action": "swap|add_liquidity|bridge_lock|bridge_release",
  "chainId": "ion-mainnet|bsc-56",
  "assetIn": "asset_id",
  "assetOut": "asset_id",
  "amountIn": "string-decimal",
  "amountOutMin": "string-decimal",
  "deadline": 1710000000,
  "nonce": "0x…",
  "recipient": "chain-specific-address"
}
```

- EVM：hash → EIP-712 domain（`name`, `version`, `chainId`, `verifyingContract`）
- ION：由官方 SDK 序列化为 cell；**禁止**前端手写 bit layout

### 桥消息（双端）

```text
ION lock event  →  relayer  →  BSC mint (with proof bundle)
BSC burn event  →  relayer  →  ION release
```

`proof_bundle` 含：`source_tx`, `block_hash`, `validator_sigs[]`, `nonce`, `bridge_id`

## 与现有 UI 差距（审计说明）

- Bridge：**BusinessPages 仅有壳**，未实现 `MessageEnvelope` 签名与 relayer 跟踪（见 `docs/14`）。
- Swap/Pool：**无钱包连接**，无真实 simulate/sign（见 `docs/11`）。

## 退出标准

- [ ] `shared/types/asset.ts`（或等价）导出 `AssetId`、解析函数、decimals 规则。
- [ ] `docs/registry/bridge-assets.json` 模板（全 Pending 占位，无假地址）。
- [ ] 钱包适配器文档说明 ION 必须用官方 SDK 序列化 cell。
- [ ] 桥与 swap 共用 `action` 枚举；OpenAPI / 内部 RPC 文档更新。
- [ ] 安全评审：重放域（chainId + nonce + contract）在双链均已覆盖。
