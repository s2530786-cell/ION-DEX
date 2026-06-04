# API Overview

> The public API surface for integrating with ION DEX.

## Base URL

```
Production: https://api.iondex.io/v1
Testnet:    https://api.testnet.iondex.io/v1
```

> Note: API endpoints are in development. URLs above are target endpoints. Current development uses the ION Indexer v3 API at `https://api.mainnet.ice.io/indexer/v3/`.

---

## Authentication

### Public Endpoints
Most read endpoints are public and require no authentication:
- Market data (prices, volumes, OHLCV)
- Pool data (TVL, reserves, APY)
- Burn events and staking statistics
- Explorer-linked transaction records

### Authenticated Endpoints
Write operations and user-specific data require API key authentication:

```http
GET /v1/user/positions
Authorization: Bearer <your-api-key>
```

API keys are issued through the developer dashboard (coming soon).

---

## Rate Limits

| Tier | Rate Limit | Notes |
|------|-----------|-------|
| Public | 60 requests/min | No authentication required |
| Developer | 300 requests/min | API key required |
| Enterprise | 1,000 requests/min | Contact for elevated access |

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1717400000
```

---

## Core API Endpoints

### Market Data

```
GET  /v1/markets              # List all trading pairs
GET  /v1/markets/:pair        # Get pair details
GET  /v1/markets/:pair/ticker # 24h ticker
GET  /v1/markets/:pair/candles?interval=1h&limit=100  # OHLCV candles
```

### Swap / Trade

```
GET  /v1/swap/quote           # Get swap quote (input → output)
POST /v1/swap/execute         # Submit signed swap transaction
GET  /v1/swap/status/:txHash  # Check swap execution status
```

### Liquidity Pools

```
GET  /v1/pools                # List all pools
GET  /v1/pools/:address       # Pool details (TVL, reserves, APY)
GET  /v1/pools/:address/fees  # Fee collection history
```

### Grid Trading

```
POST /v1/grid/create          # Create grid strategy
GET  /v1/grid/:id             # Grid strategy status
POST /v1/grid/:id/stop        # Stop grid strategy
GET  /v1/grid/:id/performance # Grid performance metrics
```

### Staking

```
GET  /v1/staking/pools        # List staking pools
GET  /v1/staking/positions    # User staking positions
GET  /v1/staking/rewards      # Reward accumulation
```

### Burn Tracking

```
GET  /v1/burn/total           # Total ION burned
GET  /v1/burn/events          # Burn event history
GET  /v1/burn/address         # Burn address balance
```

### Bridge

```
POST /v1/bridge/initiate      # Initiate cross-chain transfer
GET  /v1/bridge/status/:id    # Transfer status tracking
GET  /v1/bridge/history       # Transfer history
```

---

## WebSocket API

Real-time data streams via WebSocket:

```
wss://api.iondex.io/v1/ws
```

### Channels

| Channel | Description |
|---------|-------------|
| `ticker:{pair}` | Real-time price updates |
| `trades:{pair}` | Trade execution feed |
| `book:{pair}` | Order book depth updates |
| `burn` | Burn events |
| `staking` | Staking position changes |

### Subscription

```json
{ "action": "subscribe", "channel": "ticker:ION/BNB" }
```

### Response

```json
{ "channel": "ticker:ION/BNB", "data": { "price": "0.000139", "volume24h": "12500", "change24h": "+0.33%" } }
```

---

## ION Indexer v3 API

For direct chain data access, ION provides the Indexer v3 API:

```
Base: https://api.mainnet.ice.io/indexer/v3/
```

This provides 35+ endpoints for raw chain data including:
- Account states and balances
- Transaction history
- Block data
- Jetton (token) metadata
- DeFi pool states

See the [ION Indexer Swagger docs](https://api.mainnet.ice.io/indexer/v3/) for full endpoint reference.

---

## Error Handling

All errors follow a standard format:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 60 requests/min exceeded. Retry after 30s.",
    "retry_after": 30
  }
}
```

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_PAIR` | 400 | Trading pair does not exist |
| `INSUFFICIENT_LIQUIDITY` | 400 | Not enough liquidity for swap |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `INTERNAL_ERROR` | 500 | Server error, retry later |

---

Return to [Developer Index](./developer-index.md) | [Contracts Overview](./contracts-overview.md) | [SDK Overview](./sdk-overview.md)