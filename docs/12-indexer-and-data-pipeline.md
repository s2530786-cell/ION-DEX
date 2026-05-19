# 12 — 索引与数据管道

> 单页设计 | 关联：`docs/03-technical-architecture.md`（Indexer API）、`backend/db/migrations/`

## 目标

- 将链上事件**可靠写入** PostgreSQL（`docs/03` 20 张核心表），供 API、Dashboard、Transparency 使用。
- 支持 **重组（reorg）**、幂等 ingest、滞后监控与手工回填。
- 明确 **indexer 为读模型权威**；链上合约为资金权威。

## 边界

| 范围内 | 范围外 |
|--------|--------|
| ION + BSC 事件 schema、worker、cursor | 全节点运维 |
| 表字段映射、对账作业 | CMC 行情（走 market-service） |
| 与官方 `ion-indexer` 对齐策略 | 历史数据迁移定价 |

## 依赖

- P0-3 数据库迁移（已完成 schema）
- `docs/10` RPC 端点
- Phase 4 路线图；可选克隆 `ice-blockchain/ion-indexer`
- Redis（锁、队列、缓存）

### Redis 拓扑（建议）

| 环境 | 拓扑 | 用途 |
|------|------|------|
| local | 单实例可选 | dev 可跳过 |
| staging/prod | 主从或托管 Redis | 锁、队列、行情缓存 |

**Key 规范：** `ion:{env}:{service}:{entity}:{id}`  
**TTL：** 行情 30–60s；锁 30s 续期；会话数据按业务定。  
**失效：** 缓存 miss → 回源 RPC/indexer；禁止 silent stale（返回 `cached_at`）。

### Indexer vs 直连 RPC

| 场景 | 手段 |
|------|------|
| 用户余额、simulate | **直连 RPC**（实时） |
| 历史、TVL、排行榜 | **Indexer → PG** |
| 管理后台统计 | PG |

## 数据流

```text
ION node / BSC RPC
  → indexer-worker (ion-indexer | bsc-indexer)
  → normalize → idempotent upsert
  → PostgreSQL (swaps, pools, burns, bridge_transfers, …)
  → indexer-api / market-service 读
  → frontend
```

### 事件 → 表映射（首批）

| 事件类型 | 目标表 | 幂等键 |
|----------|--------|--------|
| Swap | `swaps` | `chain_id + tx_hash + log_index` |
| Mint/Burn LP | `pools` 快照 + `swaps`? | `tx_hash + op` |
| Stake/Withdraw | `staking_positions` | `tx_hash + user + pool_id` |
| Burn transfer | `burn_events` | `tx_hash + token + amount` |
| Bridge lock/mint | `bridge_transfers` | `bridge_id + direction + nonce` |
| Treasury in/out | `treasury_flows` | `tx_hash + category` |

### Reorg 策略

1. 维护 `block_height` cursor + `block_hash`。
2. 检测 parent hash 不一致 → 回滚 `N` 个确认深度内写入（建议 `N=12` BSC / ION 官方建议值）。
3. 标记受影响记录 `status=reorged`，API 默认不展示直至重放完成。

### 对账

- 每 10 分钟：索引器汇总余额 vs 链上 `eth_call` / TON get-method（抽样池子）。
- 偏差 > 阈值 → `risk_events` + 告警（见 `docs/16`）。

## 退出标准

- [ ] `indexer/` 含可运行 worker 骨架 + README。
- [ ] 至少 **1 条链 testnet** 持续同步 Swap 事件进 `swaps`。
- [ ] Reorg 单测或集成测试：模拟回滚不重复计数。
- [ ] `GET /api/indexer/health` 返回 `lag_blocks`、`last_synced_at`。
- [ ] 回填 CLI：`node indexer/scripts/backfill.mjs --from-block …` 文档化。
- [ ] 与 mock 服务切换开关：`DATA_SOURCE=indexed|mock`（P0-4 子项）。
