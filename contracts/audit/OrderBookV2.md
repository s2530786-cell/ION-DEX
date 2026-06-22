# OrderBookV2 Security Audit

## Scope

- File: `contracts/bsc/OrderBookV2.sol`
- Type: quote-token custody order book stub
- Inheritance: `ReentrancyGuard`

## Follow-up finding on 2026-06-22

- The contract custodizes only `quoteToken`.
- The previous API still exposed sell-order placement and matching paths that require base-asset custody and valid delivery accounting.
- That means the old sell-side / match logic was not just incomplete; it was unsafe.

## Safe closure applied

1. `placeOrder(false, ...)` now reverts with `IonDexUnsupportedOrderSide()`.
2. `matchOrder(...)` now reverts with `IonDexSettlementDisabled()`.
3. Buy-side quote custody, cancellation refunds, and deadline checks remain intact.

## 10 attack-surface status

1. Reentrancy: protected by `nonReentrant`.
2. Flash-loan manipulation: not price-oracle driven.
3. Sandwich / MEV: residual visibility risk remains because orders are on-chain.
4. Oracle manipulation: not oracle-driven.
5. Access control: users can only affect their own custody balance and orders.
6. Integer overflow: Solidity `0.8.24`.
7. DoS: `getUserOrders` is linear but bounded by order growth expectations.
8. Fake-token attack: `quoteToken` is fixed at deploy.
9. Timestamp abuse: deadline checks remain.
10. Signature / replay: not applicable.

## Verification

- Added/updated tests:
  - `contracts/test/ContractAuditRemediations.t.sol`
  - `contracts/test/SecurityMatrixV3.t.sol`
- Command:
  - `D:\openclaw-tools\foundry\bin\forge.exe test --root contracts --no-cache`
- Result:
  - `74 tests passed, 0 failed, 0 skipped`

## Rating

- Current rating: guarded / safe-closure
- Status note: this is not a production-ready matching engine until base-asset custody, settlement, events, and invariant coverage are implemented.
