# TEST COVERAGE MATRIX (honest current evidence)

_Last updated: 2026-06-04_

This matrix is intentionally conservative. It records only the strongest evidence grade actually supported by the current spec contents.

## Evidence grade legend

- **Live verified** — exercised in the current verify runtime and directly observed by existing tests.
- **Implemented + mock/test-backed** — code path exists and is exercised only with mocks, local seed data, or intent-recorded backend behavior.
- **Documented/planned only** — no direct current E2E evidence found.
- **Not verified** — current E2E does not prove the claim.

## Capability matrix

- **App shell mount / page reachability**
  - Evidence: **Live verified**
  - Source specs: `smoke.spec.ts`, feature page specs
  - Notes: verifies page shells, nav reachability, visible modules.

- **Boot splash presence / dismiss behavior**
  - Evidence: **Live verified**
  - Source specs: `smoke.spec.ts`, `splash-visual-signoff.spec.ts` (conditional for screenshots)
  - Notes: proves DOM/interaction/screenshot capture, not business logic completion.

- **Dashboard visual signoff capture**
  - Evidence: **Implemented + mock/test-backed**
  - Source specs: `dashboard-visual-signoff.spec.ts`
  - Notes: conditional screenshot workflow under `ION_UI_SIGNOFF=1`.

- **Wallet panel rendering / provider list UI**
  - Evidence: **Live verified**
  - Source specs: `wallet-connect.spec.ts`, `smoke.spec.ts`
  - Notes: proves UI visibility only.

- **Wallet connect via mocked providers**
  - Evidence: **Implemented + mock/test-backed**
  - Source specs: `wallet-connect.spec.ts`, `smoke.spec.ts`
  - Notes: uses injected `window.ethereum` / `window.ton` mocks.

- **Real wallet/provider execution**
  - Evidence: **Not verified**
  - Notes: no current spec proves real MetaMask / WalletConnect / ION extension live execution.

- **Sign summary opens before intent**
  - Evidence: **Implemented + mock/test-backed**
  - Source specs: `wallet-connect.spec.ts`
  - Notes: UI summary only; no real signature.

- **Settings local preference editing**
  - Evidence: **Live verified**
  - Source specs: `settings.spec.ts`
  - Notes: local UI state and banner updates are covered.

- **Skill toggle behavior**
  - Evidence: **Not verified**
  - Notes: no current spec demonstrates a skill-toggle system or persistence.

- **Sentinel alert self-test button in settings/UI**
  - Evidence: **Implemented + local test-backed**
  - Source specs: `settings.spec.ts`, `smoke.spec.ts`
  - Notes: visible result in verify stack, not a production alert-channel verification guarantee.

- **OAuth handling**
  - Evidence: **Not verified**
  - Notes: no current spec exercises an OAuth login or callback flow.

- **Reconnect behavior after provider/session disruption**
  - Evidence: **Not verified**
  - Notes: no current spec simulates disconnect/reload/reconnect lifecycle truthfully.

- **Copy-trade page start/stop behavior**
  - Evidence: **Implemented + local API/test-backed**
  - Source specs: `copy-trade.spec.ts`
  - Notes: local verify environment only; not live strategy execution.

- **Domain lookup/register flow**
  - Evidence: **Implemented + local API/test-backed**
  - Source specs: `domain-manage.spec.ts`
  - Notes: intent-recording / local verify stack; not real on-chain registration.

- **Liquidity-mine stake flow**
  - Evidence: **Implemented + local API/test-backed**
  - Source specs: `liquidity-mine.spec.ts`
  - Notes: page/action flow only; not live contract execution.

- **Batch-transfer validate flow**
  - Evidence: **Implemented + local API/test-backed**
  - Source specs: `batch-transfer.spec.ts`
  - Notes: validates payload contract shape in verify environment; not transfer execution.

- **Trade / grid / pool / stake / bridge / burn / domain / AI form previews**
  - Evidence: **Implemented + local UI/test-backed**
  - Source specs: `smoke.spec.ts`
  - Notes: mostly input validation + preview/confirmation behavior.

- **Tool execution**
  - Evidence: **Not verified**
  - Notes: shell/page reachability specs must not be credited as tool execution evidence.

- **Live transaction broadcast / settlement**
  - Evidence: **Not verified**
  - Notes: no current E2E proves real signed transaction submission or settlement.

## Anti-overclaim rules

Do **not** use current E2E coverage as evidence for:
- OAuth completion
- reconnect resilience
- skill toggle completion
- tool execution
- live wallet/provider execution
- live chain execution

If a future spec adds those capabilities, this matrix should be upgraded only after reading the actual spec contents and verifying the stronger behavior is truly exercised.
