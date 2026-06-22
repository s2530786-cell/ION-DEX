# AI 能力层（公开指针）

ION DEX 的 AI 板块采用 **Gateway + Sentinel + Registry** 分层：对外统一 API，对内工具调用须过策略与审计。**完整战略与运营配置不在公开仓。**

## 公开仓包含

- **安全不变量 I1–I8 摘要**：见 [`.memory-bank/security-audit-and-stress-framework.md`](../security-audit-and-stress-framework.md)
- **Gateway / Sentinel 契约**：[`docs/ai-sentinel-gateway-contract.md`](../../docs/ai-sentinel-gateway-contract.md)（路由、schema 要点、禁止 tx/wallet/admin）
- **实现 stub**：`backend/src/ai/`（评估、审计、health/capabilities、部分 draft 路由 stub）
- **Skill 指针**：`.cursor/skills/ion-ai-civilization-kernel/SKILL.md`
- **公开范围说明**：[`docs/28-public-development-scope.md`](../../docs/28-public-development-scope.md)

## 完整配置（非公开）

详细能力注册、工具白名单正文与内部编排文档维护在 **授权私有仓库**。公开 clone 未配置私有根目录时，Sentinel 对工具调用 **默认 DENY**（deny-by-default）。

授权开发者：设置环境变量 `ION_PRIVATE_CORE_ROOT` 指向已 clone 的私有仓，并运行私有仓提供的 skill 链接脚本（见内部 onboarding）。

## 使命（一句）

可审计的 AI 辅助洞察与内容草稿；**AI 永不代签链上交易**；输出须带来源、时间戳与非投资建议声明。
