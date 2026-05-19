# 20 — Keeper、限价与网格

> 单页设计 | 关联：`docs/05-product-prd.md`（V3）、`docs/02-tokenomics-and-fees.md`、`docs/13-oracle-and-price-policy.md`

## 目标

- 冻结 **限价单簿模型**（链上 vs 链下）与 **网格策略** 执行架构，避免 V3 启动时工作量失控。
- 定义 Keeper **权限、gas、补偿、结算** 与 `FeeDistributor` 的关系。
- 评估 **MEV / 抢跑** 对 keeper 与用户的影响与缓解。

## 边界

| 范围内 | 范围外 |
|--------|--------|
| 架构选型、序列、费用结算 | Keeper 机器人商业运营 |
| 与 `LimitOrderBook.fc` / `GridStrategyVault.fc` 的接口 | 具体网格算法参数调优 |

## 依赖

- `docs/13` Oracle 签名包
- `docs/12` indexer（订单状态）
- Phase 6 FunC 合约
- `docs/18` 消息格式

## 限价单：模型选型（必须 Master 拍板）

| 模型 | 描述 | 合约复杂度 | Indexer | 推荐 |
|------|------|------------|---------|------|
| **A 链上簿** | 订单存链上，keeper 触发 match | 高 | 低 | 去中心化优先 |
| **B 链下簿 + 链上结算** | 签名 intent，keeper 提交执行 tx | 中 | 高 | **默认建议** |
| **C 纯链下** | 仅中心化撮合 | 低 | 高 | 不推荐 |

**默认：B** — 用户 EIP-712 / ION 签名 `OrderIntent`；keeper 监听 mempool/订单簿 API 执行。

### OrderIntent（B 模型）

```json
{
  "maker": "0x…",
  "pair": "ION/USDT",
  "side": "buy|sell",
  "price": "…",
  "amount": "…",
  "expiry": 1710000000,
  "salt": "…"
}
```

## Keeper 架构

```text
order-service (metadata, API)
  → keeper-worker (leader election, Redis lock)
  → simulate (oracle + pool state)
  → submit tx (dedicated keeper EOA / contract)
  → fee record → FeeDistributor
```

### 权限模型

| 角色 | 权限 |
|------|------|
| `KEEPER_ROLE` | 调用 `executeOrder` / `rebalanceGrid` |
| `PAUSER` | 紧急停 keeper 入口 |
| 多签 | 增减 keeper 地址、调整 gas 补贴上限 |

### Gas 与补偿

| 项 | 规则 |
|----|------|
| 执行费 | 用户下单时预付或从成交扣除（`docs/02` limit order fee） |
| Keeper 补贴 |  Treasury 预算；低于 `minProfit` 不执行 |
| 失败 | 链上 revert 不扣用户资产；keeper 自担 gas（或保险池） |

### MEV 缓解

| 措施 | V1/V2 | V3 |
|------|-------|-----|
| 用户 `amountOutMin` | ✅ Swap | ✅ |
| 私有 RPC / Flashbots（BSC） | 可选 M1 BSC only | 推荐 |
| Keeper batch 执行 | — | 降低被夹概率 |
| 公开 mempool 限价 | 高风险 | 文档警示 |

见 `docs/11` MEV 节。

## 网格策略

- 用户存入 `GridStrategyVault`；参数：`lower`, `upper`, `gridCount`, `investment`
- Keeper 周期检查价格 → 在区间内挂/撤 LP 或 swap leg
- **AI Sentinel**（V3）仅 advisory，**不得**自动动资（`docs/03` 安全基线）

## 退出标准

- [ ] ADR：限价模型 A/B/C 已签字（默认 B 写入 `docs/17` M4）。
- [ ] 序列图：`用户下单 → keeper 执行 → 结算`（Mermaid 存 `docs/20` 或 `docs/diagrams/`）。
- [ ] `FeeDistributor` 分配表含 limit/grid 费项且与 `docs/02` 一致。
- [ ] Keeper 合约角色 + 测试：非 keeper 调用 revert。
- [ ]  staging：1 个 keeper bot 跑通 testnet 限价成交 1 笔。
