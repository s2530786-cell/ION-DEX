# 21 — Admin、透明度与通知

> 单页设计 | 关联：`docs/03-technical-architecture.md`（admin-service）、`docs/16-observability-and-incident.md`

## 目标

- 定义 **Admin RBAC**、紧急暂停（Risk switch）、审计日志查询。
- **Transparency** 页展示内容的数据来源与更新频率。
- **通知管道**：链上/运维事件 → Telegram（及可选 Email/Webhook）。

## 边界

| 范围内 | 范围外 |
|--------|--------|
| 角色、API、UI 流程、通知事件表 | 客服工单系统 |
| 公开透明度数据字段 | 公关稿件 |

## 依赖

- `docs/10` 多签 / pauser 地址
- `docs/16` 告警事件
- `backend` admin 路由（待建）

## Admin RBAC

| 角色 | 权限 |
|------|------|
| `viewer` | 读 dashboard、审计日志 |
| `operator` | 公告、特性开关（非资金） |
| `risk_admin` | `pause` bridge/swap/keeper |
| `treasury_admin` | 金库提案（多签链上执行） |
| `super_admin` | 角色分配（多签） |

- 所有写操作：**双因素** + `audit_logs` 记录（who, what, before, after, ip, traceId）

## Risk switch（紧急暂停）

```text
risk_admin → POST /api/admin/pause { module: swap|bridge|keeper|all }
  → 后端确认角色
  → 调用合约 pause()（需事先授予 PAUSER）
  → 前端全局 banner + 禁用入口
  → Telegram critical 通知
```

| module | 合约 | UI |
|--------|------|-----|
| swap | Router/Pool pause | Swap/Pool 灰显 |
| bridge | Bridge pause | Bridge 仅显示状态 |
| all | 全部 | 维护页 |

## Transparency 页

| 区块 | 数据源 | 刷新 |
|------|--------|------|
| 费率与分配 | `docs/02` + 链上 FeeConfig | 日 |
| TVL / 成交量 | indexer | 分钟 |
| 销毁双链 | `burn_events` | 小时 |
| 金库地址 | Config Registry | 变更时 |
| 审计报告链接 | 静态 CMS / admin | 手动 |
| 合约 verified 链接 | 浏览器 | 部署后 |

## 通知（事件 → 渠道）

| 事件 | 级别 | Telegram | 备注 |
|------|------|----------|------|
| verify-100 FAILED | P1 | ✅ | CI / 计划任务 |
| 桥对账偏差 | P0 | ✅ | `docs/14` |
| 合约 pause | P0 | ✅ | |
| 每小时资产摘要 | info | ✅ | 铁律汇报；可配置关闭 |
| 部署成功 | info | optional | |

- 实现：`notification-service` + `TELEGRAM_BOT_TOKEN` / `CHAT_ID`（仅 env，不入库）
- 模板：中英各一，含链接到 Grafana / 区块浏览器

## 退出标准

- [ ] Admin API 鉴权 + 角色测试（越权 403）。
- [ ] 至少 1 次 staging `pause swap` 演练并产生 audit log。
- [ ] Transparency 页无 mock 文案；链上数据标 `source=indexed`。
- [ ] Telegram 测试消息从 staging 发出。
- [ ] Runbook 链接：`docs/16` 索引含 admin/pause 条目。
