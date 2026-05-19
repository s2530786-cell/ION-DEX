# 22 — 分析与产品指标

> 单页设计 | 关联：`docs/05-product-prd.md`（Success Metrics）、`docs/17-release-milestones.md`

## 目标

- 将 PRD **Success Metrics** 映射为可埋点事件与仪表板。
- 选定分析栈（**Amplitude** 或自建）与命名规范。
- 与 `docs/21` 运维通知区分：产品分析 vs 可靠性告警。

## 边界

| 范围内 | 范围外 |
|--------|--------|
| 事件表、核心漏斗、隐私约束 | 完整 growth 实验平台 |
| V1 最小埋点集 | 所有页面像素级热图 |

## 依赖

- 前端 `WalletProvider` / 路由（`docs/11`）
- 后端 API 网关（request id）
- 可选：Amplitude MCP / SDK

## 命名规范

```text
<Object><Action>   e.g. SwapSubmitted, WalletConnected
snake_case 属性；禁止 PII 明文地址（可用 hashed_wallet_id）
```

## V1 核心事件（最小集）

| 事件 | 触发 | 关键属性 |
|------|------|----------|
| `AppOpened` | 首屏 | `locale`, `viewport` |
| `WalletConnected` | 连接成功 | `wallet_type`, `chain` |
| `WalletConnectFailed` | 失败 | `error_code` |
| `SwapQuoted` | 报价成功 | `pair`, `amount_in`, `provenance` |
| `SwapSubmitted` | 点击提交 | `simulation_ok` |
| `SwapCompleted` | 链上确认 | `tx_hash` 截断 / 无 |
| `PoolAddLiquidityDraft` | 池子草稿 | … |
| `PageView` | 路由 | `page_id` |

## Success Metrics 映射

| PRD 指标 | 计算方式 |
|----------|----------|
| DAU / WAU | `AppOpened` unique |
| Swap 转化率 | `SwapSubmitted` / `SwapQuoted` |
| 钱包连接率 | `WalletConnected` / sessions |
| TVL | 链上 indexer（非 Amplitude） |
| 桥使用量 | `BridgeSubmitted`（M3+） |

## 隐私与合规

- 禁止上传：助记词、私钥、完整 KYC、原始 IP（可国家粒度）
- 钱包地址：仅 `sha256(address + salt)` 若必须

## 退出标准

- [ ] `discover-analytics-patterns` 或人工盘点现有 SDK 模式。
- [ ] V1 上表 8+ 事件在 staging 可看到（Amplitude 或 debug 面板）。
- [ ] Dashboard：Swap 漏斗 + 钱包连接率（`docs/22` 链接）。
- [ ] PR 模板：功能 PR 需列新增/变更事件。
- [ ] 与 `docs/15` 一致：无 KYC 原始字段进入分析。
