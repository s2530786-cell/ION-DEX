# Official Source Index

## Confirmed official local repository

- Path: `D:/openclaw-tools/ion`
- Git remote: `https://github.com/ice-blockchain/ion`
- Branch: `master`
- README description: `Reference implementation of ION Node and tools`
- README confirms this is the main ION monorepo including node/validator, lite-client, tonlib, FunC compiler, etc.

## Important README facts

- Master branch is the stable branch used by mainnet.
- Testnet branch contains new updates before merging into master.
- ION dApp developers are pointed to TON smart contract and dApp docs.
- Official public APIs mentioned:
  - Indexer: `https://api.mainnet.ice.io/indexer/v3/index.html`
  - HTTP API: `https://api.mainnet.ice.io/http/v2/`

## Reusable source areas for ION DEX

### Node/tooling/reference

- `validator/`: validator and consensus implementation.
- `lite-client/`: lite client tooling.
- `tonlib/`: client library layer.
- `crypto/func/`: FunC compiler/tests.
- `tl/generate/scheme/`: TL API schemes including `ton_api.tl`, `tonlib_api.tl`, `lite_api.tl`.

### Smart contract references

`D:/openclaw-tools/ion/crypto/smartcont/` contains official/reference FunC contracts:

- `stdlib.fc`: FunC standard library helpers.
- `wallet3-code.fc`, `wallet-code.fc`, `simple-wallet-code.fc`, `highload-wallet-code.fc`, `highload-wallet-v2-code.fc`: wallet references.
- `multisig-code.fc`: multisig reference.
- `dns-auto-code.fc`, `dns-manual-code.fc`: DNS resolver/registration references.
- `payment-channel-code.fc`: payment channel reference.
- `elector-code.fc`, `config-code.fc`: system/elector/config contracts.

## DEX-specific caveat

This repository does NOT appear to contain ready-made DEX, AMM, staking, burn, bridge, router, liquidity mining, or Jetton DEX contracts. The DEX contracts must be designed separately while reusing official patterns and libraries from the smart contract references above.

## How to use this source later

- For ION DNS/domain features: study `dns-auto-code.fc` and `dns-manual-code.fc` first.
- For multisig/timelock/governance security patterns: study `multisig-code.fc` and wallet contracts.
- For wallet compatibility: study wallet and highload wallet contracts plus tonlib/lite-client APIs.
- For FunC style and low-level helper functions: use `stdlib.fc`, `mathlib.fc`, and `crypto/func/test` examples.
- Do not copy code blindly into DEX contracts. Every reused pattern needs threat modeling, tests, and audit review.