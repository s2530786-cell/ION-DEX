# Contracts Audit Progress

## 2026-06-22 status

- `contracts/audit/` was missing before this round. It is now initialized.
- Existing historical audit evidence already in repo:
  - `contracts/ion/FIX_LOG.md`
  - `contracts/ion/FIX-LOG.md`
  - `contracts/test/SecurityMatrix.t.sol`
  - `contracts/test/BridgeIonE2E.t.sol`
- New round report:
  - [`2026-06-22-bsc-audit-round-1.md`](./2026-06-22-bsc-audit-round-1.md)
  - [`2026-06-23-func-audit-round-2.md`](./2026-06-23-func-audit-round-2.md)

## Coverage summary

| Scope | Status | Notes |
|---|---|---|
| `contracts/ion/*.fc` core set | Historical audit present | Prior fix logs + compile/test evidence already existed |
| `contracts/bsc/BSCVault.sol` | Audited | No new vulnerability found this round |
| `contracts/bsc/BridgeRelay.sol` | Audited and fixed | Quorum bypass fixed |
| `contracts/bsc/FeeReceiver.sol` | Audited | No new vulnerability found this round |
| `contracts/bsc/IonSwapRouter.sol` | Audited | Existing minimum-output guard preserved |
| `contracts/bsc/DexSwap.sol` | Audited and fixed | Wrong payout path and reserve timing fixed |
| `contracts/bsc/LiquidityPool.sol` | Audited and fixed | LP share minting used post-deposit reserves |
| `contracts/bsc/Dividend.sol` | Audited and fixed | Arbitrary share mint / dividend theft fixed |
| `contracts/bsc/BatchTransfer.sol` | Audited and fixed | Native token overpayment lock fixed |
| `contracts/bsc/NFTAuction.sol` | Audited | Residual design issue recorded |
| `contracts/bsc/OrderBook.sol` | Audited | Residual gas/read-scaling issue recorded |
| `contracts/bsc/Burn.sol` | Preview-only | Not production-safe |
| `contracts/bsc/VaultLock.sol` | Preview-only | Not production-safe |
| Root-level FunC drafts (`ion_*_v6.fc`) | Audited round 2 | Three funding/rollback issues fixed; MMR residual design issue recorded |

## Verification note

The raw command `forge test -C contracts` does not pass in the current repo because vendored upstream OpenZeppelin test/formal-verification trees under `contracts/lib/openzeppelin-contracts/` are incomplete in this checkout.

This round's real contract verification used:

```powershell
D:\openclaw-tools\foundry\bin\forge.exe test --root contracts --match-path "test/*.t.sol" --no-match-path "lib/**" -vv
```

Result: `43 passed, 0 failed`.
