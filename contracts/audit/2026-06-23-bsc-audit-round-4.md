# 2026-06-23 BSC Audit Round 4

## Scope

- `contracts/bsc/IonOracle.sol`
- `contracts/bsc/FeeReceiver.sol`
- Second-pass review of previously marked "reviewed" BSC support contracts

## Why this round existed

- Coverage cross-checking confirmed that all production/draft contract filenames in `contracts/bsc/`, `contracts/ion/`, and root-level `contracts/*.fc` were already represented in prior audit records or historical fix logs.
- A second-pass 10-surface review of the previously "reviewed" BSC support contracts still found a real oracle-unit vulnerability worth fixing.

## 10 attack surfaces reviewed

1. Reentrancy / callback ordering
2. Integer overflow / underflow / precision / rounding
3. Access control / privileged writes
4. Replay / duplicate execution / stale cached state
5. Oracle freshness / unit normalization / stale fallback
6. MEV / threshold-triggered pricing mode changes
7. Token compatibility / transfer semantics
8. Cross-contract accounting consistency
9. Event completeness / operator auditability
10. Gas / operational DoS

## Findings

### High

1. Fixed: `contracts/bsc/IonOracle.sol`
   - Issue: `getPrice()` and `getPriceView()` returned raw feed answers in native feed decimals while `FeeReceiver` thresholds are configured in fixed 8-decimal units.
   - Impact: switching to a non-8-decimal oracle feed could silently force the wrong market mode and therefore the wrong burn/staking/treasury split.
   - Fix:
     - normalize oracle answers to fixed 8-decimal units before caching or returning them
     - validate oracle decimals during setup
     - reuse the same normalization logic for constructor, live reads, and `setOracle()`
   - Tests:
     - `test_fee_receiver_normalizes_oracle_decimals_before_threshold_checks`

## Contract-by-contract disposition

| Contract | Result |
|---|---|
| `IonOracle.sol` | Fixed |
| `FeeReceiver.sol` | Reviewed with oracle-unit fix |
| `FeeReceiverAdmin.sol` | DELETED (2026-06-24) — FeeReceiver.sol now covers all fee admin. Original review: centralized owner/timelock model unchanged |
| `AdminManager.sol` | Reviewed; no new vulnerability found |
| `DynamicBurnConfig.sol` | Reviewed; config invariants unchanged |
| `StakeReward.sol` | Reviewed; reward solvency still depends on operator funding |
| `TokenIssuer.sol` | Reviewed; permissionless by design |
| `MockERC20.sol` | Test-only |

## Verification evidence

```powershell
D:\openclaw-tools\foundry\bin\forge.exe test --root contracts --match-path "test/*.t.sol" --no-match-path "lib/**" -vv
```

Result:

- `44 passed`
- `0 failed`

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-encoding.ps1 -Path contracts
```

Result:

- `863 files` scanned
- all `UTF-8 without BOM`
- no `NUL` bytes

## Residual risk

- `IonOracle.sol` still trusts a single upstream feed; this round fixed unit safety, not single-source trust assumptions.
- `FeeReceiverAdmin.sol` — DELETED (2026-06-24); FeeReceiver.sol now covers all fee admin. Original finding: owner/oracle/destination controls were centralized and not multisig-protected.
- `StakeReward.sol` reward solvency still depends on operators funding `rewardToken` inventory before claims.
