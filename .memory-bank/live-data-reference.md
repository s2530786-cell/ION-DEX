# 🔌 实时数据对接参考 — 所有 Cursor 需要的地址和端点

> **写于 2026-05-19 23:15 | Master 钦定**
> 此文件解决 Cursor "一问三不知" 的问题。
> 每个服务都有真实地址，直接调用，不许 mock。
> `⚠️ 缺 Key` = 需要等 Master 提供后再对接。

---

## 📊 行情数据 (Market Data)

### CoinMarketCap
| 项目 | 值 |
|------|-----|
| API 地址 | `https://pro-api.coinmarketcap.com` |
| ION CMC ID | `27650` |
| ION Slug | `ice-decentralized-future` |
| API Key 位置 | `backend/.env` → `CMC_API_KEY=` |
| ⚠️ 状态 | **缺 Key，需 Master 提供** |
| 前端代理路径 | `/api/cmc` (Vite proxy) |
| 超时 | 12000ms |
| ION 市值估算 | `price × 11.36 × 10^9` |

### ION 价格降级路径
当 CMC 不可用时，走链上查询：
1. PancakeSwap V2 pair: `0x1610eDdFE8CFf46913D2c3A9a2AFE20b0aA4A22E` (ION/USDT)
2. 调 `Router.getAmountsOut(1 ION, [USDT, BUSD])` 获取报价

---

## 🔥 烧币统计 (Burn Data)

| 项目 | 值 |
|------|-----|
| ION BSC Token | `0xe1ab61f7b093435204df32f5b3a405de55445ea8` |
| BSC 烧币地址 | `0x000000000000000000000000000000000000dEaD` |
| 查询方式 | BSC RPC `balanceOf(burnAddress)` + Transfer 事件 |
| BSC RPC | `https://bsc-dataseed.binance.org/` |
| Chain ID | 56 |
| ⚠️ 备注 | 烧币 = totalSupply - deadAddress balance |

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
CMC_API_KEY=    ← ⚠️ 需 Master 提供
```

---

## ⚠️ 当前缺失

| 缺失项 | 用途 | 影响 |
|--------|------|------|
| CMC_API_KEY | 行情实时报价 | 降级走 PancakeSwap 链上查询 |
| ION/BNB Pair 地址 | 第二个交易对 | 可从 Factory 查询 `getPair(ION, WBNB)` |
| BSC ION Token 已在上面 ✅ | 烧币查询 | 已填写 |

---

## 🏗️ 后端文件映射（真实实现路径）

| 功能 | 文件 | 数据源 |
|------|------|--------|
| 行情 | `backend/src/services/live/markets-live.ts` | CMC / PancakeSwap |
| 烧币 | `backend/src/services/live/burn-live.ts` | BSC RPC `balanceOf(deadAddr)` |
| 质押 | `backend/src/services/live/staking-live.ts` | ION JSON RPC `getAddressBalance(elector)` ✅ |
| 域名 | （待实现） | ION Indexer v3 DNS records |
| 价格 | `backend/src/upstream/cmc.ts` | CMC Pro API |
| 链上 | `backend/src/upstream/bsc-rpc.ts` | BSC JSON RPC |
| 链上 | `backend/src/upstream/ion-api.ts` | ION HTTP v2 API |

---

**此文件是 Cursor 启动后必读的数据字典。没有"不知道地址"的借口。**
