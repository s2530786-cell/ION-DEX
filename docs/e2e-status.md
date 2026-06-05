# E2E status (honest current scope)

_Last updated: 2026-06-04_

This file is the **truthfulness layer** for current Playwright coverage. It lists what the present specs actually prove, and what they do **not** prove.

## Evidence grades

- **Live verified**: exercised against the local runtime in Playwright during `frontend npm run verify` / `verify-full`.
- **Implemented + mock/test-backed**: the flow exists and the spec uses mocked providers, local seed data, or intent-recorded backend responses.
- **Not verified by current E2E**: current specs do not prove the claimed capability.

## Current spec reality

### `frontend/e2e/smoke.spec.ts`
Evidence grade: **mixed — mostly shell/reachability, plus some local validation flows**

What it actually proves:
- App shell mounts and key page shells are reachable.
- Brand/header/ticker/main content are visible.
- Boot splash DOM/behavior is present before dismissal.
- Hash navigation reaches the expected page shells.
- Several forms can validate local inputs and show preview/confirmation UI.
- Wallet shell can open using an injected mock `window.ton` provider.

What it does **not** prove:
- Real wallet SDK execution.
- Real chain signing or transaction submission.
- OAuth login handling.
- Reconnect resilience after provider disconnect/network loss.
- Skill toggle execution or persistence.
- Any live backend-side business completion beyond the local verify environment.

### `frontend/e2e/wallet-connect.spec.ts`
Evidence grade: **implemented + mock/test-backed**

What it actually proves:
- The wallet panel renders the expected provider entries.
- Mocked MetaMask/EVM connection updates the UI.
- Mocked ION Browser Wallet connection can open the sign-summary dialog before intent.

What it does **not** prove:
- Real MetaMask/OKX/Bitget/Trust/Coinbase/Rabby wallet integrations.
- Real WalletConnect pairing.
- Real ION extension signing.
- Reconnect behavior across browser reloads or provider events.
- OAuth-style auth of any kind.

### `frontend/e2e/settings.spec.ts`
Evidence grade: **implemented + local-state/test-backed**

What it actually proves:
- Settings page shell renders.
- Local settings controls change visible UI state.
- Sentinel alert self-test button returns a visible result in the local verify stack.
- Local cache-clear banner appears.

What it does **not** prove:
- Any skill toggle system.
- Durable remote persistence of settings.
- Reconnect behavior.
- OAuth/account security settings handling.

### `frontend/e2e/copy-trade.spec.ts`
Evidence grade: **implemented + local API/test-backed**

What it actually proves:
- Copy-trade page renders.
- Local API endpoints for start/stop can be called from the verify environment.
- UI toggle state changes when those endpoints respond.

What it does **not** prove:
- Live copy-trading execution.
- Real market follower orchestration.
- Live wallet signing or order routing.

### `frontend/e2e/domain-manage.spec.ts`
Evidence grade: **implemented + local API/test-backed**

What it actually proves:
- Domain page shell renders.
- Lookup/register intent flow works against the verify environment.
- Owned-list UI updates after local intent recording.

What it does **not** prove:
- Real on-chain domain registration.
- Real payment/ownership settlement.

### `frontend/e2e/liquidity-mine.spec.ts`
Evidence grade: **implemented + local API/test-backed**

What it actually proves:
- Liquidity-mine page shell renders.
- Pool rows/summary tiles render.
- Stake intent can be submitted in the verify environment.

What it does **not** prove:
- Real staking contract execution.
- Reward accrual on-chain.
- Wallet signing.

### `frontend/e2e/batch-transfer.spec.ts`
Evidence grade: **implemented + local API/test-backed**

What it actually proves:
- Batch-transfer page shell renders.
- CSV parsing/removal works.
- The validate-transfer API contract responds with expected payload shape in the verify environment.
- Collect tab is reachable.

What it does **not** prove:
- Real token transfer execution.
- Real batch send signing/broadcast.
- Real collect execution.

### `frontend/e2e/splash-visual-signoff.spec.ts`
Evidence grade: **visual signoff helper, conditional**

What it actually proves when `ION_UI_SIGNOFF=1`:
- Splash screenshots can be captured at 375/768/1440.

What it does **not** prove:
- Business logic completion.
- Runtime transaction behavior.

### `frontend/e2e/dashboard-visual-signoff.spec.ts`
Evidence grade: **visual signoff helper, conditional**

What it actually proves when `ION_UI_SIGNOFF=1`:
- Dashboard screenshots can be captured at 375/768/1440.

What it does **not** prove:
- Market execution.
- Wallet execution.
- Any backend/live-chain completion.

## Honesty corrections vs overclaiming

The current Playwright suite should **not** be described as proving:
- OAuth handling
- tool execution
- skill toggle behavior
- reconnect verification
- real wallet/provider execution
- real chain signing/broadcast

Where those capabilities are mentioned elsewhere, they must be treated as either:
- **implemented + mock/test-backed**, or
- **not verified by current E2E**

## Bottom line

Current E2E is strong for:
- shell reachability
- page-level render checks
- local form validation
- verify-environment API contract checks
- mock-backed wallet UI flows
- optional screenshot capture

Current E2E is **not** evidence of:
- production wallet connectivity
- OAuth/auth hardening
- reconnect resilience
- skill-toggle execution
- live transaction settlement
