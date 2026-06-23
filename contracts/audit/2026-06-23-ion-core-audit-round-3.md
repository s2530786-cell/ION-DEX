# 2026-06-23 ION Core Audit Round 3

## Scope

- `contracts/ion/lp_wallet.fc`
- `contracts/ion/vault.fc`
- `contracts/ion/staking-pool.fc`
- `contracts/ion/dns-registrar.fc`
- `contracts/ion/dns-auction.fc`
- `contracts/ion/dns-resolver.fc`
- Review-only pass on:
  - `contracts/ion/router.fc`
  - `contracts/ion/pool.fc`
  - `contracts/ion/lp_account.fc`
  - `contracts/ion/BridgeInbox.fc`
  - `contracts/ion/FeeDistributor.fc`
  - `contracts/ion/deployer.fc`
  - `contracts/ion/sandwich.fc`
  - `contracts/ion/common/common.fc`
  - `contracts/ion/common/gas.fc`

## Why this round existed

- `contracts/ion/*.fc` had historical compile/fix evidence in `contracts/ion/FIX_LOG.md` and `contracts/ion/FIX-LOG.md`, but that evidence was not archived in `contracts/audit/`.
- A fresh source review found new fund-safety issues that were not recorded in the old logs.

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

1. Fixed: `contracts/ion/lp_wallet.fc`
   - Issue: `handle_transfer` and `handle_burn` had no sender authorization at all.
   - Impact: Any sender could forge LP wallet mint/burn-style state transitions and arbitrarily reduce tracked LP balance.
   - Fix:
     - require `ctx::sender_slice == storage::owner_address` before transfer/burn state mutation
     - stop using `CARRY_ALL_BALANCE` for wallet notifications

2. Fixed: `contracts/ion/staking-pool.fc`
   - Issue: `stake_withdraw` and `stake_claim` only emitted message bodies and never transferred native ION to the staker.
   - Impact: User principal and rewards could be permanently locked inside the contract even though local accounting said withdrawal/claim succeeded.
   - Fix:
     - use `msgs::send_value(amount, ...)` for withdraw
     - use `msgs::send_value(earned, ...)` for claim
     - reserve minimal storage balance before outbound payout

3. Fixed: `contracts/ion\vault.fc`
   - Issue: `handle_withdraw_fee` zeroed `deposited_amount` only after the external router call.
   - Impact: A bounced or reentered withdrawal path could observe stale balance and replay withdrawal semantics against the same accounting slot.
   - Fix:
     - snapshot `payout_amount`
     - clear and persist state before sending the external message

### High

1. Fixed: `contracts/ion/staking-pool.fc`
   - Issue: `stake_deposit` preserved stale `reward_debt` when adding new stake.
   - Impact: A user could deposit after rewards had accrued and immediately claim a share of historical rewards they never earned.
   - Fix:
     - recompute `reward_debt` from updated stake on deposit
     - recompute `reward_debt` after partial withdrawal

2. Fixed: `contracts/ion/dns-registrar.fc`
   - Issue: Registration forwarding used `QCARRY_ALL_BALANCE`.
   - Impact: Any valid registration could sweep the registrar's full remaining native balance into the downstream resolver call instead of only sending the intended control message.
   - Fix:
     - change the forward mode to `0`

3. Fixed: `contracts/ion/dns-auction.fc`
   - Issue: Bid acknowledgement and auction settlement both used `QCARRY_ALL_BALANCE`.
   - Impact: A bidder or settlement path could receive contract-native balance unrelated to the current auction state.
   - Fix:
     - change acknowledgement and resolver-forward messages to mode `0`

4. Fixed: `contracts/ion/dns-resolver.fc`
   - Issue: Resolve replies used `QCARRY_ALL_BALANCE`.
   - Impact: Any resolver caller could drain native balance that happened to be parked in the resolver.
   - Fix:
     - change resolve reply mode to `0`

5. Fixed: `contracts/ion/lp_wallet.fc`
   - Issue: Wallet notifications used `CARRY_ALL_BALANCE`.
   - Impact: LP-wallet native balance could be swept together with a normal transfer or burn notification.
   - Fix:
     - change notification mode to `0`

6. Fixed: `contracts/ion/router.fc`, `contracts/ion/deployer.fc`
   - Issue: router pool registration had two coupled flaws:
     - `handle_register_pool` read the deployer payload as a bare `pool` address even though `deployer.fc` sent `query_id + pool`
     - `handle_collect_fees` looked up pools by token-pair hash while `handle_register_pool` stored only pool-address hash entries
   - Impact:
     - deployer-driven pool registration could decode garbage and fail
     - even if an owner manually registered a pool, `collect_fees` could not resolve the pool from `token0/token1`
   - Fix:
     - `deployer.fc` now sends `query_id + pool + token0 + token1` to router
     - `router.fc` now accepts registration from configured `deployer_address` as well as owner
     - router stores both `pool-address-hash -> pool` and `token-pair-hash -> pool`
     - router `set_params` and getter now expose `deployer_address`

