# 开发者入口

> 面向 ION DEX 开发者的中文公开入口。

## 为什么在这里构建

- **多链产品方向**：项目目标是一个 28 链聚合界面，公开文档、API 与产品壳层中已经能看到基础工程迹象。
- **支付与结算扩张方向**：仓库不只讨论 swap，也公开了更宽的支付与结算架构。
- **身份感知设计**：ION Identity 与 `.ion` 域名集成是公开产品方向的一部分。
- **AI 安全边界**：市场分析、仲裁与 Sentinel 概念都有公开边界说明，而不是模糊承诺。
- **仍在持续成形**：现在接入的是一个还在扩张中的工程基础，而不是一个已经冻结的闭合协议。

## 快速链接

| 资源 | 说明 |
|------|------|
| [API 概览](./api-overview.md) | 公开 API 面、认证方式、速率限制与典型端点 |
| [合约概览](./contracts-overview.md) | ION / BSC 双链合约结构与交互面 |
| [SDK 概览](./sdk-overview.md) | JavaScript / TypeScript SDK 设计与示例 |
| [快速开始](./quick-start.md) | 本地启动、环境变量与常见问题 |

## 架构概览

ION DEX 是一个多层系统：

```text
Frontend (React + Vite + Tailwind)
  -> API Gateway
    -> Market Service / Indexer API / Order Service / Grid Service
    -> Staking Service / Burn Service / Bridge Service
    -> Domain Service / Identity Service / AI Market Service
    -> Treasury Service / Notification Service / Admin Service

Workers
  -> ION Indexer / BSC Indexer / Domain Indexer
  -> Oracle Worker / Keeper Worker / Bridge Worker / AI Sentinel

Contracts
  -> ION Mainnet (FunC) + BSC (Solidity)

Storage
  -> PostgreSQL + Redis + Object Storage
```

完整结构见 [英文技术架构](../03-technical-architecture.md)。

## 核心工程原则

1. **用户资金永远由用户钱包控制。** 后端服务不替用户签名资产交易。
2. **链状态是真实来源。** backend / indexer 更多是缓存与分析层。
3. **高风险管理操作必须经过多签与 timelock。**
4. **AI 输出只能是建议层。** 不得包装成保证收益或保证执行的投资建议。
5. **没有审计、测试网战役、监控与事故预案，就不应进入生产发布。**

## 经济模型开发边界

接入 ION DEX 时，需要清楚当前公开经济数据是**草案约束**，不是最终主网常量：

- 当前常见草案费率：`0.3%` swap、`0.1%` 池创建、`0.5%` 部分商业 / 服务结算；
- 销毁 / 建设者 / 质押 / 国库逻辑仍是公开草案，尚未由已审计合约固化；
- BSC 销毁地址是公开参考，ION 主网销毁地址仍待官方确认。

这意味着：结算逻辑、费率路由、国库统计、SDK / API 参数设计，都应该做成**可配置与可版本化**，不能把今天的公开草案写死成未来不可变常量。

## ION 链接入

### 常见公开端点

| 端点 | URL |
|------|-----|
| HTTP v2 API | `https://api.mainnet.ice.io/http/v2/` |
| JSON RPC | `https://api.mainnet.ice.io/http/v2/jsonRPC` |
| Indexer v3 | `https://api.mainnet.ice.io/indexer/v3/` |

### 钱包支持方向

- **Online+ Wallet**：ION 原生生态钱包优先方向；
- **ION Browser Wallet**：浏览器扩展钱包；
- **MetaMask / OKX / Bitget**：面向 BSC / EVM 的兼容钱包。

### 官方参考

- [Explorer](https://explorer.ice.io/)
- [GitBook](https://docs.ice.io)
- [ION GitHub](https://github.com/ice-blockchain/ion)

## 推荐阅读顺序

1. [API 概览](./api-overview.md)
2. [合约概览](./contracts-overview.md)
3. [SDK 概览](./sdk-overview.md)
4. [快速开始](./quick-start.md)
5. [中文白皮书索引](./whitepaper-index.md)

## 语言与规范说明

- 本页是中文开发者入口，不是替代英文规范文档的独立宪法文本。
- 当涉及精确接口、最终参数、正式发布与已审计行为时，仍应以英文原文、代码仓库与最终发布文档为准。

---

返回 [中文文档中心](./index.md) | [中文白皮书索引](./whitepaper-index.md) | [英文开发者入口](../developer-index.md)
