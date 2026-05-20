# 📊 Live Data Reference — 六引擎真实数据对接

> **Master钦定**: 前端不直调外部API，走后端缓存层(TTL 15s)，零mock数据。
> **引用**: architecture-audit.md → 本文件 → 各引擎API详情

---

## 引擎总览

| 引擎 | 优先级 | 数据类型 | 免费额度 | 后端文件 |
|------|--------|---------|---------|---------|
| 🥞 PancakeSwap | 🔴 P0 | ION价格根数据 | 无限 | `backend/src/services/pancake.ts` |
| Binance | 🔴 P0 | BNB/USDT基准价 | 1200次/分 | `backend/src/services/binance.ts` |
| 🪙 CMC | 🟡 P1 | 市值/排名 | 11K次/月 | `backend/src/services/cmc.ts` |
| 🦎 GeckoTerminal | 🟡 P1 | OHLCV K线 | 30次/分 | `backend/src/services/gecko.ts` |
| 🔍 DexScreener | 🟡 P1 | 秒级价格 | 300次/分 | `backend/src/services/dexscreener.ts` |
| ⛓️ ION Indexer | 🟡 P1 | ION链上全数据 | 无限 | `backend/src/services/ion-indexer.ts` |

## API 详情

### 1. PancakeSwap (BSC链上，根数据源)
- **Pool**: `0x6487725b383954e05cA56F3c2B93a104B3DD2C25` (ION/WBNB)
- **方法**: `getReserves()` — 链上直接读，不经过任何API
- **RPC**: `https://bsc-dataseed1.binance.org`
- **价格计算**: `ION_price = (reserve1 / reserve0) * BNB_price`

### 2. Binance
- **端点**: `https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT`
- **K线**: `https://api.binance.com/api/v3/klines?symbol=BNBUSDT&interval=1m`
- **深度**: `https://api.binance.com/api/v3/depth?symbol=BNBUSDT&limit=20`

### 3. CMC
- **端点**: `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=ION`
- **API Key**: 由 `backend/.env` 提供 (`CMC_API_KEY`)
- **Header**: `X-CMC_PRO_API_KEY: <key>`

### 4. GeckoTerminal
- **端点**: `https://api.geckoterminal.com/api/v2/networks/bsc/pools/0x6487725b383954e05cA56F3c2B93a104B3DD2C25/ohlcv/hour`
- **Header**: `Accept: application/json;version=20230203`
- **限速**: 30次/分 → 后端缓存TTL 30s

### 5. DexScreener
- **端点**: `https://api.dexscreener.com/latest/dex/pairs/bsc/0x6487725b383954e05cA56F3c2B93a104B3DD2C25`
- **响应**: 秒级价格 + 24h统计 + 交易量 + FDV

### 6. ION Indexer v3
- **端点**: `https://api.mainnet.ice.io/indexer/v3/`
- **文档**: `https://api.mainnet.ice.io/indexer/v3/index.html`
- **35+端点**: accounts, blocks, transactions, messages, jettons, nft, dns, staking

## 后端缓存架构

```
前端 → GET /api/price/ion → 后端 → 检查缓存(TTL 15s)
                                      ├─ 命中 → 返回
                                      └─ 未命中 → PancakeSwap(getReserves) + Binance(BNB/USDT)
                                               → 写入缓存
                                               → 返回
```

## 前端API规范

| 端点 | 方法 | 返回 | 说明 |
|------|------|------|------|
| `/api/price/ion` | GET | `{price, change24h, volume24h}` | ION综合价格 |
| `/api/price/bnb` | GET | `{price, change24h}` | BNB基准价 |
| `/api/klines/ion` | GET | `[{time, open, high, low, close, volume}]` | ION K线 |
| `/api/market/ion` | GET | `{marketCap, rank, fdv, supply}` | ION市值数据 |
| `/api/pool/ion` | GET | `{reserve0, reserve1, tvl, volume24h}` | PancakeSwap池子 |
| `/api/wallet/balance?address=0x...` | GET | `{bnb, ion, usdt, busd}` | 真链上余额 |
| `/api/wallet/nonce?address=0x...` | GET | `{nonce}` | 登录签名用 |
| `/api/wallet/verify` | POST | `{token}` | JWT签发 |

## Seven EVM wallet detectors

EVM钱包检测覆盖7种注入提供商，优先使用EIP-6963多钱包发现：

| 检测器 | 检测对象 | 优先级 |
|--------|---------|--------|
| EIP-6963 | 多钱包Provider发现 | 🔴 P0 |
| MetaMask | `window.ethereum.isMetaMask` | 🔴 P0 |
| OKX Wallet | `window.okxwallet` | 🟡 P1 |
| Trust Wallet | `window.trustwallet` | 🟡 P1 |
| Coinbase | `window.coinbaseWalletExtension` | 🟡 P1 |
| Binance Wallet | `window.BinanceChain` | 🟡 P1 |
| Injected Generic | `window.ethereum` (fallback) | 🟢 P2 |

真实文件: `frontend/src/lib/wallet/detectors.ts` (189行, 7个检测器完整实现)

## 禁止事项

- ❌ 禁止前端直调外部API — 必须走后端缓存层
- ❌ 禁止mock价格数据 — 必须真实API/链上查询
- ❌ 禁止硬编码池子地址以外的任何数据
- ❌ 禁止泄露API Key — 所有密钥走.env
