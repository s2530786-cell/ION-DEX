# Security Audit And Stress Framework

This is the mandatory security, attack-defense, stress, chaos, and code-audit framework for ION DEX.

## Security Status

The defense plan is broad, but implementation is not complete until each domain has executable tests, stress scenarios, audit reports, and monitoring hooks.

Never claim security completeness from design documents alone.

## Attack Defense Matrix

### Smart Contracts

Required defenses:

- Reentrancy: checks-effects-interactions, reentrancy guard where applicable, callback ordering tests.
- Integer and precision: overflow/underflow, rounding, dust, decimal conversion, fee split precision.
- Access control: owner transfer, role boundaries, multisig, timelock, emergency pause, role revocation.
- Replay/signatures: nonce, chain ID, domain separator, order ID, expiry, relayer identity, duplicate packet rejection.
- Oracle: TWAP, stale price rejection, multi-source comparison, CMC/off-chain trust boundary, flash-loan manipulation tests.
- MEV: slippage, minimum output, commit-reveal for vulnerable flows, private RPC guidance for high-value swaps.
- Token compatibility: fee-on-transfer, rebasing, non-standard ERC-20 returns, Jetton notifications, zero/blackhole address behavior.
- Bridge: source event authenticity, relayer quorum, destination release/mint, rollback, stuck funds, double-signing, replay, finality.
- Events: every state change emits indexer-complete events with enough indexed fields.
- Gas and loops: bounded loops, storage packing, hot-path gas snapshots.
- Admin security: hardware wallet assumption, multisig threshold, timelock delay, pauser separation, key rotation plan.

### Backend And Data

Required defenses:

- Input validation and typed schemas for every public endpoint.
- Authn/authz tests for privileged routes.
- Rate limiting and abuse controls.
- Timeout, retry budget, circuit breaker, stale-data state, and source provenance for upstreams.
- Cache poisoning controls: source labels, cache keys, TTLs, invalidation path.
- Reconciliation for burn, bridge, staking, treasury, and pool totals.
- Structured JSON logs with request ID, trace ID, user ID when available, source, latency, stale flag.
- No secret in repo, logs, Playwright fixtures, snapshots, or PR bodies.
- Error classification with stable `ION_DEX_E*` codes; no raw internal exception leaks.

### Frontend And Wallet/Profile

Required defenses:

- No private key, seed phrase, production wallet credential, or real signing prompt in tests.
- Wallet adapters must define detection, connect, account/chain metadata, sign request, disconnect, and error codes.
- Every asset-affecting action shows a human-readable signing summary.
- `.ion` transfer must re-resolve immediately before signing.
- Privacy mode must hide balances and portfolio values.
- XSS, Emoji, Unicode, RTL, long address/domain truncation and tooltip behavior must be tested.
- CSP, Trusted Types, SameSite, CSRF strategy must be defined before production.

### AI Sentinel

Required defenses:

- AI cannot sign, swap, stake, bridge, burn, or change allowances.
- AI outputs must include source, confidence, timestamp, and non-investment-advice context.
- Prompt, tool inputs, selected tools, output, and human confirmation state must be auditable.
- No private keys, seed phrases, production RPC secrets, or wallet material can enter AI tools.

## Test Method Catalog

Minimum test families:

1. Unit tests.
2. Revert/error tests.
3. Boundary tests: zero, max, empty arrays, duplicate entries, invalid addresses.
4. Integration tests across contract/API/frontend boundaries.
5. Fuzz tests.
6. Property/invariant tests.
7. Gas snapshots.
8. Static analysis: Slither, Mythril, Aderyn, solhint, 4naly3er or equivalents.
9. Signature/replay tests.
10. Oracle manipulation tests.
11. Flash-loan/TWAP tests.
12. MEV/sandwich simulations.
13. Bridge replay/double-sign/finality/stuck-funds tests.
14. Token compatibility tests.
15. API success tests.
16. API missing parameter tests.
17. API invalid parameter tests.
18. API auth failure tests.
19. API authorization/privilege tests.
20. API timeout tests.
21. API rate-limit tests.
22. Source adapter parser tests.
23. Upstream error and stale-data tests.
24. Reconciliation tests.
25. DB migration forward/backward tests.
26. Concurrency conflict tests.
27. Cache TTL/invalidation tests.
28. Frontend responsive tests at 375, 768, and 1440px.
29. Frontend visual walkthrough against approved references.
30. Frontend accessibility tests.
31. XSS/Unicode/RTL/long text tests.
32. Wallet provider detection tests.
33. Wallet rejection/error tests.
34. Transaction state-machine tests.
35. Backend load tests.
36. Frontend high-volume rendering tests.
37. Contract gas stress tests.
38. Bridge chaos tests.
39. 100-pass full verification gate.
40. PR-level Agent Review / Bugbot security review.

