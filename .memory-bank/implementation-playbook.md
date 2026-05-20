# Implementation Playbook

Read this before coding chain data, wallet/profile, fees, bridge, domain, or trading flows.

## Required Reads Before Coding

1. `docs/00-engineering-standards.md`
2. `.memory-bank/overall-design-framework.md`
3. `.memory-bank/live-data-reference.md`
4. `.memory-bank/architecture-audit.md`
5. `.memory-bank/ion-dex-nuke/official-source-index.md`
6. `SESSION_STATE.md`

## Data Integration Order

1. Resolve official or reviewed source.
2. Define typed adapter and response shape.
3. Include source, timestamp, stale flag, and request ID.
4. Wire backend/API first.
5. Wire frontend to typed API.
6. Add success, upstream error, timeout, and stale-data tests.
7. Never use empty lists, fake values, or pseudo-code to fill the UI.

## Wallet/Profile Integration Order

1. Inspect official ION wallet source / SDK / docs before ION-native assumptions.
2. Implement wallet adapter contracts:
   - provider detection
   - connect
   - account / chain metadata
   - sign request
   - disconnect
   - error codes
3. Keep private keys and seed phrases outside the app.
4. Route all profile data through `profile-service` or reviewed wallet/profile media sources.
5. The right-top avatar is the Profile Hub, not a simple connect button.

## Transaction Flow

All asset-affecting actions follow:

```text
idle -> simulating -> ready_to_sign -> signing -> broadcasting -> pending -> confirmed | failed
```

Required UI before signing:

- Human-readable signing summary.
- Source and destination chain.
- Token, amount, fee, minimum received or expected result.
- Price impact or risk notice.
- Domain re-resolution result when `.ion` is involved.
- Extra confirmation for high-risk bridge/domain/large actions.

## Seven EVM Wallet Detection

Use the reviewed detector list in `.memory-bank/live-data-reference.md`. Do not invent provider fields without source review.

## ION Native Wallets

Required before implementation:

- Confirm ION Browser Wallet injection and signing API.
- Confirm Online+ Wallet dApp integration API.
- Confirm WalletConnect path for ION/EVM signing.
- Confirm address format and display rules from official ION source.

## Verification

- `ION_UI_STRICT=1 node scripts/dev-preflight.mjs`
- Encoding check.
- Frontend verify and audit.
- Backend verify, audit, and stress for data work.
- Browser visual walkthrough for UI work.
- 100-pass gate for completed feature milestones.
