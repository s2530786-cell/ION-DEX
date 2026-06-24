# 🌌 ION DEX — Full-Stack Web3 Trading & Ecosystem Portal

**ION DEX** is the trading, identity, staking, bridge, and asset-management entry point for the [Ice Open Network](https://ice.io). Built as a professional-grade Web3 portal with AMM liquidity, cross-chain bridge, ION DNS domains, ION Identity, AI market intelligence, and transparent treasury operations.

[![Contracts](https://img.shields.io/badge/contracts-101-blue)](./contracts/)
[![Forge](https://img.shields.io/badge/forge-build-passing-brightgreen)](./contracts/)
[![Security](https://img.shields.io/badge/security-audit%20100%2B%20rounds-green)](./audits/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 💱 **Swap** | Market swap for ION pairs (ION/BNB + more). Real-time quotes, slippage control, MEV protection. |
| 📊 **Trade** | Professional K-line charts, limit orders, depth visualization, order history. |
| 🏦 **Pool** | Add/remove liquidity, LP positions, fee revenue tracking, impermanent-loss estimation. |
| 🔒 **Stake** | Official staking, DEX staking, LP staking. Flexible & locked terms with configurable APY. |
| 🔥 **Burn** | Dual-chain burn tracking (BSC + ION Chain). Real-time burn analytics and deflation metrics. |
| 🌉 **Bridge** | ION ↔ BSC cross-chain transfers. Status tracking, relay validation, gas estimation. |
| 🌐 **Domain** | .ion domain search, resolve, register, transfer, marketplace. |
| 🆔 **Identity** | ION ID / KYC Pass. Privacy-preserving credential checks and on-chain reputation. |
| 🤖 **AI Market** | On-chain AI analysis, whale tracking, risk scoring, strategy suggestions. |
| 💰 **Treasury** | Fee distribution, staking rewards, community allocation, reserve transparency. |
| ⚙️ **Grid** | On-chain spot grid trading strategies with keeper-based execution. |

## 🏗️ Architecture

```
Frontend (React + Vite + Tailwind + Lightweight Charts)
           │
    API Gateway (Routing, rate-limiting, auth)
           │
    Backend Services (14 microservices)
           │
    ┌──────┴──────┐
    │             │
BSC Contracts   ION Chain
(Solidity)      (FunC)
```

- **Frontend**: 16 pages, responsive desktop/tablet/mobile, dark cyberpunk theme
- **Backend**: 14 microservices (market, indexer, order, keeper, oracle, bridge, domain, identity, AI, treasury, burn, liquidity-mine, data-feed, notification)
- **Contracts**: 101 unique contracts/interfaces, Solidity 0.8.24 for BSC, FunC for ION Chain
- **Build**: Forge (Solidity) + Blueprint (FunC), zero errors, zero warnings

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- Foundry (forge + cast)
- Bun or npm

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### Contracts (BSC)

```bash
cd contracts
forge build        # compiles all Solidity contracts
forge test         # runs test suite
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## 📁 Project Structure

```
ion-dex-nuke/
├── contracts/          # Solidity contracts (BSC) + FunC contracts (ION Chain)
│   ├── bsc/            # BSC: Swap, Pool, Bridge, Stake, Vault, FeeReceiver, OrderBook
│   ├── ion/            # ION Chain: native contracts
│   ├── script/         # Forge deploy scripts
│   └── test/           # Test suites (unit + stress + security)
├── frontend/           # React + Vite + Tailwind frontend
├── backend/            # Node.js microservices (14 services)
├── scripts/            # DevOps, CI/CD, deploy, pipeline automation
├── docker/             # Docker Compose for local full-stack
├── audits/             # Security audit reports (100+ rounds)
├── docs/               # Detailed documentation (20+ docs)
└── docs-site/          # Auto-generated documentation site
```

## 🔐 Security

- **100+ rounds** of security testing across 10 attack vectors
- Reentrancy, flash loans, sandwich attacks, oracle manipulation, access control, integer overflow, DoS, fake token, timestamp manipulation, quantum resistance
- See [audits/](./audits/) for full reports
- See [docs/23-security-audit-and-stress-sandbox.md](./docs/23-security-audit-and-stress-sandbox.md) for methodology

## 📖 Documentation

Full documentation in [docs/](./docs/):

| Doc | Topic |
|-----|-------|
| [00-project-overview](./docs/00-project-overview.md) | Product vision & modules |
| [01-official-addresses](./docs/01-official-addresses-and-assumptions.md) | Contract addresses & assumptions |
| [02-tokenomics](./docs/02-tokenomics-and-fees.md) | Tokenomics & fee structure |
| [03-architecture](./docs/03-technical-architecture.md) | Technical architecture deep-dive |
| [04-roadmap](./docs/04-development-roadmap.md) | Development roadmap |
| [09-reference-architecture](./docs/09-reference-architecture.md) | Reference implementation |
| [23-security](./docs/23-security-audit-and-stress-sandbox.md) | Security audit methodology |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Lightweight Charts, ethers.js v6 |
| BSC Contracts | Solidity 0.8.24, Foundry (forge/cast), OpenZeppelin |
| ION Contracts | FunC, Blueprint |
| Backend | Node.js, Express, WebSocket, Redis, PostgreSQL |
| Infrastructure | Docker, Nginx, GitHub Actions |
| Security | Slither, Mythril, Echidna, Certora (planned) |

## 📝 License

MIT — see [LICENSE](./LICENSE) for details.

---

**Built for the ION ecosystem.** Not just a DEX — a complete Web3 trading and identity portal.
