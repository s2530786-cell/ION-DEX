# 13 — 预言机与价格政策

> 单页设计 | 关联：`docs/02-tokenomics-and-fees.md`、`contracts/ion/`（未来 `OracleAdapter.fc`）

## 目标

- **展示价**（CMC/CEX）与 **结算价**（链上 TWAP/签名包）分离，防止单源操纵。
- 为 Swap、限价、网格、桥提供统一 `PriceQuote` 模型：价格、时间戳、来源、置信度。
- 定义熔断：偏离阈值、过期、低流动性时拒绝执行。

## 边界

| 范围内 | 范围外 |
|--------|--------|
| 多源聚合规则、签名包格式、健康 API | CMC 商业合同谈判 |
| Keeper 使用的执行价判定 | 二级市场做市策略 |
| 与 AMM `get_reserves` 一致性检查 | 监管定价认定 |

## 依赖

- `docs/02` 滑点政策（用户最小输出，协议不吞滑点）
- `docs/12` 池子储备 indexed 数据
- PancakeSwap TWAP（BSC）/ ION AMM 储备（ION）
- `docs/10` oracle signer 地址（Pending）

## 价格源优先级（建议）

| 用途 | 主源 | 备源 | 禁止 |
|------|------|------|------|
| UI 行情条 | CMC API | 缓存 ticker | 单独 CMC 结算 |
| Swap 报价 | AMM 储备 + 本地模拟 | — | 过期 CMC |
| 限价/网格执行 | 签名 Oracle 包 + TWAP | 多签刷新 | 单 relayer 报价 |
| 桥估值（UI） | CMC + 桥汇率 | — | 无 |

### Oracle 包（链下 → 链上）

```json
{
  "pair": "ION/USDT",
  "price": "…",
  "twapWindowSec": 1800,
  "sources": ["pancake_twap", "amm_spot"],
  "timestamp": 1710000000,
  "expiresAt": 1710000300,
  "signers": ["0x…"],
  "signature": "0x…"
}
```

### 熔断规则（示例，主网前需参数化）

| 条件 | 动作 |
|------|------|
| `now > expiresAt` | 拒绝新单；keeper 暂停 |
| 与 TWAP 偏离 > 3%（可配置） | 拒绝；仅允许减小仓位 |
| 池子储备 < 最小流动性 | 禁用 swap 入口 |
| 签名者不在 allowlist | 合约 revert |

## 与 Swap 的关系

1. 前端：CMC 显示 + **链上模拟**最小收到量。
2. 合约：`amountOutMin` 由用户签名；协议费在 `docs/02` 路径扣除。
3. Keeper：仅消费 **未过期** Oracle 包执行限价/网格。

## 退出标准

- [ ] `docs/13` 参数表写入 `config-registry`（阈值、窗口、签名者列表占位）。
- [ ] 后端 `GET /api/oracle/health` 返回各源状态（mock → real 分阶段）。
- [ ] BSC testnet：Pancake 池 TWAP 读通 + 与模拟 swap 偏差 < 1%（测试池）。
- [ ] `OracleAdapter.fc` 或 BSC 等价模块设计评审通过（`ion-contract-audit`）。
- [ ] 熔断集成测试：过期包、坏签名、偏离 TWAP 均 revert。
- [ ] 文档声明：**CMC 永不作为链上结算唯一来源**（与 `docs/02` 一致）。
