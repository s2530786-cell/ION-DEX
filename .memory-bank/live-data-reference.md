# 🔌 实时数据对接参考 — 所有 Cursor 需要的地址和端点

> **写于 2026-05-19 23:15 | Master 钦定**
> 此文件解决 Cursor "一问三不知" 的问题。
> 每个服务都有真实地址，直接调用，不许 mock。
> `⚠️ 缺 Key` = 需要等 Master 提供后再对接。

---

## 📊 四引擎行情栈 — 全免费数据源（2026-05-20 建成）

**策略：四引擎互补 → ION DEX 前端全数据覆盖，零成本。**

| 引擎 | 免费额度 | 角色 | 工具/端点 |
|------|---------|------|----------|
| 🟡 **Binance** | 1200次/分 | BNB/USDT 基准价 | `scripts/binance.py` / `api.binance.com/api/v3` |
| 🔵 **CoinMarketCap** | 11K次/月 | 市值/排名/全市场 | `scripts/cmc.ts` / `pro-api.coinmarketcap.com` |
| 🦎 **GeckoTerminal** | 30次/分 | K线/OHLCV/池子详情 | `scripts/geckoterminal.py` / `api.geckoterminal.com/api/v2` |
| 🟣 **DexScreener** | 300次/分 | 秒级价格/买卖统计/FDV | `scripts/dexcreener.py` / `api.dexscreener.com` |
| ⛓️ **ION Indexer v3** | 无限制 | ION 原生链上全部数据 | `api.mainnet.ice.io/indexer/v3/` — 35+端点 |

### 价格转换链
```
ION/USD = ION/WBNB (BSC PancakeSwap 链上) × BNB/USDT (币安)
         ↓ 独立验证 ↓
  DexScreener $0.0001398 / GeckoTerminal $0.0001411 / CMC $0.0001389
```

### ⚠️ 铁律：前端不直调外部API
所有请求走后端缓存层：
```
用户浏览器 → DEX 后端 (/api/prices) → Redis/内存缓存 (TTL 15s) → 多源降级
```

### CoinMarketCap (已对接 ✅)
| 项目 | 值 |
|------|-----|
| API 地址 | `https://pro-api.coinmarketcap.com` |
| API Key | `342475df9fa5451aafbb3346be049f03` (已存入 `backend/.env`) |
| ION CMC ID | `27650` |
| ION Slug | `ice-decentralized-future` |
| 前端代理路径 | `/api/cmc` (Vite proxy) |
| 超时 | 12000ms |
| ION 市值估算 | `price × 11.36 × 10^9` |

### GeckoTerminal (已对接 ✅)
| 项目 | 值 |
|------|-----|
| Base URL | `https://api.geckoterminal.com/api/v2` |
| Header | `Accept: application/json;version=20230203` |
| 主要端点 | `/simple/networks/{n}/token_price/{addr}` — 简易查价 |
| | `/networks/{n}/pools/{addr}/ohlcv/{tf}` — K线数据 |
| ION 主力池 | PancakeSwap V3 ION/WBNB TVL $258K |
| 限制 | 30次/分 ⚠️ 前端必须走缓存 |

### DexScreener (已对接 ✅)
| 项目 | 值 |
|------|-----|
| Base URL | `https://api.dexscreener.com` |
| 主要端点 | `/latest/dex/tokens/{addrs}` — 批量查价 (最多30个) |
| | `/latest/dex/search?q={query}` — 模糊搜索 |
| | `/latest/dex/pairs/{chain}/{pair}` — 精确池子 |
| ION/WBNB Pair | `0x6487725b383954e05cA56F3c2B93a104B3DD2C25` |
| 额外发现 | ION on Osmosis (OSMO) + Aerodrome (Base/WETH) |
| 限制 | 300次/分 |
| ⚠️ | **无K线数据** → K线走 GeckoTerminal |

### Binance (已对接 ✅)
| 项目 | 值 |
|------|-----|
| Base URL | `https://api.binance.com/api/v3` |
| 主要端点 | `/ticker/price?symbol=BNBUSDT` — BNB基准价 |
| | `/ticker/24hr?symbol=BNBUSDT` — 24h行情 |
| | `/klines?symbol=BNBUSDT&interval=1h` — K线 |
| 限制 | 1200次/分 (权重制) |

