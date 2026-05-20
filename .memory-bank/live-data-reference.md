# Live Data Reference

This is the current data authority for ION DEX frontend, backend, and wallet work. Read before implementing any UI that displays product values.

## Market Data

- CoinMarketCap base URL: `https://pro-api.coinmarketcap.com`
- ION CMC ID: `27650`
- ION slug: `ice-decentralized-future`
- API key location: `backend/.env` as `CMC_API_KEY`
- Frontend must access CMC only through backend.
- If CMC is unavailable, use reviewed chain-backed fallback:
  - PancakeSwap V2 ION/USDT pair: `0x1610eDdFE8CFf46913D2c3A9a2AFE20b0aA4A22E`
  - PancakeSwap V2 router: `0x10ED43C718714eb63d5aA57B78B54704E256024E`
  - PancakeSwap V2 factory: `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73`

## BSC Burn And Token Data

- BSC ION token: `0xe1ab61f7b093435204df32f5b3a405de55445ea8`
- BSC burn address: `0x000000000000000000000000000000000000dEaD`
- BSC RPC: `https://bsc-dataseed.binance.org/`
- BSC chain ID: `56`
- Burn query path: token `balanceOf(deadAddress)` plus Transfer events.

## ION Chain Data

- ION HTTP API: `https://api.mainnet.ice.io/http/v2/`
- ION JSON RPC: `https://api.mainnet.ice.io/http/v2/jsonRPC`
- ION Indexer v3: `https://api.mainnet.ice.io/indexer/v3/`
- ION Explorer: `https://explorer.ice.io`
- ION chain analytics must come from indexer / official HTTP API.
- ION burn accounting should use chain value-flow burn semantics where applicable, not an EVM-style dead address assumption.

## Domain Data

- Product domain: `swap.ion`
- DNS registry surface: `dns.ice.io`
- Known owner record from historical memory: `UQCMEABQ9m41v7nWv0fiC_LGyf0svOvt_GbBQXOIRwJX8LiA`
- `.ion` resolution must use ION-native DNS / Indexer records.
- Domain transfer must re-resolve immediately before signing.

## Wallet Data

Seven EVM wallet detectors from historical memory:

- MetaMask: `window.ethereum.isMetaMask`
- Binance Web3: `window.BinanceChain`
- OKX Web3: `window.okxwallet`
- Bitget Web3: `window.bitkeep.ethereum`
- Trust Wallet: `window.trustwallet`
- Coinbase Wallet: `window.coinbaseWalletExtension`
- Rabby: `window.rabby`

ION-native wallet injection (verified against official repos + ion-gateway SDK):

- **Online+ / ION Chrome Wallet** (`ice-blockchain/ion-chrome-wallet`): `window.ionmask.ionconnect` (TonConnect bridge), legacy `window.ion`, ready event `ionready`. ion-gateway `jsBridgeKey`: `ionmask`.
- **ION Browser Wallet** (`ice-blockchain/ion-browser-wallet`): `window.tonwallet.tonconnect` (legacy field name; ion-gateway expects `ionconnect` when rebranded), legacy `window.ton`, ready event `tonready`. ion-gateway `jsBridgeKey`: `tonwallet`.
- **Detection contract** (`ice-blockchain/ion-gateway` `InjectedProvider`): `injectedWalletKey in window` and `window[key].ionconnect` with `walletInfo` metadata. Profile Hub also accepts legacy `tonconnect` on `tonwallet`.
- **Connection**: TonConnect `restoreConnection` then `connect` with `manifestUrl` → `/ionconnect-manifest.json`, item `ton_addr`. Chain IDs: `-239` mainnet, `-3` testnet.
- **Do not use** guessed globals `window.ionWallet`, `window.iceWallet`, or `window.ionBrowserWallet` — not present in official sources.
- WalletConnect / TonConnect remote: `@ion-gateway/sdk` + `@ion-gateway/ui-react` (`TonConnectUIProvider`, `useTonConnectModal` QR modal); fallback `universalLink` tab when modal bridge unavailable.

## Environment Variables

```text
ION_DATA_MODE=auto
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_CHAIN_ID=56
BSC_ION_TOKEN_ADDRESS=0xe1ab61f7b093435204df32f5b3a405de55445ea8
ION_API_BASE_URL=https://api.mainnet.ice.io/http/v2/
ION_HTTP_TIMEOUT_MS=12000
CMC_API_BASE_URL=https://pro-api.coinmarketcap.com
CMC_API_KEY=
```

## Backend Mapping

- Markets: `backend/src/services/live/markets-live.ts` -> CMC / PancakeSwap
- Burn: `backend/src/services/live/burn-live.ts` -> BSC RPC + ION indexer
- Config/staking surface: `backend/src/services/live/config-live.ts` -> ION APIs / reviewed sources
- CMC upstream: `backend/src/upstream/cmc.ts`
- BSC upstream: `backend/src/upstream/bsc-rpc.ts`
- ION upstream: `backend/src/upstream/ion-api.ts`

## Hard Data Rules

- No empty data, fake values, fake lists, or pseudo-code product UI.
- If a key or endpoint is missing, record the blocker and do not present the UI as complete.
- All financial values need source, timestamp, stale flag, and request ID where possible.
