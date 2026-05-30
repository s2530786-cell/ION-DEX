---
name: ion-ai-civilization-kernel
description: Public stub for AI Gateway + Sentinel contract and backend stub. Use for I1–I8 pointers, /v1/ai/* routes, evaluateToolCall, and audit. Load private kernel only when authorized and when changing allowlist/registry body or vendor integrations (not in public repo).
---

# ion-ai-civilization-kernel（公开存根）

## 公开仓

- `.memory-bank/ai-civilization-kernel/README.md` — 指针
- `docs/28-public-development-scope.md` — 对外范围（笼统，无战略细节）
- `docs/ai-sentinel-gateway-contract.md` — schema + `/v1/ai/*` 路由
- `backend/src/ai/**` — Sentinel evaluate + Gateway stub

## 私有仓（授权协作者）

完整内核、白名单与能力注册表在 **独立私有仓库**。需设置：

```powershell
$env:ION_PRIVATE_CORE_ROOT = "<path-to-ion-private-core>"
```

若 `scripts/ion-private-core-path.mjs` / skill-route 报 missing private path，先完成私有仓 clone 与环境变量。

## 何时读私有全量

- 编辑 tool allowlist 或 capability registry **正文**
- 接入外部 AI / 媒体 / 设计类 **vendor**
- 扩展 Master 级模块映射（非公开文档）

## 何时仅读公开契约

- 实现或测试 `evaluateToolCall`、`AuditEvent`、Gateway health/capabilities
- Phase C 类 draft POST（design prototype、video brief 等 stub）
- 前端 provenance 字段
- I1 拒绝 tx/wallet/admin 类 tool
