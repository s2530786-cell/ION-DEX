# 2026-06-22 BSC Audit Round 1

## Scope

- `contracts/bsc/*.sol`
- `contracts/test/*.t.sol`
- Historical context from `contracts/ion/FIX_LOG.md` and existing security tests

## Audit progress check

- `contracts/audit/` did not exist before this round.
- Historical audit evidence was scattered outside the directory.
- This report consolidates the current state and this round's fixes.

## 10 attack surfaces reviewed

1. Reentrancy / callback ordering
2. Integer overflow / underflow / precision / rounding
3. Access control / owner / relayer / privileged writes
4. Replay / nonce / quorum / duplicate execution
5. Oracle freshness / manipulation / stale fallback
6. MEV / slippage / minimum output / user pricing guarantees
7. Token compatibility / optional return / false-return ERC20s
8. Bridge consistency / release semantics / relayer trust model
9. Event completeness / off-chain auditability
10. Gas / unbounded loops / operational DoS

## Findings

### Critical

1. Fixed: `contracts/bsc/BridgeRelay.sol`
   - Issue: Any single relayer could release funds immediately; `quorum` was declared but never enforced.
   - Impact: One compromised relayer could drain bridge escrow for any releasable position.
   - Fix:
     - added per-`nonce` attestation tracking
     - added duplicate-attestation rejection
     - release only after distinct relayer count reaches `quorum`
     - blocked relayer removal that would drop active set below quorum
   - Tests:
     - `testBridgeRelayRequiresDistinctQuorumAttestations`

2. Fixed: `contracts/bsc/Dividend.sol`
   - Issue: Any address could call `stake()` and mint arbitrary dividend shares without locking any real asset.
   - Impact: An attacker could dilute or fully steal future reward deposits.
   - Fix:
     - replaced public self-minting share flow with `stakeFor/unstakeFor`
     - gated share assignment behind `shareManager`
     - added explicit manager update control
   - Tests:
     - `testOnlyShareManagerCanAssignShares`
     - `testRewardDistributionUsesManagedShares`

### High

1. Fixed: `contracts/bsc/DexSwap.sol`
   - Issue: Swap output was transferred from `DexSwap` itself instead of the liquidity pool.
   - Impact: Swaps could revert or settle against the wrong inventory model.
   - Fix:
     - pool pair validation added
     - output now paid from `LiquidityPool.payout()`
     - reserves are read before the input transfer
   - Tests:
     - `testDexSwapPaysOutFromPoolAndUsesPreSwapReserves`

2. Fixed: `contracts/bsc/LiquidityPool.sol`
   - Issue: LP minting used post-deposit balances in the denominator.
   - Impact: Later LPs received systematically fewer shares than fair value.
   - Fix:
     - snapshot reserves and total supply before transfer-in
     - mint against pre-deposit reserves
     - add `onlyDex` payout path for swap settlement
   - Tests:
     - `testLiquidityPoolMintsAgainstPreDepositReserves`

### Medium

1. Fixed: `contracts/bsc/BatchTransfer.sol`
   - Issue: `batchNative()` never checked `msg.value == sum(amounts)`.
   - Impact: Extra native coin sent with the call became stuck in the contract.
   - Fix:
     - sum all requested transfers first
     - require exact value match
   - Tests:
     - `testBatchNativeRejectsExcessMsgValue`

2. Unfixed design risk: `contracts/bsc/NFTAuction.sol`
   - Issue: royalty amount is deducted from seller proceeds but no royalty recipient or withdrawal path exists.
   - Impact: royalty value remains trapped in the contract.
   - Reason not patched in this round:
     - fixing it safely requires a product-level decision on royalty recipient semantics and ABI expectations
   - Recommendation:
     - add explicit `royaltyRecipient` and tests before any deployment

3. Unfixed operational risk: `contracts/bsc/OrderBook.sol`
   - Issue: `getUserOrders()` does two full linear scans over all orders.
   - Impact: off-chain callers and RPC nodes can see degraded performance as order count grows.
   - Recommendation:
     - add per-user order index or paginated query model before production use

### Low / Non-production

1. `contracts/bsc/Burn.sol`
   - Marked `PREVIEW-ONLY`
   - Not a deployable production contract

2. `contracts/bsc/VaultLock.sol`
   - Marked `PREVIEW-ONLY`
   - Not a deployable production contract

## Contract-by-contract disposition

| Contract | Result |
|---|---|
| `AdminManager.sol` | Reviewed; basic owner/pause pattern acceptable |
| `BatchTransfer.sol` | Fixed |
| `BridgeRelay.sol` | Fixed |
| `BSCVault.sol` | Reviewed; no new issue found this round |
| `DexSwap.sol` | Fixed |
| `Dividend.sol` | Fixed |
| `DynamicBurnConfig.sol` | Reviewed; config invariants encoded |
| `FeeReceiver.sol` | Reviewed; ION-only fee path preserved |
| `FeeReceiverAdmin.sol` | Reviewed; still centralized for oracle/destination writes, treat as admin-risk surface |
| `IonOracle.sol` | Reviewed; single-source oracle remains a trust assumption |
| `IonProtocolFeeLib.sol` | Reviewed; fee collection path consistent with current token assumptions |
| `IonSwapRouter.sol` | Reviewed; minimum-output guard remains the safer user-facing path |
| `IonWrapper.sol` | Reviewed; custody/burn model consistent with tests |
| `LiquidityMine.sol` | Reviewed; no new issue found this round |
| `LiquidityPool.sol` | Fixed |
| `MockERC20.sol` | Test-only |
| `NFTAuction.sol` | Residual design issue recorded |
| `OrderBook.sol` | Residual operational issue recorded |
| `StakeReward.sol` | Reviewed; reward solvency still depends on funding ops |
| `TokenIssuer.sol` | Permissionless by design |
| `VaultLock.sol` | Preview-only, not production-safe |
| `Burn.sol` | Preview-only, not production-safe |

## Verification evidence

### Encoding

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-encoding.ps1 -Path contracts
```

Result:

- scanned `858` files
- all `UTF-8 without BOM`
- no `NUL` bytes

### Forge

Raw repo-wide command status:

```powershell
D:\openclaw-tools\foundry\bin\forge.exe test -C contracts
```

- Fails in this checkout because vendored upstream `contracts/lib/openzeppelin-contracts/` test/formal-verification trees reference missing external fixtures (`halmos-cheatcodes`, `erc4626-tests`, `fv/patched/...`).
- This is a repository layout issue, not a regression from this audit patch.

Project-owned test gate used for this round:

```powershell
D:\openclaw-tools\foundry\bin\forge.exe test --root contracts --match-path "test/*.t.sol" --no-match-path "lib/**" -vv
```

Result:

- `43 passed`
- `0 failed`
- includes new suites `AuditFixesTest` and `DividendTest`

## Residual risk

- `DexSwap.sol` still has no native `amountOutMinimum` parameter; safer user path remains `IonSwapRouter.sol`.
- `FeeReceiverAdmin.sol` privileged destination/oracle changes are not timelocked.
- `IonOracle.sol` remains single-source; stale fallback exists, but multi-source/TWAP hardening is still pending.
- Preview-only contracts must not be deployed as production surfaces.
