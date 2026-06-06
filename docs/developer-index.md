# Developer Index

> Everything a developer needs to build on ION DEX.

## Why Build Here

- **28-chain aggregation surface** — build once, reach users across 28 chains.
- **Payment rails** — not just swap, a full settlement infrastructure.
- **Identity layer** — ION Identity runs across the entire ecosystem.
- **AI modules** — arbitration, sentinel defense, market analysis.
- **Still expanding** — early builders get leverage and visibility before the ecosystem crowds.

---

## Quick Links

| Resource | Description |
|----------|-------------|
| [API Overview](./api-overview.md) | REST and WebSocket API endpoints, authentication, rate limits |
| [Contracts Overview](./contracts-overview.md) | Smart contract addresses, ABIs, and interaction guides |
| [SDK Overview](./sdk-overview.md) | JavaScript/TypeScript SDK for frontend and backend integration |
| [Quick Start](./quick-start.md) | Get running in 5 minutes |

---

## Architecture Overview

ION DEX is a multi-layer system:

```
Frontend (React + Vite + Tailwind)
  → API Gateway
    → Market Service / Indexer API / Order Service / Grid Service
    → Staking Service / Burn Service / Bridge Service
    → Domain Service / Identity Service / AI Market Service
    → Treasury Service / Notification Service / Admin Service

Workers
  → ION Indexer / BSC Indexer / Domain Indexer
  → Oracle Worker / Keeper Worker / Bridge Worker / AI Sentinel

Contracts
  → ION Mainnet (FunC) + BSC (Solidity)

Storage
  → PostgreSQL + Redis + Object Storage
```

See [Technical Architecture](./03-technical-architecture.md) for full details.

---

## Key Engineering Principles

1. **User funds are always controlled by user wallets.** Backend services never sign asset transactions.
2. **Chain state is the source of truth.** Backend/indexer data is a cache and analytics layer.
3. **High-risk admin operations require multisig and timelock.**
4. **AI output is advisory only** — never represented as guaranteed investment advice.
5. **No production release without audits, testnet campaigns, monitoring, and incident playbooks.**

---

## Economic Guardrails

Developers integrating with ION DEX need to understand the platform's non-negotiable economic rules:

- **DEX swap fee:** `0.3%`
- **Pool creation fee:** `0.1%`
- **Platform transaction fee:** `0.5%` for commerce, delivery, and similar settlement flows
- **Burn rule:** `50%` of applicable platform fees are permanently burned to the public burn address
- **Master allocation:** `25%` of platform revenue is reserved as a permanent first-priority builder allocation

These values are not UI copy. They are platform-level constraints that affect settlement logic, fee routing, treasury accounting, analytics, and SDK/API expectations.

---

## Integration Constraints

When building on ION DEX:

- **Do not hardcode alternative fee assumptions.** Integrations should respect the canonical `0.3%`, `0.1%`, and `0.5%` platform rules.
- **Burn-aware accounting is required.** Fee reporting, treasury views, and settlement callbacks should treat the burn path as first-class logic.
- **Revenue logic must stay privacy-safe.** Public docs and developer integrations may describe fee routing and permanent allocation rules, but must not expose private beneficiary identity details, wallet ownership, or sensitive payout metadata.
- **Explorer-verifiable outcomes matter.** If an integration reports settlement, burn, or payout state, it should map back to auditable system records or chain-visible proof.

---

## ION Chain Integration

### RPC Endpoints
| Endpoint | URL |
|----------|-----|
| HTTP v2 API | `https://api.mainnet.ice.io/http/v2/` |
| JSON RPC | `https://api.mainnet.ice.io/http/v2/jsonRPC` |
| Indexer v3 | `https://api.mainnet.ice.io/indexer/v3/` |
| Send Boc | `POST /http/v2/sendBoc` with `{"boc": "base64"}` |

### Wallet Support
- **Online+ Wallet** — ION native ecosystem wallet (priority).
- **ION Wallet** — Chrome/Google browser extension wallet.
- **MetaMask / OKX Wallet / Bitget Wallet** — external EVM wallet compatibility.

### Official References
- [Explorer](https://explorer.ice.io/) — on-chain verification.
- [GitBook](https://docs.ice.io) — protocol documentation.
- [GitHub](https://github.com/ice-blockchain/ion) — full node source (C++).

---

## Development Setup

```bash
# Clone the repository
git clone https://github.com/s2530786-cell/ION-DEX.git
cd ION-DEX

# Install dependencies
npm install

# Start development server
npm run dev
```

See [Quick Start](./quick-start.md) for detailed setup instructions.

---

## Contributing

ION DEX is independently developed by Master. External contributions are welcome for:
- Bug fixes and security improvements.
- Documentation and translation.
- Feature proposals (via GitHub Issues).

All contributions require review before merge. Security-sensitive changes require audit.

---

Return to [README](../README.md) | [API Overview](./api-overview.md) | [Contracts Overview](./contracts-overview.md) | [SDK Overview](./sdk-overview.md)