---
name: ion-contract-audit
description: Reviews and designs ION DEX smart contracts with strict security discipline. Use when creating, editing, or reviewing FunC, Solidity, AMM, staking, burn, bridge, vault, multisig, fee, oracle, MEV, or AI sentinel contract logic.
---

# ION Contract Audit

## Scope

Use this skill for all smart contract work in ION DEX:

- ION FunC contracts.
- BSC/EVM Solidity contracts.
- AMM, swap, liquidity, staking, burn, bridge, vault, treasury, fee, relayer, oracle, and sentinel logic.

## Required Security Checklist

Before calling a contract change complete, check:

- Reentrancy and callback ordering.
- Integer overflow, underflow, rounding, precision loss, and dust handling.
- Access control, ownership transfer, roles, emergency pause, multisig, and timelock.
- Replay protection, nonce handling, chain ID, order ID, and signature domain separation.
- Oracle manipulation, stale price, TWAP, CMC/off-chain trust assumptions, and flash-loan exposure.
- MEV, sandwiching, front-running, slippage, price impact, and commit-reveal where needed.
- Token compatibility issues: fee-on-transfer, rebasing, non-standard ERC-20 return values, Jetton transfer notifications.
- Bridge consistency: source event, relayer quorum, destination mint/release, rollback, stuck funds.
- Event completeness for off-chain indexers and audits.
- Gas/storage layout and unbounded loops.
- Admin key management and hardware wallet assumptions.

## ION Official Source Discipline

For ION-native work, load `ion-official-source` and inspect `D:/openclaw-tools/ion` first. Do not invent ION-specific primitives without checking official references.

## Testing Requirements

Contract work must eventually include:

- Unit tests for normal, boundary, and revert cases.
- Integration tests for swap/liquidity/staking/bridge flows.
- Fuzz/property tests for invariants.
- Gas snapshots for hot paths.
- Formal or semi-formal invariant notes for critical accounting.

Until the contract test harness exists, mark contract features as design-only and do not claim production readiness.

## Output Format

For reviews, lead with findings by severity, then assumptions, then required tests. Do not bury security issues in summaries.