### Medium

1. Unfixed design risk: `contracts/ion/router.fc`, `contracts/ion/pool.fc`, `contracts/ion/lp_account.fc`, `contracts/ion/sandwich.fc`, `contracts/ion/deployer.fc`
   - Issue: several protocol-routing paths still use `CARRY_ALL_BALANCE` / `QCARRY_ALL_BALANCE`.
   - Impact: these paths may over-forward native ION or conflate gas-carrying semantics with asset/accounting semantics.
   - Reason not patched in this round:
     - these routes are protocol-critical and need a deeper message-value model review before changing forwarding semantics
   - Recommendation:
     - audit each path against official DEX message flow and add dedicated FunC tests before modifying them

2. Residual centralization risk: `contracts/ion/BridgeInbox.fc`, `contracts/ion/FeeDistributor.fc`, `contracts/ion/deployer.fc`, `contracts/ion/router.fc`
   - Issue: owner and relayer roles remain centralized.
   - Impact: compromise of privileged keys is still catastrophic.
   - Recommendation:
     - move owner / relayer control to multisig + timelock before production use

## Contract-by-contract disposition

| Contract | Result |
|---|---|
| `BridgeInbox.fc` | Reviewed; quorum logic intact, centralized relayer/admin model remains |
| `common/common.fc` | Reviewed; shared message helper semantics remain a high-risk surface |
| `common/gas.fc` | Reviewed; constants only |
| `deployer.fc` | Fixed registration payload; residual forwarding-semantics risk recorded |
| `dns-auction.fc` | Fixed |
| `dns-registrar.fc` | Fixed |
| `dns-resolver.fc` | Fixed |
| `FeeDistributor.fc` | Reviewed; split logic intact, owner control remains centralized |
| `lp_account.fc` | Reviewed; residual forwarding-semantics risk recorded |
| `lp_wallet.fc` | Fixed |
| `pool.fc` | Reviewed; residual forwarding-semantics risk recorded |
| `router.fc` | Fixed registration/fee-lookup path; residual forwarding-semantics risk recorded |
| `sandwich.fc` | Reviewed; residual forwarding-semantics risk recorded |
| `staking-pool.fc` | Fixed |
| `vault.fc` | Fixed |

## Verification evidence

### FunC compile

Commands used:

```powershell
D:\openclaw-data\workspace\func.exe -o contracts/ion/build-func/lp_wallet.fif -SPA D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc contracts/ion/common/gas.fc contracts/ion/common/common.fc contracts/ion/lp_wallet.fc
D:\openclaw-data\workspace\func.exe -o contracts/ion/build-func/vault.fif -SPA D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc contracts/ion/common/gas.fc contracts/ion/common/common.fc contracts/ion/vault.fc
D:\openclaw-data\workspace\func.exe -o contracts/ion/build-func/staking-pool.fif -SPA D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc contracts/ion/common/gas.fc contracts/ion/common/common.fc contracts/ion/staking-pool.fc
D:\openclaw-data\workspace\func.exe -o contracts/ion/build-func/dns-registrar.fif -SPA D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc contracts/ion/common/gas.fc contracts/ion/common/common.fc contracts/ion/dns-registrar.fc
D:\openclaw-data\workspace\func.exe -o contracts/ion/build-func/dns-auction.fif -SPA D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc contracts/ion/common/gas.fc contracts/ion/common/common.fc contracts/ion/dns-auction.fc
D:\openclaw-data\workspace\func.exe -o contracts/ion/build-func/dns-resolver.fif -SPA D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc contracts/ion/common/gas.fc contracts/ion/common/common.fc contracts/ion/dns-resolver.fc
D:\openclaw-data\workspace\func.exe -o contracts/ion/build-func/router-round4.fif -SPA D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc contracts/ion/common/gas.fc contracts/ion/common/common.fc contracts/ion/router.fc
D:\openclaw-data\workspace\func.exe -o contracts/ion/build-func/deployer-round4.fif -SPA D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc contracts/ion/common/gas.fc contracts/ion/common/common.fc contracts/ion/deployer.fc
```

Result:

- all eight commands exited `0`

## Residual risk

- `contracts/ion/*.fc` still do not have dedicated automated test suites beyond compile-level evidence and historical script coverage.
- Router/pool/lp-account/sandwich/deployer forwarding semantics need a dedicated value-flow audit before production.
- No invariant, fuzz, or chaos harness exists yet for ION-side FunC contracts.
