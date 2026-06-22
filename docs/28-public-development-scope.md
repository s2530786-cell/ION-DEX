# ION DEX — 公开开发范围与路线图（概要）

> 本文档面向 **开源仓库读者**：说明我们在做什么、大致做到哪一步、后续方向。**点到为止**，不含内部战略细节、供应商选型或未公开架构。

## 我们在做什么

ION DEX 是面向 ION 生态的 **Web3 交易与数据门户**，风格参考主流 Web3 钱包 / DEX 产品：深色赛博玻璃 UI、多链数据展示、Swap / 流动性 / 质押 / 销毁分析，并逐步扩展桥接、域名、身份与 **可审计的 AI 辅助洞察**。

核心原则：**链上操作始终由用户钱包签名**；后端与 AI 不提供代签、代广播。

## 产品范围（按阶段，非承诺日期）

| 阶段 | 用户可见能力（概括） |
|------|----------------------|
| **V1** | 仪表盘、Swap、池子、质押、销毁统计、行情条、透明度页、钱包/资料壳 |
| **V2** | 跨链桥状态、ION DNS / 域名、ION ID 状态展示、金库与资料中心 |
| **V3** | 限价、网格策略、预言机/keeper 自动化（测试网验证后逐步开放） |
| **V4** | 治理准备、Launchpad、策略市场、开发者平台（规划项） |

详细功能列表见 [`05-product-prd.md`](05-product-prd.md)；**工程排期与依赖**见 [`04-development-roadmap.md`](04-development-roadmap.md)。

## 技术栈方向（公开仓内可见部分）

- **前端**：React + Vite + Tailwind，响应式（375 / 768 / 1440），E2E 冒烟测试
- **后端**：Node.js API、行情/链上数据适配层、索引读路径（burn / staking 等）、统一网关路由
- **合约**：ION 侧 FunC 与 BSC 侧 Solidity 骨架；费用、质押、桥、金库等模块分阶段落地
- **AI（公开边界）**：Gateway + Sentinel **契约与 stub**——分级权限、审计日志、禁止 AI 触达 tx/wallet/admin；洞察类接口需来源与时间戳、非投资建议声明。具体模型与供应商集成 **不在本仓库**

## 当前开源仓包含 / 不包含

**包含（可 fork、可验证）**

- 产品 UI 与页面流程、工程规范与设计参考
- 后端/前端构建、测试与 CI 验证脚本
- 合约与 API 的 **接口形状**、mock 数据路径、安全不变量摘要
- AI Gateway 的 **公开契约**（路由表、JSON schema 要点、deny-by-default 行为）

**不包含（请勿在 issue/PR 中索要细节）**

- 未公开的商业整合、专家编排、供应商路线图与完整白名单正文
- 生产密钥、主网地址定稿、未审计的部署参数
- 闭源 Skills、量化策略与私有依赖树

授权协作者通过内部流程获取私有配套仓库；公开 issue 请只讨论 **本仓库已存在的契约与代码**。

## 与详细路线图的关系

- **排期与交付物清单**：[`04-development-roadmap.md`](04-development-roadmap.md)（Phase 0–12，英文，偏工程）
- **进度快照**：[`99-current-progress.md`](99-current-progress.md)（维护者更新，可能较细）
- **AI API 契约**：[`ai-sentinel-gateway-contract.md`](ai-sentinel-gateway-contract.md)（仅 schema/路由，无战略正文）

## 如何参与

1. 阅读 [`00-engineering-standards.md`](00-engineering-standards.md) 与 [`AGENTS.md`](../AGENTS.md)
2. 本地：`frontend` / `backend` 分别 `npm install` → `npm run build` → 测试；根目录验证脚本见 `scripts/verify-full-save-log.cmd`
3. 贡献请保持 **最小 diff**、UTF-8 without BOM、不提交审计报告类战略 markdown 到公开远程

如有疑问：优先查文档与现有测试；涉及未公开能力请说明「需要契约扩展」而非要求公开内部设计。
