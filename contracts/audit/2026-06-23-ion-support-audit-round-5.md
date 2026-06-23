# 2026-06-23 ION Support Audit Round 5

## Scope

- `contracts/ion/FeeDistributor.fc`
- Review-only pass on:
  - `contracts/ion/BridgeInbox.fc`
  - `contracts/ion/lp_account.fc`
  - `contracts/ion/pool.fc`
  - `contracts/ion/sandwich.fc`
- Cross-check pass on previously unarchived / support-only BSC contracts:
  - `contracts/bsc/AdminManager.sol`
  - `contracts/bsc/DynamicBurnConfig.sol`
  - `contracts/bsc/FeeReceiverAdmin.sol` *(DELETED 2026-06-24; FeeReceiver.sol now covers all fee admin)*
  - `contracts/bsc/IonProtocolFeeLib.sol`
  - `contracts/bsc/LiquidityMine.sol`
  - `contracts/bsc/StakeReward.sol`
  - `contracts/bsc/TokenIssuer.sol`
  - `contracts/bsc/Burn.sol`
  - `contracts/bsc/VaultLock.sol`

## Why this round existed

- `contracts/audit/README.md` already covered the main BSC / ION / root-level FunC sets, but some support contracts were only mentioned implicitly in historical notes and did not yet have an explicit review round in `contracts/audit/`.
- A fresh 10-surface review of the remaining ION support contracts found a real native-value accounting flaw in `FeeDistributor.fc`.

## 10 attack surfaces reviewed

1. Reentrancy / callback ordering
2. Integer overflow / underflow / precision / rounding
3. Access control / privileged sender checks
4. Replay / duplicate execution / nonce handling
5. Oracle / timestamp / stale-state assumptions
6. MEV / slippage / front-running protections
7. Token / attached-value / native-balance message semantics
8. Bridge / cross-contract state consistency
9. Event / message auditability and operator recovery
10. Gas / unbounded loops / operational DoS

## Findings

### Critical

1. Fixed: `contracts/ion/FeeDistributor.fc`
   - Issue: `deposit_ion_fee` trusted the body `amount` field and increased `storage::accrued_fees` without requiring the incoming internal message to actually attach the same amount of native ION.
   - Impact: any authorized sender (`router` / `owner`) could overstate accrued fees versus real contract balance, then a later `distribute_ion_fee` or pool-driven `distribute_fees` call would route unrelated contract reserves to burn / master / rewards destinations.
   - Fix:
     - added `ctx::value() >= amount` enforcement before fee accrual
     - unified accrual logic into `handle_credit_ion_fee(amount)`
     - added explicit support for `op::distribute_fees` so the current `pool.fc -> FeeDistributor.fc` fee path credits and distributes the attached native ION atomically instead of falling through to `wrong_op`

### Medium

1. Review-only residual design risk: `contracts/ion/lp_account.fc`, `contracts/ion/pool.fc`, `contracts/ion/sandwich.fc`
   - Issue: these contracts still model swap / add-liquidity flows as message-driven accounting and callbacks; they do not yet prove real Jetton/native asset custody in the same way the production BSC side does.
   - Impact: they remain compile-safe but are not production-ready AMM custody contracts.
   - Reason not hot-patched in this round:
     - safe remediation requires a broader asset-plumbing redesign against official ION token / wallet patterns rather than a local one-line guard
   - Recommendation:
     - complete a dedicated custody/value-flow redesign and FunC integration test harness before any production deployment claim

2. Review-only residual centralization risk: `contracts/ion/BridgeInbox.fc`
   - Issue: relayer set / quorum management remains owner-controlled.
   - Impact: privileged-key compromise remains catastrophic even though the quorum path itself is intact.
   - Recommendation:
     - move relayer governance to multisig + timelock before production use

3. DELETED CONTRACT (2026-06-24) — `contracts/bsc/FeeReceiverAdmin.sol` has been deleted; FeeReceiver.sol now covers all fee admin. Original review:
   - Issue: destination / oracle changes remain owner-controlled and only threshold changes are timelocked.
   - Impact: admin compromise can still redirect fee flow or swap in a bad oracle.
   - Recommendation:
     - *(OBSOLETE — FeeReceiver.sol has absorbed all admin functionality)*

## Contract-by-contract disposition

| Contract | Result |
|---|---|
| `contracts/ion/FeeDistributor.fc` | Fixed |
| `contracts/ion/BridgeInbox.fc` | Reviewed; no new code vulnerability found this round |
| `contracts/ion/lp_account.fc` | Reviewed; residual design risk recorded |
| `contracts/ion/pool.fc` | Reviewed; residual design risk recorded |
| `contracts/ion/sandwich.fc` | Reviewed; residual design risk recorded |
| `contracts/bsc/AdminManager.sol` | Reviewed; no new vulnerability found |
| `contracts/bsc/DynamicBurnConfig.sol` | Reviewed; invariants unchanged |
| `contracts/bsc/FeeReceiverAdmin.sol` | DELETED (2026-06-24); FeeReceiver.sol now covers all fee admin. Original review: residual admin-centralization risk recorded |
| `contracts/bsc/IonProtocolFeeLib.sol` | Reviewed; current optional-return assumptions unchanged |
| `contracts/bsc/LiquidityMine.sol` | Reviewed; no new vulnerability found |
| `contracts/bsc/StakeReward.sol` | Reviewed; no new vulnerability found |
| `contracts/bsc/TokenIssuer.sol` | Reviewed; permissionless by design |
| `contracts/bsc/Burn.sol` | Preview-only |
| `contracts/bsc/VaultLock.sol` | Preview-only |

## Verification evidence

### FunC compile

```powershell
D:\openclaw-data\workspace\func.exe -o contracts/ion/build-func/fee-distributor-round5.fif -SPA contracts/imports/stdlib.fc contracts/ion/common/gas.fc contracts/ion/common/common.fc contracts/ion/FeeDistributor.fc
```

Result:

- command exited `0`

### Foundry

```powershell
D:\openclaw-tools\foundry\bin\forge.exe test --root contracts --match-path "test/*.t.sol" --no-match-path "lib/**" -vv
```

Result:

- `44 passed`
- `0 failed`

### Encoding

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-encoding.ps1 -Path contracts
```

Result:

- all scanned files `UTF-8 without BOM`
- no `NUL` bytes

## Residual risk

- ION AMM-side contracts still need a full custody/value-flow redesign plus dedicated FunC tests before any production-safety claim.
- `BridgeInbox.fc` retains centralized privileged-control surfaces. *(FeeReceiverAdmin.sol has been deleted; FeeReceiver.sol now covers all fee admin.)*
- No invariant / fuzz / chaos harness exists yet for the ION-side FunC support contracts.
