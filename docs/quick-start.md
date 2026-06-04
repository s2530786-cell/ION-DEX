# Quick Start

> Get ION DEX running locally in 5 minutes.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Included with Node.js |
| Git | 2.40+ | [git-scm.com](https://git-scm.com) |

For contract development:
| Tool | Version | Install |
|------|---------|---------|
| Foundry (forge) | 1.7+ | [getfoundry.sh](https://getfoundry.sh) |
| TON CLI | 0.12+ | [ton.org/docs](https://ton.org/docs/) |

---

## 1. Clone and Install

```bash
git clone https://github.com/s2530786-cell/ION-DEX.git
cd ION-DEX

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## 2. Configure Environment

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Key environment variables:

```env
# ION Chain RPC
ION_RPC_URL=https://api.mainnet.ice.io/http/v2/jsonRPC
ION_INDEXER_URL=https://api.mainnet.ice.io/indexer/v3/

# BSC RPC (for bridge and BSC contracts)
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# Market Data
CMC_API_KEY=your_coinmarketcap_key

# Optional: AI Market Service
ARK_API_KEY=your_ark_api_key
```

---

## 3. Start Development Server

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 4. Connect a Wallet

### ION Chain Wallets
- **Online+ Wallet** — ION ecosystem native wallet.
- **ION Wallet** — Chrome/Google browser extension.

### EVM Wallets (for BSC)
- **MetaMask** — Add BSC network in settings.
- **OKX Wallet** — Built-in BSC support.
- **Bitget Wallet** — Built-in BSC support.

---

## 5. Run Your First Swap

Using the SDK:

```typescript
import { IONDEX } from '@ion-dex/sdk';

const client = new IONDEX({
  network: 'mainnet',
  rpc: process.env.ION_RPC_URL,
});

// Get a quote
const quote = await client.swap.getQuote({
  fromToken: 'ION',
  toToken: 'BNB',
  amount: '1000',
  slippage: 0.5,
});

console.log('You would receive:', quote.outputAmount, 'BNB');
```

Or use the frontend at `http://localhost:5173/swap`.

---

## Contract Development

### Build Contracts

```bash
# ION FunC contracts
cd contracts/ion
npm run build

# BSC Solidity contracts
cd contracts/bsc
forge build
```

### Run Tests

```bash
# ION contract tests
cd contracts/ion
npm test

# BSC contract tests
cd contracts/bsc
forge test -vvv

# Security stress tests (1000 rounds required)
forge test --match-contract SecurityAudit -vvv --iterations 1000
```

### Deploy to Testnet

```bash
# ION testnet
cd contracts/ion
npm run deploy:testnet

# BSC testnet
cd contracts/bsc
forge script script/Deploy.s.sol --network bscTestnet
```

See [Testnet Deploy Checklist](./26-ion-testnet-deploy-checklist.md) for full deployment procedure.

---

## Project Structure

```
ION-DEX/
├── frontend/          # React + Vite + Tailwind frontend
├── contracts/
│   ├── ion/           # FunC contracts for ION Mainnet
│   └── bsc/           # Solidity contracts for BSC
├── backend/           # API services and workers
├── docs/              # Documentation
├── scripts/           # Utility and deployment scripts
└── tools/             # Development tools
```

---

## Common Issues

### "Cannot connect to ION RPC"
- Ensure you have network access to `api.mainnet.ice.io`.
- If behind a firewall, configure HTTP proxy:
  ```bash
  export HTTP_PROXY=http://127.0.0.1:7890
  export HTTPS_PROXY=http://127.0.0.1:7890
  ```

### "Wallet not detected"
- Install the wallet browser extension.
- Refresh the page after installation.
- Check that the wallet is connected to the correct network.

### "Build fails with FunC errors"
- Ensure TON CLI is installed and in your PATH.
- Check that contract dependencies are installed: `npm install` in `contracts/ion/`.

---

## Next Steps

- [API Overview](./api-overview.md) — Integrate with ION DEX APIs.
- [Contracts Overview](./contracts-overview.md) — Understand contract architecture.
- [SDK Overview](./sdk-overview.md) — Full SDK reference.
- [Technical Architecture](./03-technical-architecture.md) — Deep dive into system design.

---

Return to [Developer Index](./developer-index.md) | [README](../README.md)