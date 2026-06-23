# Contracts Overview

> Smart contract architecture for ION DEX across ION Mainnet and BSC.

## Dual-Chain Architecture

ION DEX operates across two chains:

| Chain | Role | Language | Runtime |
|-------|------|----------|---------|
| **ION Mainnet** | Primary DEX, staking, domain, identity | FunC / Tact | TON-compatible VM |
| **BSC** | Bridge vault, fee vault, secondary liquidity | Solidity | EVM |

---

## ION Mainnet Contracts

### Core Trading

| Contract | Purpose | Key Functions |
|----------|---------|---------------|
| `DexRouter.fc` | Swap routing, fee collection | `swap()`, `route()`, `collectFees()` |
| `IonAmmPool.fc` | AMM liquidity pools | `addLiquidity()`, `removeLiquidity()`, `swapInternal()` |
| `LimitOrderBook.fc` | Limit order management | `placeOrder()`, `cancelOrder()`, `executeOrder()` |
| `GridStrategyVault.fc` | Automated grid strategies | `createGrid()`, `stopGrid()`, `executeStep()` |

### Fee & Economics

| Contract | Purpose | Key Functions |
|----------|---------|---------------|
| `FeeDistributor.fc` | Fee routing to burn/staking/treasury | `distribute()`, `burnPortion()`, `stakePortion()` |
| `StakingPool.fc` | Staking positions and rewards | `stake()`, `unstake()`, `claimRewards()`, `compound()` |
| `Treasury.fc` | Platform treasury management | `deposit()`, `allocate()`, `report()` |

### Infrastructure

| Contract | Purpose | Key Functions |
|----------|---------|---------------|
| `OracleAdapter.fc` | Price feed aggregation | `updatePrice()`, `getPrice()`, `verifyHealth()` |
| `DomainMarketplace.fc` | .ion domain trading | `listDomain()`, `bid()`, `transfer()`, `resolve()` |
| `DomainResolverAdapter.fc` | Domain → address resolution | `resolve()`, `setRecord()`, `verify()` |

### Security Features

- **Fee burn**: 50% of all fees sent to `0x000000000000000000000000000000000000dEaD` — permanently unrecoverable.
- **Staking lock**: Flexible (8%) → 365-day (30%) APY tiers with time-locked withdrawals.
- **Dynamic burn**: Bear market → increased burn efficiency; Bull market → increased staking.
- **Master revenue share**: 25% priority allocation, paid before any other distribution.

---

## BSC Contracts

| Contract | Purpose | Key Functions |
|----------|---------|---------------|
| `BSCVault.sol` | Cross-chain asset custody | `deposit()`, `withdraw()`, `verifyBridge()` |
| `BridgeVerifier.sol` | Bridge transfer verification | `verifyTransfer()`, `confirmReceipt()`, `refund()` |
| `BSCFeeVault.sol` | BSC-side fee collection and routing | `collectFees()`, `routeToBurn()`, `routeToTreasury()` |

### BSC Integration Details

- **Primary pair**: PancakeSwap V3 ION/WBNB (`0x6487725b383954e05cA56F3c2B93a104B3DD2C25`)
- **Wrapped ION (wION)**: BSC-bridged representation of ION for EVM compatibility.
- **Bridge mechanism**: Source-chain monitoring → confirmation counting → validator signatures → target-chain submission → refund/retry state machine.

---

## Contract Addresses

> Contract addresses will be published upon testnet deployment. All addresses will be verifiable through the [ION Explorer](https://explorer.ice.io/) and BSC scan.

### Deployment Verification Checklist

Each contract deployment will include:
1. **Transaction hash** — verifiable on Explorer.
2. **Contract address** — published in README and docs.
3. **Source code** — available in repository under `contracts/`.
4. **ABI** — available in `contracts/abi/` directory.
5. **Audit report** — published before mainnet activation.

---

## Interaction Guide

### For DApp Developers

```typescript
// Example: Swap via ION DEX Router
import { IONDEX } from '@ion-dex/sdk';

const client = new IONDEX({
  network: 'mainnet',
  rpc: 'https://api.mainnet.ice.io/http/v2/jsonRPC',
});

const result = await client.swap({
  fromToken: 'ION',
  toToken: 'BNB',
  amount: '1000',
  slippage: 0.5,
});
```

### For Contract Interaction

```typescript
// Example: Direct contract call
const pool = await client.getPool('ION/BNB');
const reserves = await pool.getReserves();
const apr = await pool.getAPR();
```

See [SDK Overview](./sdk-overview.md) for complete integration guide.

---

## Security Baseline

- Contracts must not depend on frontend validation.
- User actions include simulation before signature when possible.
- Bridge does not use a single relayer trust model.
- Oracle does not rely on a single price source.
- Admin actions are logged and timelocked (48h timelock, 3/5 multisig).
- Domain transfers resolve and verify the final address before signing.

---

Return to [Developer Index](./developer-index.md) | [API Overview](./api-overview.md) | [Technical Architecture](./03-technical-architecture.md)