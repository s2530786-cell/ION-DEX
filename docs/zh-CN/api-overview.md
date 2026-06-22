# API 概览

> 面向 ION DEX 集成方的中文 API 入口说明。

## Base URL

```text
Production: https://api.iondex.io/v1
Testnet:    https://api.testnet.iondex.io/v1
```

> 说明：上述 URL 当前应理解为**目标 API 端点**。公开开发阶段真实可见的部分，仍以仓库中的 backend/data 路由、测试环境和 ION Indexer v3 接入为主。

## 认证方式

### 公开只读端点

多数读取型端点按目标设计将保持公开访问，例如：

- 市场数据（价格、成交量、OHLCV）
- 池数据（TVL、储备、APY）
- 销毁事件与质押统计
- 可关联浏览器验证的交易记录

### 需要认证的端点

写操作与用户专属数据在目标设计中将需要 API Key：

```http
GET /v1/user/positions
Authorization: Bearer <your-api-key>
```

## 常见 API 分组

### Market Data

```text
GET  /v1/markets
GET  /v1/markets/:pair
GET  /v1/markets/:pair/ticker
GET  /v1/markets/:pair/candles?interval=1h&limit=100
```

### Swap / Trade

```text
GET  /v1/swap/quote
POST /v1/swap/execute
GET  /v1/swap/status/:txHash
```

### Liquidity Pools

```text
GET  /v1/pools
GET  /v1/pools/:address
GET  /v1/pools/:address/fees
```

### Grid Trading

```text
POST /v1/grid/create
GET  /v1/grid/:id
POST /v1/grid/:id/stop
GET  /v1/grid/:id/performance
```

### Staking

```text
GET  /v1/staking/pools
GET  /v1/staking/positions
GET  /v1/staking/rewards
```

### Burn

```text
GET  /v1/burn/total
GET  /v1/burn/events
GET  /v1/burn/address
```

### Bridge

```text
POST /v1/bridge/initiate
GET  /v1/bridge/status/:id
GET  /v1/bridge/history
```

## WebSocket 方向

目标中的实时流地址：

```text
wss://api.iondex.io/v1/ws
```

常见频道包括：

- `ticker:{pair}`
- `trades:{pair}`
- `book:{pair}`
- `burn`
- `staking`

## ION Indexer v3

当前公开资料里，ION 原始链数据的重要参考是：

```text
https://api.mainnet.ice.io/indexer/v3/
```

它覆盖账户、交易、区块、Jetton、DeFi 状态等多类原始链数据。

## 错误处理

典型错误格式：

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded.",
    "retry_after": 30
  }
}
```

常见错误码方向：

- `INVALID_PAIR`
- `INSUFFICIENT_LIQUIDITY`
- `RATE_LIMIT_EXCEEDED`
- `UNAUTHORIZED`
- `INTERNAL_ERROR`

## 使用建议

- 不要把当前公开文档里的端点当成“已经全部上线”的生产承诺。
- 当你实现 SDK、bot、前端接入或监控系统时，应把这些端点当作**版本化、可演进的接口面**。
- 涉及资金流、桥、费率或签名语义时，要以最终代码、已发布接口与已审计行为为准。

---

返回 [开发者入口](./developer-index.md) | [合约概览](./contracts-overview.md) | [SDK 概览](./sdk-overview.md) | [英文 API 概览](../api-overview.md)