## Pressure And Chaos Sandbox

### Backend Sandbox

Target:

- 100 concurrent users for 5 minutes.
- P99 under 500ms.
- Error rate under 0.1%.
- Include `/api/health`, `/api/config/public`, `/api/tokens`, `/api/markets/tickers`, and future burn/staking/bridge/domain/profile endpoints.

Tools:

- Current local smoke: `backend/scripts/stress.mjs`.
- Required expansion: k6 or wrk scenario with configurable concurrency, duration, and endpoint mix.

### Frontend Sandbox

Target:

- 10,000 order rows / trade events rendered at 60fps.
- 375px, 768px, and 1440px visual sanity.
- Profile Hub, order book, market trades, grid logs, staking records, bridge history, and notifications remain usable.

Tools:

- Playwright fixture generating deterministic high-volume data from reviewed local seed data.
- React Profiler run for hot components.
- Visual recording for manual review.

### Contract Sandbox

Target:

- Hot-path gas snapshots.
- Swap under 200k gas target where applicable.
- Batch operations under 50% block gas limit.
- Fuzz/invariant execution for AMM, fee distribution, staking, bridge, and treasury accounting.

Tools:

- Foundry tests and gas snapshots for EVM.
- FunC compile/test harness for ION.
- Echidna or Foundry invariant tests for Solidity.

### Bridge Chaos Sandbox

Scenarios:

- Relayer down.
- Duplicate relay packet.
- Out-of-order finality.
- Source chain reorg.
- Destination release failure.
- Relayer double-signing.
- Stuck transfer recovery.
- Refund path.
- Quorum threshold changes.

Evidence:

- Structured event log.
- Ledger reconciliation before/after.
- Stuck transfer alert.
- Operator runbook step.

## Code Audit Procedure

Use this sequence for every meaningful change:

1. Scope audit: identify touched assets, funds, signatures, data sources, user privacy, and admin privileges.
2. Memory retrieval: read overall design, live data reference, playbook, architecture audit, official source index, and relevant skill.
3. Threat model: list attacker capabilities, assets at risk, trust boundaries, and failure states.
4. Diff review: inspect changed files and call paths, not just the direct diff.
5. Domain checklist:
   - Contracts: use `ion-contract-audit`.
   - Backend/data: use `ion-data-backend`.
   - Frontend/wallet: use `ion-web3-ui` plus wallet/profile playbook.
6. Automated verification: encoding, build, tests, audit, stress where applicable.
7. Negative tests: invalid input, upstream failure, wallet rejection, replay, duplicate submissions, stale data.
8. Visual review for UI: compare to approved 5D liquid-glass references.
9. Security review output: findings by severity first, assumptions second, required tests third.
10. 100-pass gate for completed milestones.
11. Update `SESSION_STATE.md`, `docs/99-current-progress.md`, and relevant memory.

## Current Known Gaps

- k6/wrk production-grade backend load scenarios are not fully implemented.
- Frontend 10,000-row rendering sandbox is not fully implemented.
- Contract fuzz/invariant/gas harness is not complete in the current branch.
- Bridge chaos sandbox is design-level until bridge service/relayer exists.
- CSP/Trusted Types/CSRF enforcement is not fully wired.
- Agent Review/Bugbot cannot replace deterministic tests and manual visual review.

## Completion Rule

Security is complete only when design, implementation, tests, stress/chaos evidence, audit findings, and monitoring all pass.

If any item is design-only, mark it as incomplete.
