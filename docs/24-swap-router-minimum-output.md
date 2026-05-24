# Swap router minimum-output enforcement

## Off-chain authority

`backend/src/lib/minimum-output.ts` defines the canonical formula:

1. `protocolFeeUnits = floor(grossOutput * protocolFeeBps / 10000)` (default **25 bps**)
2. `estimatedOutputUnits = grossOutput - protocolFeeUnits`
3. `minimumOutputUnits = floor(estimatedOutput * (10000 - slippageBps) / 10000)`

`backend/src/services/quotes.ts` and `GET /api/trade/quote` consume this module. Frontend Swap displays `minimumReceived` from the API.

## On-chain authority

`contracts/bsc/IonSwapRouter.sol`:

- `swapExactIn(pool, amountIn, amountOutMinimum, recipient)` calls `pool.swapExactIn` and **reverts `IonDexMinOutput`** if `amountOut < amountOutMinimum`.
- Pool implementations must return the real output; router never accepts less than the user-approved floor.

## Verification

```text
cd backend && npm run build && node --test dist/tests/minimum-output.test.js
node scripts/verify-contracts.mjs
cd contracts && forge test
```

## Integration checklist

- [ ] Wire router address into swap transaction builder once AMM pool is deployed.
- [ ] Pass `quote.minimumReceivedUnits` as `amountOutMinimum` in calldata.
- [ ] Add invariant/fuzz tests on live pool + router pair.
