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

## Iron law (user-mandated)

- **Official existing codebases are the standard.** Read and cite them before every implementation. If official repos, address book, or `docs/ion-official-canonical-addresses.md` already define behavior, **use that** — do not fabricate wrappers (wION), burn paths, or contract APIs.
- Cross-chain bridge: prefer `ice-blockchain/ice-swap` + `bridge-solidity` over DEX-draft shortcuts.
- Retail staking: prefer `ice-blockchain/liquid-staking-contract` (ION → LION) over `contracts/ion/staking-pool.fc` for user-facing official flows.
- Burn analytics: BSC `0x…dEaD` + ION mainnet **Burn Address** `UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ` from `ion-address-book` — not placeholders or Bridge burn alone.
- Confirmed BSC on-chain facts (import from shared constants, do not scatter literals):
  - ION ERC-20: `0xe1ab61f7b093435204df32f5b3a405de55445ea8`
  - Burn sink: `0x000000000000000000000000000000000000dEaD`

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

The `ion` node monorepo does not provide a retail DEX stake UI contract. **Official user liquid staking** lives in `ice-blockchain/liquid-staking-contract` (see `docs/ion-official-staking-reference.md`). DEX `staking-pool.fc` is draft-only. DEX AMM/bridge/burn must still be designed separately while reusing official patterns.

## Usage Rules

- Do not copy official code blindly.
- Cite the local source file used for each architectural decision.
- For ION DNS/domain work, start from `dns-auto-code.fc` and `dns-manual-code.fc`.
- For governance/security patterns, study `multisig-code.fc` and wallet contracts.
- For client/API planning, inspect `tonlib`, `lite-client`, and TL schemes.
- Record any reusable finding in `docs/99-current-progress.md` or Memory Bank.
