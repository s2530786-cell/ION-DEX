# DexSwapV2 Security Audit

## Scope

- File: `contracts/bsc/DexSwapV2.sol`
- Type: CPAMM-style swap entrypoint with whitelist gating
- Inheritance: `ReentrancyGuard`

## Follow-up finding on 2026-06-22

- The previous implementation transferred `tokenIn` into `lpPool` but attempted to pay `tokenOut` from the router itself.
- That asset-flow model is invalid for a custody-based pool and can break swaps even when reserves exist.

## Fix

1. Added `ILiquidityPoolSettlement`.
2. Routed `tokenOut` payout through `LiquidityPool.payout(...)`.
3. Added zero-address guards for constructor, `setLpPool`, `setFeeReceiver`, and `setPoolWhitelist`.

## 10 attack-surface status

1. Reentrancy: low after `nonReentrant`; payout is delegated only after checks.
2. Flash-loan manipulation: residual economic risk only; `amountOutMinimum` remains enforced.
3. Sandwich / front-running: deadline and minimum output remain enforced.
4. Oracle manipulation: not oracle-driven.
5. Access control: owner-only admin functions.
6. Integer overflow: Solidity `0.8.24`.
7. DoS: no unbounded loops in hot path.
8. Fake-token attack: allowlist remains required.
9. Timestamp abuse: deadline-based only.
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

- Current rating: low risk
