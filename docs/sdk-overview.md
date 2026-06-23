# SDK Overview

> JavaScript/TypeScript SDK for integrating with ION DEX.

## Installation

```bash
npm install @ion-dex/sdk
# or
yarn add @ion-dex/sdk
# or
pnpm add @ion-dex/sdk
```

---

## Quick Start

```typescript
import { IONDEX } from '@ion-dex/sdk';

// Initialize client
const client = new IONDEX({
  network: 'mainnet',
  rpc: 'https://api.mainnet.ice.io/http/v2/jsonRPC',
});

// Get market data
const ticker = await client.markets.getTicker('ION/BNB');
console.log(ticker.price); // "0.000139"

// Get swap quote
const quote = await client.swap.getQuote({
  fromToken: 'ION',
  toToken: 'BNB',
  amount: '1000',
});
console.log(quote.outputAmount); // "0.139"
console.log(quote.route); // [ION → WBNB]
```

---

## Core Modules

### Markets

```typescript
// List all trading pairs
const markets = await client.markets.list();

// Get pair details
const pair = await client.markets.get('ION/BNB');

// Get 24h ticker
const ticker = await client.markets.getTicker('ION/BNB');

// Get OHLCV candles
const candles = await client.markets.getCandles('ION/BNB', {
  interval: '1h',
  limit: 100,
});
```

### Swap

```typescript
// Get swap quote
const quote = await client.swap.getQuote({
  fromToken: 'ION',
  toToken: 'BNB',
  amount: '1000',
  slippage: 0.5, // 0.5%
});

// Execute swap (requires wallet connection)
const tx = await client.swap.execute({
  quote: quote,
  wallet: connectedWallet,
  onConfirm: (txHash) => console.log('Confirmed:', txHash),
  onError: (error) => console.error('Failed:', error),
});
```

### Liquidity

```typescript
// List pools
const pools = await client.pools.list();

// Get pool details
const pool = await client.pools.get('ION/BNB');
console.log(pool.tvl, pool.apr, pool.reserves);

// Add liquidity (requires wallet)
const addTx = await client.pools.addLiquidity({
  pool: 'ION/BNB',
  amounts: { ION: '1000', BNB: '0.139' },
  wallet: connectedWallet,
});

// Remove liquidity
const removeTx = await client.pools.removeLiquidity({
  pool: 'ION/BNB',
  lpTokenAmount: '500',
  wallet: connectedWallet,
});
```

### Grid Trading

```typescript
// Create grid strategy
const grid = await client.grid.create({
  pair: 'ION/BNB',
  lowerPrice: '0.000120',
  upperPrice: '0.000160',
  grids: 10,
  amount: '10000', // Total ION amount
  wallet: connectedWallet,
});

// Monitor grid performance
const performance = await client.grid.getPerformance(grid.id);
console.log(performance.totalProfit, performance.executedGrids);

// Stop grid
await client.grid.stop(grid.id, connectedWallet);
```

### Staking

```typescript
// List staking pools
const stakingPools = await client.staking.list();

// Stake ION
const stakeTx = await client.staking.stake({
  poolId: 'flexible', // or '7d', '30d', '90d', '180d', '365d'
  amount: '1000',
  wallet: connectedWallet,
});

// Get staking positions
const positions = await client.staking.getPositions(walletAddress);

// Claim rewards
await client.staking.claimRewards({
  positionId: 'xxx',
  wallet: connectedWallet,
});
```

### Bridge

```typescript
// Initiate bridge transfer
const bridgeTx = await client.bridge.initiate({
  fromChain: 'ION',
  toChain: 'BSC',
  amount: '1000',
  recipient: targetAddress,
  wallet: connectedWallet,
});

// Track transfer status
const status = await client.bridge.getStatus(bridgeTx.id);
console.log(status.status); // 'pending', 'confirming', 'completed', 'failed'
```

---

## Wallet Integration

The SDK supports multiple wallet adapters:

```typescript
import { IONDEX, WalletAdapter } from '@ion-dex/sdk';

// ION Browser Wallet
const ionWallet = new WalletAdapter.IONBrowser();

// Online+ Wallet
const onlinePlusWallet = new WalletAdapter.OnlinePlus();

// MetaMask (for BSC)
const metaMaskWallet = new WalletAdapter.MetaMask();

// Connect wallet
await ionWallet.connect();

// Pass to client
const client = new IONDEX({ wallet: ionWallet });
```

---

## WebSocket Streaming

Real-time data updates:

```typescript
// Subscribe to price updates
client.ws.subscribe('ticker:ION/BNB', (data) => {
  console.log('Price update:', data.price);
});

// Subscribe to trades
client.ws.subscribe('trades:ION/BNB', (trade) => {
  console.log('New trade:', trade.price, trade.amount);
});

// Subscribe to burn events
client.ws.subscribe('burn', (event) => {
  console.log('Burn event:', event.amount, 'ION');
});

// Unsubscribe
client.ws.unsubscribe('ticker:ION/BNB');
```

---

## Error Handling

```typescript
import { IONDEXError } from '@ion-dex/sdk';

try {
  const quote = await client.swap.getQuote({ ... });
} catch (error) {
  if (error instanceof IONDEXError) {
    console.log('Code:', error.code);
    console.log('Message:', error.message);
    console.log('Retry:', error.retryable);
  }
}
```

Common error codes:
- `INSUFFICIENT_LIQUIDITY` — Not enough liquidity in pool
- `SLIPPAGE_EXCEEDED` — Price moved beyond slippage tolerance
- `INSUFFICIENT_BALANCE` — User has insufficient token balance
- `WALLET_NOT_CONNECTED` — Wallet connection required

---

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import type {
  Market,
  Ticker,
  Quote,
  Pool,
  StakingPosition,
  GridStrategy,
  BridgeTransfer,
} from '@ion-dex/sdk';
```

---

## Browser Compatibility

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## Node.js Compatibility

- Node.js 18+
- Supports CommonJS and ESM

---

Return to [Developer Index](./developer-index.md) | [API Overview](./api-overview.md) | [Quick Start](./quick-start.md)