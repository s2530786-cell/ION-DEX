# SDK 概览

> 面向 JavaScript / TypeScript 集成方的中文 SDK 导读。

## 安装

```bash
npm install @ion-dex/sdk
```

## 快速示例

```typescript
import { IONDEX } from "@ion-dex/sdk";

const client = new IONDEX({
  network: "mainnet",
  rpc: "https://api.mainnet.ice.io/http/v2/jsonRPC",
});

const ticker = await client.markets.getTicker("ION/BNB");
const quote = await client.swap.getQuote({
  fromToken: "ION",
  toToken: "BNB",
  amount: "1000",
});
```

## 核心模块

- **Markets**：交易对、ticker、K 线与市场基础数据
- **Swap**：报价、执行与状态跟踪
- **Liquidity**：池列表、TVL、APR、增减流动性
- **Grid**：网格策略创建、监控与停止
- **Staking**：质押池、仓位与奖励
- **Bridge**：跨链发起与状态追踪
- **Wallet Adapters**：ION Browser Wallet、Online+、MetaMask 等接入层

## WebSocket 方向

SDK 目标上支持实时数据订阅，例如：

- `ticker:ION/BNB`
- `trades:ION/BNB`
- `burn`
- `staking`

## 错误处理

典型错误码包括：

- `INSUFFICIENT_LIQUIDITY`
- `SLIPPAGE_EXCEEDED`
- `INSUFFICIENT_BALANCE`
- `WALLET_NOT_CONNECTED`

## 类型支持

SDK 方向上将提供完整 TypeScript 类型，包括：

- `Market`
- `Ticker`
- `Quote`
- `Pool`
- `StakingPosition`
- `GridStrategy`
- `BridgeTransfer`

## 使用提醒

- 本页是中文导读，不是最终 SDK 规范说明。
- 涉及参数精确定义、版本差异、钱包适配细节与错误语义时，请回到英文原文与真实代码实现核对。

---

返回 [开发者入口](./developer-index.md) | [API 概览](./api-overview.md) | [快速开始](./quick-start.md) | [英文 SDK 概览](../sdk-overview.md)