### ION 价格降级路径
当外部API不可用时，走链上查询：
1. PancakeSwap V2 pair: `0x1610eDdFE8CFf46913D2c3A9a2AFE20b0aA4A22E` (ION/USDT)
2. 调 `Router.getAmountsOut(1 ION, [USDT, BUSD])` 获取报价
3. 最终兜底：ION Indexer runGetMethod → 调池子合约 get_pool_data()

---

## 🔥 销毁数据 (Burn Data)

## ⛓️ ION Indexer v3 — 原生链上全数据（2026-05-20 验证）

> Base: `https://api.mainnet.ice.io/indexer/v3/` | Swagger: 浏览器打开即可
> 35+ 端点，无需自建索引器。ION DEX 原生链数据全走这里。

### DEX 核心端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/jetton/masters` | GET | 代币列表（IONX, LION 等） |
| `/jetton/wallets` | GET | 用户代币余额 |
| `/jetton/transfers` | GET | 交易历史 = DEX 成交记录 |
| `/runGetMethod` | POST | 调池子合约 get_pool_data() 获取实时状态 |
| `/transactions` | GET | 全链交易（含 before/after 账户状态） |
| `/blocks` | GET | 区块实时数据 |
| `/accountStates` | GET | 合约状态 |
| `/estimateFee` | POST | 手续费估算 |
| `/message` | POST | 直接发送链上消息 |
| `/topAccountsByBalance` | GET | 富豪榜 |
| `/decode` | GET/POST | 解码 Opcode 和消息体 |

### 其他端点
`/addressInformation`, `/addressBook`, `/walletInformation`, `/walletStates`,
`/masterchainInfo`, `/masterchainBlockShards`, `/transactionsByMessage`,
`/traces`, `/pendingTransactions`, `/pendingTraces`, `/pendingActions`,
`/metadata`, `/dns/records`, `/vesting`, `/multisig/wallets`, `/multisig/orders`,
`/nft/collections`, `/nft/items`, `/nft/transfers`, `/adjacentTransactions`

### ION 主链销毁

| 项目 | 值 |
|------|-----|
| 销毁方式 | **addr_none** — TVM 地址类型 00，不是人类可读地址 |
| 机制 | 发送到 addr_none 的币从总供应量中永久移除 |
| Gas 销毁 | 每次交易约 50% gas 费走 addr_none 销毁 |
| 追踪字段 | block `value_flow.burned` (CurrencyCollection) |
| ⚠️ 注意 | **ION 链没有 EVM 0x000...dEaD 销毁地址** |

### BSC 侧销毁 (wION Bridge)

| 项目 | 值 |
|------|-----|
| ION BSC Token | `0xe1ab61f7b093435204df32f5b3a405de55445ea8` |
| BSC 销毁地址 | `0x000000000000000000000000000000000000dEaD` |
| 查询方式 | BSC RPC `balanceOf(burnAddress)` + Transfer 事件 |
| BSC RPC | `https://bsc-dataseed.binance.org/` |
| Chain ID | 56 |

---

## 💰 质押数据 (Staking Data)

| 项目 | 值 |
|------|-----|
| ION RPC HTTP v2 | `https://api.mainnet.ice.io/http/v2/` |
| ION JSON RPC | `https://api.mainnet.ice.io/http/v2/jsonRPC` |
| ION Indexer v3 | `https://api.mainnet.ice.io/indexer/v3/` |
| ION Explorer | `https://explorer.ice.io` |
| 选举人合约 | `-1:3333333333333333333333333333333333333333333333333333333333333333` |
| **全网络总质押** | **~57.71亿 ION** (elector balance, 实时链上) |
| **总供应量** | **~113.6亿 ION** (CMC 市场数据, `price × 11.36×10^9`) |
| **质押率** | **~50.8%** (57.71B / 113.6B) |
| **年化收益率** | **~25% APR** |
| **当前区块** | `18714644` (2026-05-19 23:27) |
| ⚠️ 注 | 质押数据查 elector 合约余额 → `getAddressBalance(elector)` |

---

## 🌐 域名数据 (Domain Data)

| 项目 | 值 |
|------|-----|
| 项目域名 | `swap.ion` |
| DNS 注册 | `dns.ice.io` |
| 过期时间 | 2027-05-11 |
| 所有者 | `UQCMEABQ9m41v7nWv0fiC_LGyf0svOvt_GbBQXOIRwJX8LiA` |
| 查询方式 | ION Indexer v3 → domain records |
| ⚠️ 注 | 域名解析走 ION 链原生 DNS，非标准 DNS |

