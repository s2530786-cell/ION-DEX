---
name: ion-official-source
description: Uses the local official ION source repository as the authority for ION DEX architecture work. Use when working with ION FunC contracts, DNS/domain features, wallets, multisig, lite-client, tonlib, validator references, TL schemes, or when the user mentions official ION GitHub code.
---

# ION Official Source

## Source Of Truth

- Local official repository: `D:/openclaw-tools/ion`
- Git remote: `https://github.com/ice-blockchain/ion`
- Description from README: `Reference implementation of ION Node and tools`

Before designing ION-native contracts or integrations, inspect this local repository instead of guessing.

## Required Reads

For relevant work, read the smallest needed subset:

- `D:/openclaw-tools/ion/README.md`
- `D:/openclaw-tools/ion/crypto/smartcont/stdlib.fc`
- `D:/openclaw-tools/ion/crypto/smartcont/dns-auto-code.fc`
- `D:/openclaw-tools/ion/crypto/smartcont/dns-manual-code.fc`
- `D:/openclaw-tools/ion/crypto/smartcont/multisig-code.fc`
- `D:/openclaw-tools/ion/crypto/smartcont/wallet3-code.fc`
- `D:/openclaw-tools/ion/tonlib/`
- `D:/openclaw-tools/ion/lite-client/`
- `D:/openclaw-tools/ion/tl/generate/scheme/`

## Important Caveat

The official repository is a node/tooling/reference contract monorepo. It does not provide a ready-made DEX, AMM, staking, burn, bridge, or router contract. DEX-specific contracts must be designed separately while reusing official style, patterns, and interfaces where appropriate.

## Usage Rules

- Do not copy official code blindly.
- Cite the local source file used for each architectural decision.
- For ION DNS/domain work, start from `dns-auto-code.fc` and `dns-manual-code.fc`.
- For governance/security patterns, study `multisig-code.fc` and wallet contracts.
- For client/API planning, inspect `tonlib`, `lite-client`, and TL schemes.
- Record any reusable finding in `docs/99-current-progress.md` or Memory Bank.
