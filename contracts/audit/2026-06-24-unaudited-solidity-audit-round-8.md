# 2026-06-24 Unaudited Solidity Audit Round 8

## Scope

This round closed the remaining Solidity audit gap outside the previously documented BSC and FunC reports:

- `contracts/AgentRegistry.sol`
- `contracts/PaymentEscrow.sol`
- `contracts/TaskRouter.sol`
- `contracts/bridge/BridgeValidator.sol`
- `contracts/bridge/TokenBridge.sol`
- `contracts/dex/AMMPool.sol`
- `contracts/dex/Router.sol`
- `contracts/governance/Timelock.sol`
- `contracts/governance/GovernorAlpha.sol`

Consistency checks also covered `contracts/bsc/BSCVault.sol`, `contracts/bsc/NFTAuction.sol`, and `contracts/bsc/OrderBookV2.sol` because their current source and tests are part of the effective Foundry regression set.

## 10 Attack Surfaces Reviewed

1. Reentrancy and callback ordering.
2. Integer overflow, underflow, precision, rounding, and dust.
3. Access control, ownership, admin authority, timelock, and emergency boundaries.
4. Replay protection, nonce handling, chain ID, execution ID, and domain separation.
5. Oracle, timestamp, stale-state, and flash-loan assumptions.
6. MEV, sandwiching, slippage, stale transaction, and price impact.
7. Token compatibility, fee-on-transfer behavior, non-standard ERC20 returns, and ERC721 receiving.
8. Cross-contract accounting, custody consistency, and escrowed value flow.
9. Event completeness for operator, audit, and indexer reconstruction.
10. Gas, bounded loops, validator/signature DoS, and operational scaling.

## Findings

### Critical

- Fixed: `contracts/bsc/Dividend.sol` allowed users to self-assign dividend shares through public `stake`/`unstake`, enabling reward theft from externally managed LP accounting. The contract now uses `shareManager`-gated `stakeFor`/`unstakeFor`, rejects public self-assignment, and keeps reward debt synchronized.
- Fixed: `contracts/bsc/BatchTransfer.sol` did not require exact native-token accounting, so excess `msg.value` could remain trapped in the contract. `batchNative` now sums target amounts and requires `msg.value == total`.
- The current `Timelock` implementation enforces admin-only delay mutation, non-zero admin and target checks, a 2-day minimum delay, a 30-day maximum delay, and `eta >= block.timestamp + delay`.
- The current `GovernorAlpha` implementation rejects unknown/canceled proposals, uses `msg.sender` as voting identity, bounds action count, enforces quorum, and blocks reentrant execution.

### High

- No new unpatched high issue was found in this pass.
- `BridgeValidator` currently rejects unauthorized validator mutation, duplicate signers, zero validators, and removal or weight updates that would break quorum.
- `TokenBridge` currently includes chain ID and bridge address in the signed transfer hash, uses per-sender nonces, rejects same-chain claims, requires non-zero fields, rejects invalid signatures, and enforces ordered unique validator signatures.
- `AMMPool` and `Router` currently enforce minimum liquidity locking, SafeERC20 transfers, exact received amounts for unsupported token behavior, deadline checks, route validation, and final-hop slippage.
- `PaymentEscrow` and `TaskRouter` currently use reentrancy guards and state-before-external-call settlement for asset-affecting paths.

### Medium

- `AgentRegistry` currently bounds name and endpoint size, uses deterministic ID salt including chain ID and contract address, and rejects `type(int256).min` reputation deltas.
- `BSCVault` optional-return ERC20 compatibility is covered by tests.
- `NFTAuction` royalty recipient payout, SafeERC20 handling, and ERC721 receiver behavior are covered by tests.
- `OrderBookV2` remains a guarded custody stub rather than a production matching engine.

## Residual Risk

- `GovernorAlpha` still executes proposal targets directly after voting. Production governance should route successful proposals through `Timelock`.
- `BridgeValidator.hasConsensus` uses O(n^2) duplicate-signer detection. Production should also bound signer array length.
- `PaymentEscrow` and `AMMPool` intentionally reject fee-on-transfer and rebasing tokens through exact received-amount checks.
- `OrderBookV2` is safe-closed for sell/match custody paths but is not a production order book.
- Raw `forge test -C contracts` still compiles vendored OpenZeppelin `test/` and `fv/` trees that are incomplete in this checkout, so it is not the effective project regression command.

## Verification Evidence

```powershell
D:\openclaw-tools\foundry\bin\forge.exe test --root contracts --match-path "test/*.t.sol" --no-match-path "lib/**" -vv
```

Result: `81 passed, 0 failed, 0 skipped`.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-encoding.ps1 -Path contracts
```

Result: `Scanned: 88 files`, all UTF-8 without BOM, no NUL bytes.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-encoding.ps1 -Path scripts
```

Result: `Scanned: 95 files`, all UTF-8 without BOM, no NUL bytes.
