# Contract Audit Fix Log

## 2026-06-22 follow-up remediation

| Contract | Issue | Fix file | Status |
|---|---|---|---|
| DexSwapV2 | `tokenOut` payout incorrectly depended on router balance instead of pool custody | `contracts/bsc/DexSwapV2.sol` | fixed |
| LiquidityPool | Missing minimum-liquidity lock and no proportional add-liquidity validation | `contracts/bsc/LiquidityPool.sol` | fixed |
| OrderBookV2 | Sell-side and matching paths lacked base-asset custody and valid settlement logic | `contracts/bsc/OrderBookV2.sol` | safely closed |

## Coverage conclusion

- `contracts/audit/` already covers every production Solidity contract under `contracts/bsc`.
- Unaudited Solidity contracts in this round: `0`.
- This round fixed implementation defects inside already-audited contracts rather than filling missing reports.

## Verification

- Encoding:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-encoding.ps1`
  - Result: `Scanned: 1569 files` / `OK - All files are UTF-8 without BOM, no NUL bytes.`
- Foundry:
  - `D:\openclaw-tools\foundry\bin\forge.exe test --root contracts --no-cache`
  - Result: `74 tests passed, 0 failed, 0 skipped`

## Residual risk

- `OrderBookV2` is now a guarded custody stub, not a complete production matching engine.
- `DexSwapV2` economic safety still depends on the underlying pool model and whitelist governance.
