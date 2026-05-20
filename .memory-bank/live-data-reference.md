# 馃搳 Live Data Reference 鈥?鍏紩鎿庣湡瀹炴暟鎹鎺?
> **Master閽﹀畾**: 鍓嶇涓嶇洿璋冨閮ˋPI锛岃蛋鍚庣缂撳瓨灞?TTL 15s)锛岄浂mock鏁版嵁銆?> **寮曠敤**: architecture-audit.md 鈫?鏈枃浠?鈫?鍚勫紩鎿嶢PI璇︽儏

---

## 寮曟搸鎬昏

| 寮曟搸 | 浼樺厛绾?| 鏁版嵁绫诲瀷 | 鍏嶈垂棰濆害 | 鍚庣鏂囦欢 |
|------|--------|---------|---------|---------|
| 馃 PancakeSwap | 馃敶 P0 | ION浠锋牸鏍规暟鎹?| 鏃犻檺 | `backend/src/services/pancake.ts` |
| Binance | 馃敶 P0 | BNB/USDT鍩哄噯浠?| 1200娆?鍒?| `backend/src/services/binance.ts` |
| 馃獧 CMC | 馃煛 P1 | 甯傚€?鎺掑悕 | 11K娆?鏈?| `backend/src/services/cmc.ts` |
| 馃 GeckoTerminal | 馃煛 P1 | OHLCV K绾?| 30娆?鍒?| `backend/src/services/gecko.ts` |
| 馃攳 DexScreener | 馃煛 P1 | 绉掔骇浠锋牸 | 300娆?鍒?| `backend/src/services/dexscreener.ts` |
| 鉀擄笍 ION Indexer | 馃煛 P1 | ION閾句笂鍏ㄦ暟鎹?| 鏃犻檺 | `backend/src/services/ion-indexer.ts` |

## API 璇︽儏

### 1. PancakeSwap (BSC閾句笂锛屾牴鏁版嵁婧?
- **Pool**: `0x6487725b383954e05cA56F3c2B93a104B3DD2C25` (ION/WBNB)
- **鏂规硶**: `getReserves()` 鈥?閾句笂鐩存帴璇伙紝涓嶇粡杩囦换浣旳PI
- **RPC**: `https://bsc-dataseed1.binance.org`
- **浠锋牸璁＄畻**: `ION_price = (reserve1 / reserve0) * BNB_price`

### 2. Binance
- **绔偣**: `https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT`
- **K绾?*: `https://api.binance.com/api/v3/klines?symbol=BNBUSDT&interval=1m`
- **娣卞害**: `https://api.binance.com/api/v3/depth?symbol=BNBUSDT&limit=20`

### 3. CMC
- **绔偣**: `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=ION`
- **API Key**: 鐢?`backend/.env` 鎻愪緵 (`CMC_API_KEY`)
- **Header**: `X-CMC_PRO_API_KEY: <key>`

### 4. GeckoTerminal
- **绔偣**: `https://api.geckoterminal.com/api/v2/networks/bsc/pools/0x6487725b383954e05cA56F3c2B93a104B3DD2C25/ohlcv/hour`
- **Header**: `Accept: application/json;version=20230203`
- **闄愰€?*: 30娆?鍒?鈫?鍚庣缂撳瓨TTL 30s

### 5. DexScreener
- **绔偣**: `https://api.dexscreener.com/latest/dex/pairs/bsc/0x6487725b383954e05cA56F3c2B93a104B3DD2C25`
- **鍝嶅簲**: 绉掔骇浠锋牸 + 24h缁熻 + 浜ゆ槗閲?+ FDV

### 6. ION Indexer v3
- **绔偣**: `https://api.mainnet.ice.io/indexer/v3/`
- **鏂囨。**: `https://api.mainnet.ice.io/indexer/v3/index.html`
- **35+绔偣**: accounts, blocks, transactions, messages, jettons, nft, dns, staking

## 鍚庣缂撳瓨鏋舵瀯

```
鍓嶇 鈫?GET /api/price/ion 鈫?鍚庣 鈫?妫€鏌ョ紦瀛?TTL 15s)
                                      鈹溾攢 鍛戒腑 鈫?杩斿洖
                                      鈹斺攢 鏈懡涓?鈫?PancakeSwap(getReserves) + Binance(BNB/USDT)
                                               鈫?鍐欏叆缂撳瓨
                                               鈫?杩斿洖
```

## 鍓嶇API瑙勮寖

| 绔偣 | 鏂规硶 | 杩斿洖 | 璇存槑 |
|------|------|------|------|
| `/api/price/ion` | GET | `{price, change24h, volume24h}` | ION缁煎悎浠锋牸 |
| `/api/price/bnb` | GET | `{price, change24h}` | BNB鍩哄噯浠?|
| `/api/klines/ion` | GET | `[{time, open, high, low, close, volume}]` | ION K绾?|
| `/api/market/ion` | GET | `{marketCap, rank, fdv, supply}` | ION甯傚€兼暟鎹?|
| `/api/pool/ion` | GET | `{reserve0, reserve1, tvl, volume24h}` | PancakeSwap姹犲瓙 |
| `/api/wallet/balance?address=0x...` | GET | `{bnb, ion, usdt, busd}` | 鐪熼摼涓婁綑棰?|
| `/api/wallet/nonce?address=0x...` | GET | `{nonce}` | 鐧诲綍绛惧悕鐢?|
| `/api/wallet/verify` | POST | `{token}` | JWT绛惧彂 |

## Seven EVM wallet detectors

EVM閽卞寘妫€娴嬭鐩?绉嶆敞鍏ユ彁渚涘晢锛屼紭鍏堜娇鐢‥IP-6963澶氶挶鍖呭彂鐜帮細

| 妫€娴嬪櫒 | 妫€娴嬪璞?| 浼樺厛绾?|
|--------|---------|--------|
| EIP-6963 | 澶氶挶鍖匬rovider鍙戠幇 | 馃敶 P0 |
| MetaMask | `window.ethereum.isMetaMask` | 馃敶 P0 |
| OKX Wallet | `window.okxwallet` | 馃煛 P1 |
| Trust Wallet | `window.trustwallet` | 馃煛 P1 |
| Coinbase | `window.coinbaseWalletExtension` | 馃煛 P1 |
| Binance Wallet | `window.BinanceChain` | 馃煛 P1 |
| Injected Generic | `window.ethereum` (fallback) | 馃煝 P2 |

鐪熷疄鏂囦欢: `frontend/src/lib/wallet/detectors.ts` (189琛? 7涓娴嬪櫒瀹屾暣瀹炵幇)

## 绂佹浜嬮」

- 鉂?绂佹鍓嶇鐩磋皟澶栭儴API 鈥?蹇呴』璧板悗绔紦瀛樺眰
- 鉂?绂佹mock浠锋牸鏁版嵁 鈥?蹇呴』鐪熷疄API/閾句笂鏌ヨ
- 鉂?绂佹纭紪鐮佹睜瀛愬湴鍧€浠ュ鐨勪换浣曟暟鎹?- 鉂?绂佹娉勯湶API Key 鈥?鎵€鏈夊瘑閽ヨ蛋.env
