# 16 — 可观测性与事故响应

> 单页设计 | 关联：`docs/00-engineering-standards.md` §3.3、`docs/08-ci-agent-automation.md`

## 目标

- 生产环境具备 **指标、日志、链路追踪** 三板斧；关键路径可告警。
- 定义 **主网发布门禁**（验证 + 审计 + 对账）与 **L1–L3 事故 runbook**。
- 与现有自动化门（`agent-verify`、`iron-law-security`、`verify-100`）对齐证据留存。

## 边界

| 范围内 | 范围外 |
|--------|--------|
| 指标清单、告警规则、runbook 模板 | 24/7 外包 SOC 合同 |
| 日志字段规范（traceId 等） | 具体 Grafana 仪表盘 UI 美化 |
| CI 失败通知 | Telegram 机器人业务文案 |

## 依赖

- `docs/12` indexer lag 指标
- `docs/14` 桥对账作业
- `infra/` 监控栈（待建）
- GitHub Actions + 本地计划任务（已部分存在）

## 可观测性栈（目标）

```text
App (frontend/backend/relayer/indexer)
  → OpenTelemetry SDK
  → Collector
  → Prometheus + Loki + Tempo (or cloud equivalent)
  → Grafana dashboards + Alertmanager
```

### 核心指标（首批）

| 指标 | 告警阈值（初稿） |
|------|------------------|
| `api_request_duration_p95` | > 500ms 5m |
| `api_error_rate` | > 0.1% 5m |
| `indexer_lag_blocks` | > 50 |
| `bridge_pending_count` | > 100 或最老 > 1h |
| `bridge_reconciliation_delta` | ≠ 0 |
| `rpc_error_rate` | > 5% |
| `verify_100_last_result` | FAILED（cron 探测） |

### 日志规范

- JSON 行：`traceId`, `spanId`, `service`, `route`, `userId?`, `wallet?`, `errorCode`
- 资金相关：`audit` 专用流，保留 ≥ 400 天（合规配置可调）

## 主网发布门禁（与 `docs/17` 联动）

发布前必须全部为绿：

1. `node scripts/dual-chain-audit.mjs`
2. `scripts/verify-100.ps1` → `RESULT=GREEN`（或 Master 书面豁免）
3. 第三方合约审计报告（无 Critical 开放项）
4. `docs/10` 无 blocking `pending`
5. 桥 testnet 对账 24h 绿（若启用桥）
6. 回滚剧本演练记录（staging）

## Runbook 索引

| 场景 | 文档 |
|------|------|
| API 大面积 5xx | `runbooks/api-outage.md`（待建） |
| Indexer 滞后 | `runbooks/indexer-lag.md` |
| 桥对账失败 | `docs/14` L2/L3 |
| 合约 pause | `runbooks/contract-pause.md` |
| 密钥泄露 | `runbooks/key-compromise.md` |

## 退出标准

- [ ] `/metrics` 或 Prometheus scrape 端点可用（backend 至少）。
- [ ] 5 条核心告警规则在 staging 触发过测试告警。
- [ ] 结构化日志在本地 docker compose 可查询。
- [ ] `docs/16` runbook 链接表 ≥ 4 篇（可 stub + 负责人占位）。
- [ ] CI 上传 verify 摘要 artifact（scheduled workflow 已起步）。
- [ ] 主网 checklist 在 `docs/17` 引用本节门禁且已评审。
