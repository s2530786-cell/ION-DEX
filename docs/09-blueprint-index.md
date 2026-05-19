# 09 — 蓝图文档索引

> ION DEX 可执行设计包。每项均为单页：**目标 / 边界 / 依赖 / 退出标准**。  
> 读序建议：`17`（里程碑）→ `10`（配置）→ 按当前 Phase 选读。

## 核心包（最小集合 10–17）

| 文档 | 主题 | 覆盖缺口 |
|------|------|----------|
| [10-config-and-environments.md](./10-config-and-environments.md) | 环境、Config Registry、Pending 地址 | 配置矩阵、密钥来源 |
| [11-wallet-and-transaction-flow.md](./11-wallet-and-transaction-flow.md) | 多钱包、交易状态机、MEV、pending 队列 | 钱包壳、签名、Flashbots（BSC V1 可选） |
| [12-indexer-and-data-pipeline.md](./12-indexer-and-data-pipeline.md) | 索引、reorg、Redis、表映射 | Phase 4、事件 schema |
| [13-oracle-and-price-policy.md](./13-oracle-and-price-policy.md) | 多源价、TWAP、熔断 | CMC vs 结算价 |
| [14-bridge-operations.md](./14-bridge-operations.md) | 桥运营、relayer HA、LP、对账 | P0-5、验证者治理 |
| [15-identity-and-compliance.md](./15-identity-and-compliance.md) | ION ID、域名、隐私、合规钩子 | KYC、域名状态机 |
| [16-observability-and-incident.md](./16-observability-and-incident.md) | 指标、告警、runbook、主网门禁 | 运维、第三方审计门 |
| [17-release-milestones.md](./17-release-milestones.md) | V1/V2/V3 ↔ P0、四维成熟度、主网 checklist | PRD vs P0-5 桥；Phase 5 85% 误判 |

## 扩展包（18–22，补 PRD/审计薄弱项）

| 文档 | 主题 |
|------|------|
| [18-cross-chain-asset-and-messaging.md](./18-cross-chain-asset-and-messaging.md) | Jetton/native、LP 份额、TON cell vs EIP-712 |
| [19-official-integration-data-authority.md](./19-official-integration-data-authority.md) | ion-http-api / indexer / heimdall 决策图 |
| [20-keeper-limit-and-grid.md](./20-keeper-limit-and-grid.md) | Keeper 权限、限价簿模型、网格、MEV |
| [21-admin-transparency-notifications.md](./21-admin-transparency-notifications.md) | Admin RBAC、Transparency、Telegram 通知 |
| [22-analytics-and-product-metrics.md](./22-analytics-and-product-metrics.md) | 埋点、Success Metrics、Amplitude |

## 同步状态（消除漂移）

| 文件 | 说明 |
|------|------|
| [verification-six-pillars.md](./verification-six-pillars.md) | 六项验证现状（2026-05-19） |
| [99-current-progress.md](./99-current-progress.md) | Phase / P0 进度 |
| `.memory-bank/architecture-audit.md` | 24 项缺口 + P0 队列 |

## 相关权威文档

- `docs/01-official-addresses-and-assumptions.md` — Pending 事实表  
- `docs/03-technical-architecture.md` — 分层架构  
- `docs/05-product-prd.md` — 产品范围  
- `docs/08-ci-agent-automation.md` — 自动工作流  

## 补蓝图推荐顺序

```text
17 → 10 → 18 → 19 → 11 → 12 → 13 → 14 → 15 → 16 → 20 → 21 → 22
```

当前工程焦点：**M1**（`17`）= P0-4 + `11` + `18`/`19`。
