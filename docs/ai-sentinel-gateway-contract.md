# AI Sentinel & Gateway — 公开契约 v0.1

> 仅 **schema、路由与不变量**；战略级 AI 架构、完整白名单与供应商细节 **不在公开仓**。  
> 产品范围概要：[`28-public-development-scope.md`](28-public-development-scope.md)

## 不变量（摘要）

| ID | 规则 |
|----|------|
| I1 | AI 不得 sign / swap / stake / bridge / burn / approve |
| I2 | 输出含 source、confidence、timestamp、非投资建议 disclaimer |
| I3 | prompt / tool / model / 人工确认态全链路可审计 |
| I4 | 私钥、助记词、生产密钥不进 Agent 工具上下文 |

详见 `.memory-bank/security-audit-and-stress-framework.md`。

## Tier 分级

| Tier | 说明 |
|------|------|
| `read_insight` | 只读洞察、分析 |
| `draft_content` | 生成内容草稿，不执行 |
| `simulate` | 模拟/回测建议 |
| `propose_tx` | 仅生成人类可读 SigningSummary，**不广播** |

## JSON Schema 要点

### ToolAllowlistEntry

```json
{
  "tool_name": "string",
  "capability_ids": ["glob.pattern.*"],
  "max_tier": "read_insight | draft_content | simulate | propose_tx",
  "network_egress": false,
  "stores_pii": false
}
```

Deny-by-default：未在白名单注册的工具 → `DENY`。

### ToolCallRequest

```json
{
  "tool_name": "string",
  "capability_id": "string",
  "tier": "read_insight",
  "actor_id": "string",
  "session_id": "string",
  "payload": {}
}
```

### SentinelVerdict

```json
{
  "decision": "ALLOW | DENY | MASK",
  "reason": "string",
  "policy_id": "string",
  "scrubbed_payload": {}
}
```

### AuditEvent

```json
{
  "event_id": "uuid",
  "timestamp": "ISO-8601",
  "actor_id": "string",
  "session_id": "string",
  "tool_name": "string",
  "capability_id": "string",
  "tier": "string",
  "decision": "ALLOW | DENY | MASK",
  "request_id": "string",
  "provenance": {
    "source": "local | mock | upstream",
    "model": "string | null",
    "disclaimer": "Not financial advice."
  }
}
```

### Provenance envelope（模型输出）

所有 Gateway 对外 JSON 的 `data` 应可附带：

```json
{
  "provenance": {
    "source": "string",
    "confidence": 0.0,
    "timestamp": "ISO-8601",
    "disclaimer": "Not financial advice."
  }
}
```

## Gateway REST v1

| Method | Path | Tier | 状态 |
|--------|------|------|------|
| GET | `/v1/ai/health` | — | **已实现 stub** |
| GET | `/v1/ai/capabilities` | read_insight | **已实现 stub** |
| POST | `/v1/ai/insight/market/summary` | read_insight | Phase 2 |
| POST | `/v1/ai/insight/market/risk-score` | read_insight | Phase 2 |
| POST | `/v1/ai/strategy/grid/suggest` | simulate | Phase 2 |
| POST | `/v1/ai/content/video/brief` | draft_content | **Phase C stub**（Sentinel + mock brief） |
| POST | `/v1/ai/design/prototype` | draft_content | **Phase C stub**（Sentinel + mock layout） |
| POST | `/v1/ai/audit/report` | read_insight | Phase 2 |

## 禁止路由（v1 不存在）

- `POST /v1/ai/tx/*`
- `POST /v1/ai/wallet/*`
- `POST /v1/ai/admin/*`

请求上述路径 → **404** 或 Sentinel **DENY**（若误注册为 tool）。

## Sentinel 内部 API（TypeScript）

| 函数 | 说明 |
|------|------|
| `evaluateToolCall(ctx, request)` | 白名单 + tier；返回 `SentinelVerdict` |
| `emitAudit(ctx, event)` | append-only audit |
| `scrubSecrets(text)` | 脱敏（Phase 2+） |

实现：`backend/src/ai/sentinel/evaluate.ts`、`backend/src/ai/audit/log.ts`

## Allowlist 加载

- 公开 clone：无 `ION_PRIVATE_CORE_ROOT` → allowlist 空 → **全部 DENY**
- 私有 + 环境变量：从授权私有仓加载 tool allowlist（路径见内部 onboarding，不在公开文档列出）

## 验证

```bash
cd backend && npm run build && npm run test
# 含 backend/tests/ai-sentinel-evaluate.test.ts
```