---

## 🔀 交易对 (Trading Pairs)

### PancakeSwap (BSC)

| Pair | 地址 |
|------|------|
| **ION/USDT** | `0x1610eDdFE8CFf46913D2c3A9a2AFE20b0aA4A22E` |
| ION/BNB | （需从 PancakeSwap Factory 查询） |

### PancakeSwap 核心合约 (BSC)

| 合约 | 地址 |
|------|------|
| Router V2 | `0x10ED43C718714eb63d5aA57B78B54704E256024E` |
| Factory V2 | `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73` |

### Uniswap V3 (BSC)

| 合约 | 地址 |
|------|------|
| Quoter V3 | `0xb27308f9F90D2F3dcC8a55F0917A4D7AE73A3276` |

---

## 🔗 桥 (Bridge)

### ION 链端 (内建，只读)
| 组件 | 位置 |
|------|------|
| 验证者多签 | `multisig-code.fc` → config_param(71) |
| 投票收集器 | `votes-collector.fc` → config_param(72) |

### BSC 端 (待部署)
| 合约 | 源路径 |
|------|--------|
| Bridge.sol | `D:\openclaw-tools\ice-blockchain-bridge\solidity\Bridge.sol` |
| 部署脚本 | `D:\openclaw-tools\ion-bridge-deploy\` |

---

## 👛 钱包 (Wallets — 7个)

| 钱包 | 检测方式 |
|------|---------|
| MetaMask | `window.ethereum.isMetaMask` |
| Binance Web3 | `window.BinanceChain` |
| OKX Web3 | `window.okxwallet` |
| Bitget Web3 | `window.bitkeep.ethereum` |
| Trust Wallet | `window.trustwallet` |
| Coinbase Wallet | `window.coinbaseWalletExtension` |
| Rabby | `window.rabby` |

---

## 🔑 环境变量 (backend/.env)

```env
ION_DATA_MODE=auto
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_CHAIN_ID=56
BSC_ION_TOKEN_ADDRESS=0xe1ab61f7b093435204df32f5b3a405de55445ea8
ION_API_BASE_URL=https://api.mainnet.ice.io/http/v2/
ION_HTTP_TIMEOUT_MS=12000
CMC_API_BASE_URL=https://pro-api.coinmarketcap.com
CMC_API_KEY=342475df9fa5451aafbb3346be049f03  ← ✅ 已提供
```

---

## ⚠️ 当前缺失

| 缺失项 | 用途 | 影响 |
|--------|------|------|
| ION/BNB Pair 地址 | 第二个 DEX 交易对 | 可从 Factory 查询 `getPair(ION, WBNB)` |
| ION 主网提交 GeckoTerminal/DexScreener | 外网收录 | 提交 Listing Request 后可用 |

---

## 🏗️ 后端文件映射（真实实现路径）

| 功能 | 文件 | 数据源 |
|------|------|--------|
### 行情
| 文件 | 类型 | 数据源 |
|------|------|-------|
| `scripts/cmc.ts` | TypeScript | CMC Pro API |
| `scripts/binance.py` | Python | Binance 公开API (BNB/USDT) |
| `scripts/geckoterminal.py` | Python | GeckoTerminal (K线/池子) |
| `scripts/dexcreener.py` | Python | DexScreener (秒级价格/txns) |

### 后端实现
| 功能 | 文件 | 数据源 |
|------|------|-------|
| 行情 | `backend/src/services/live/markets-live.ts` | 四引擎 → 缓存 → 前端 |
| 烧币 | `backend/src/services/live/burn-live.ts` | BSC RPC `balanceOf(0xdEaD)` |
| 质押 | `backend/src/services/live/staking-live.ts` | ION RPC `getAddressBalance(elector)` ✅ |
| ION链 | `backend/src/services/live/ion-live.ts` | ION Indexer v3 (35+端点) |
| 域名 | （待实现） | ION Indexer v3 DNS records |
| 链上 | `backend/src/upstream/bsc-rpc.ts` | BSC JSON RPC |
| 链上 | `backend/src/upstream/ion-api.ts` | ION HTTP v2 API |

---

**此文件是 Cursor 启动后必读的数据字典。没有"不知道地址"的借口。**
