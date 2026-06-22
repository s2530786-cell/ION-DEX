# 2026-06-23 FunC Audit Round 2

## Scope

- `contracts/ion_cross_border_payment_v6.fc`
- `contracts/ion_ecommerce_escrow_v6.fc`
- `contracts/ion_mmr_ledger_v6.fc`
- `contracts/ion_multichain_gateway_v6.fc`

## Why this round existed

- These four root-level FunC contracts were not covered by `contracts/audit/2026-06-22-bsc-audit-round-1.md`.
- They also were not part of the historical `contracts/ion/*.fc` compile/audit set tracked by `contracts/ion/FIX_LOG.md` and `contracts/ion/FIX-LOG.md`.

## 10 attack surfaces reviewed

1. Reentrancy / callback ordering
2. Integer overflow / underflow / precision / rounding
3. Access control / privileged sender checks
4. Replay / nonce / duplicate execution
5. Oracle / timestamp / stale data assumptions
6. MEV / slippage / user pricing guarantees
7. Token / attached-value / message-value consistency
8. Bridge / gateway state consistency and rollback
9. Event / message auditability and operator recovery
10. Gas / loop bounds / operational DoS

## Findings

### Critical

1. Fixed: `contracts/ion_cross_border_payment_v6.fc`
   - Issue: `offline_invoice_pay` increased merchant balance using signed payload data only, without requiring `msg_value >= payment_amount_ion`.
   - Impact: Any actor holding a valid platform signature could mint internal merchant credit without funding the contract, then withdraw real balance later if the contract held funds.
   - Fix:
     - require attached value to cover `payment_amount_ion`
     - add bounced-withdraw rollback
     - add withdrawal replay tracking keyed by signed withdrawal hash

2. Fixed: `contracts/ion_ecommerce_escrow_v6.fc`
   - Issue: `business_dispatch` created a payable escrow position without verifying `msg_value >= total_ion`.
   - Impact: The authorized hub could create undercollateralized escrow records, then release or refund unfunded balances from contract reserves.
   - Fix:
     - require attached value to cover `total_ion`
     - reject duplicate `order_id`
     - attach settlement/refund metadata so bounced payouts can be routed for manual arbitration

3. Fixed: `contracts/ion_multichain_gateway_v6.fc`
   - Issue: `cross_chain_deposit` recorded bridgeable deposits from relayer payload data only, without binding order creation to actual attached funds.
   - Impact: A privileged relayer could mint synthetic bridge orders and route payouts against any pre-existing gateway liquidity.
   - Fix:
     - require `msg_value >= deposit_amount`
     - include `query_id` in `order_hash`
     - reject duplicate orders

### High

1. Fixed: `contracts/ion_multichain_gateway_v6.fc`
   - Issue: `execute_routing_swap` deleted the order before downstream routing success, while bounced rollback tried to recover using a payload shape that did not match the emitted message body.
   - Impact: Failed downstream routing could permanently orphan user funds in gateway balance with no remaining order context.
   - Fix:
     - keep order context until success callback
     - mark order `in_flight` instead of deleting early
     - emit routing message body with `query_id + order_hash` so bounce path can recover the exact order
     - release fee/gas side payouts only after success callback

2. Fixed: `contracts/ion_cross_border_payment_v6.fc`
   - Issue: Merchant withdrawals had no replay-consumption tracking beyond `query_id` being included in the signed digest.
   - Impact: Re-submission of the same signed withdrawal could succeed repeatedly if caller-controlled `query_id` reuse aligned with available balance.
   - Fix:
     - persist consumed withdrawal hashes
     - clear the consumed marker only if the payout bounces and balance is restored

### Medium

1. Unfixed design risk: `contracts/ion_mmr_ledger_v6.fc`
   - Issue: `commit_append` can overwrite an existing commit for the same `query_id`; there is no uniqueness or timeout pruning policy for stale commits.
   - Impact: Operator mistakes can silently replace pending commitments, and stale entries can accumulate operational debt.
   - Recommendation:
     - reject duplicate live `query_id` commits
     - add pruning / expiry handling for abandoned commits

2. Unfixed design risk: `contracts/ion_multichain_gateway_v6.fc`
   - Issue: Governor remains the sole relayer, fee sink, and emergency authority.
   - Impact: This is still a centralized trust surface; compromise remains catastrophic.
   - Recommendation:
     - move to multisig / quorum attestation before any production deployment

## Contract-by-contract disposition

| Contract | Result |
|---|---|
| `ion_cross_border_payment_v6.fc` | Fixed |
| `ion_ecommerce_escrow_v6.fc` | Fixed |
| `ion_mmr_ledger_v6.fc` | Reviewed; residual design issue recorded |
| `ion_multichain_gateway_v6.fc` | Fixed |

## Verification evidence

### FunC compile

Commands used:

```powershell
cd contracts
D:\openclaw-data\workspace\func.exe -o build-cross-border.fif -SPA imports/stdlib.fc ion_cross_border_payment_v6.fc
D:\openclaw-data\workspace\func.exe -o build-ecommerce-escrow.fif -SPA imports/stdlib.fc ion_ecommerce_escrow_v6.fc
D:\openclaw-data\workspace\func.exe -o build-multichain-gateway.fif -SPA imports/stdlib.fc ion_multichain_gateway_v6.fc
D:\openclaw-data\workspace\func.exe -o build-mmr-ledger.fif -SPA imports/stdlib.fc ion_mmr_ledger_v6.fc
```

Result:

- all four commands exited `0`

### Foundry

Command used:

```powershell
D:\openclaw-tools\foundry\bin\forge.exe test --root contracts --match-path "test/*.t.sol" --no-match-path "lib/**" -vv
```

Result:

- `43 passed`
- `0 failed`

## Residual risk

- These root-level FunC contracts still do not have dedicated automated test suites in this repository.
- The gateway / payment / escrow contracts remain heavily centralized around a single trusted authority.
- No formal invariant or chaos harness exists yet for these four contracts.
