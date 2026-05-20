# Security Audit And Stress Sandbox

This document turns the security framework into an execution plan.

## Required Preflight

Before security-sensitive development, read:

1. `.memory-bank/overall-design-framework.md`
2. `.memory-bank/live-data-reference.md`
3. `.memory-bank/implementation-playbook.md`
4. `.memory-bank/architecture-audit.md`
5. `.memory-bank/security-audit-and-stress-framework.md`
6. `.memory-bank/ion-dex-nuke/official-source-index.md`
7. Relevant domain skill: `ion-contract-audit`, `ion-data-backend`, or `ion-web3-ui`

Then run:

```text
node scripts/security-preflight.mjs
```

## Attack Defense Checklist

### Contracts

- Reentrancy and callback order.
- Overflow, rounding, dust, decimal conversions.
- Access control, multisig, timelock, emergency pause.
- Replay, nonce, chain ID, order ID, signature domain separation.
- Oracle manipulation, TWAP, stale price, flash-loan behavior.
- MEV/sandwich/front-running controls.
- Token compatibility.
- Bridge quorum, double-sign, stuck funds, rollback.
- Event completeness.
- Gas and bounded-loop review.

### Backend / Data / API

- Input schemas and return schemas.
- Authn/authz and privilege separation.
- Timeout/retry/rate-limit/circuit-breaker.
- Cache TTL and stale-data state.
- Source provenance.
- Reconciliation.
- Structured logs and trace IDs.
- Secret handling.
- Error code classification.

### Frontend / Wallet / Profile

- Wallet adapter contract.
- Human-readable signing summary.
- Wallet rejection path.
- `.ion` re-resolution.
- Privacy mode.
- XSS/Unicode/RTL/long text.
- Visual reference compliance.

## Test Matrix

| Layer | Required tests |
|---|---|
| Frontend | responsive, interaction states, a11y, XSS/Unicode/RTL, visual walkthrough, high-volume rendering |
| Backend | unit, API success/failure, invalid input, auth, timeout, rate limit, stale data, reconciliation, load |
| Contracts | unit, revert, boundary, integration, fuzz, invariant, gas, static analysis |
| Bridge | replay, duplicate relay, relayer down, reorg, out-of-order, release failure, refund, quorum change |
| Wallet/Profile | provider detection, connect/disconnect, account metadata, signing reject, pending tx, privacy mode |
| Data | parser, source adapter, cache TTL, stale flag, provenance, source mismatch |

## Sandbox Plan

### Backend Load Sandbox

Current:

- `backend/scripts/stress.mjs` provides local stress smoke.

Next required expansion:

- Add k6 or wrk scenario.
- Duration: 5 minutes.
- Concurrency: 100.
- Targets: p99 < 500ms, error rate < 0.1%.
- Endpoint mix: health, config, tokens, markets, burn, staking, bridge, domain, profile.

### Frontend Render Sandbox

Required:

- Deterministic 10,000-row order/trade/notification dataset from reviewed local seed data.
- Playwright route to open high-volume pages.
- React Profiler run for trade/order-grid/profile hub.
- Visual evidence at 375, 768, and 1440px.

### Contract Security Sandbox

Required:

- Foundry gas snapshot.
- Foundry or Echidna invariants.
- Boundary/revert tests.
- Static analysis report.
- FunC compile/test harness for ION contracts.

### Bridge Chaos Sandbox

Required:

- Simulated relayer outage.
- Duplicate packet.
- Reordered packets.
- Source reorg.
- Destination release failure.
- Refund recovery.
- Ledger reconciliation.

## Audit Output Template

Every audit report must include:

1. Scope.
2. Threat model.
3. Findings ordered by severity.
4. Affected files/functions.
5. Reproduction or proof.
6. Fix recommendation.
7. Tests added or required.
8. Residual risk.
9. Verification commands.
10. 100-pass status when feature-complete.

## Non-Negotiable Rule

If sandbox, stress, fuzz, invariant, or visual evidence is missing, the feature is not complete.
