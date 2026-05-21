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

## Official cross-chain bridge (not in `ion` node monorepo)

| Repo | Role |
|---|---|
| `ice-blockchain/ice-swap` | Bridge-Swap: `IONSwap` (ICE v1↔v2 on BSC), `Bridge` (ICE v2 BSC↔ION, fork of TON-community bridge-solidity), `IONBridgeRouter` facade (`mint` / `burn`) |
| `ice-blockchain/bridge-solidity` | Upstream TON↔EVM bridge contracts referenced by ice-swap |

Product facts for ION DEX UI copy:

- No separate **wION** brand; BSC `0xe1ab61f7b093435204df32f5b3a405de55445ea8` is the same **ION** asset (18 decimals on BSC).
- **ION → BSC**: confirm transfer on ION Chain, then claim on BSC via Bridge oracle `mint` / router — not a BSC-side wrapper burn during the ION step.
- **BSC → ION**: Bridge burns BSC ION (ICE v2) and credits ION network after quorum.
- Total supply cap **21.1B ION** (non-inflationary narrative).

Frontend reference: `frontend/src/lib/officialBridgeSemantics.ts`.

## Canonical BSC addresses (confirmed — not guessed)

| Field | Address |
|-------|---------|
| ION ERC-20 on BSC | `0xe1ab61f7b093435204df32f5b3a405de55445ea8` |
| BSC burn / dead sink | `0x000000000000000000000000000000000000dEaD` |

Doc: `docs/ion-official-canonical-addresses.md`. Code: `frontend/src/lib/officialIonAddresses.ts`, `backend/src/constants/official-ion-addresses.ts`.

**Iron law:** official `ice-blockchain/*` repos are the standard; consult before coding; do not invent wION or wrapper burn flows.

## Official liquid staking (retail — not `staking-pool.fc`)

| Repo | Role |
|---|---|
| `ice-blockchain/liquid-staking-contract` | Pool + Controller + pool jetton; `pool::deposit` (`0x47d54391`), elector `new_stake` / `recover_stake` |
| `ice-blockchain/ion` → `elector-code.fc` | Validator election system contract (not retail stake UI) |
| `ice-blockchain/nominator-pool` | Large nominator pools (TON-style) |

Product facts:

- Stake **ION** → receive **LION** (liquid receipt jetton).
- Unstake releases at the **next validation round** (~20h per public docs), not DEX mock 7-day locks.
- Official APR is **dynamic** — do not hard-code fixed DEX APR as official.
- ION DEX `contracts/ion/staking-pool.fc` is a **draft fee-reward pool** only.

Doc: `docs/ion-official-staking-reference.md`. Frontend: `frontend/src/lib/officialStakingSemantics.ts`.

## Wallet injection (not in `ice-blockchain/ion` node monorepo)

Verified companion repositories for dApp wallet integration:

| Product | Repository | Injected global | TonConnect bridge field |
|---|---|---|---|
| Online+ / ION Chrome extension | `ice-blockchain/ion-chrome-wallet` (`provider.ts`) | `window.ionmask` | `ionconnect` (+ `window.ion` legacy provider) |
| ION Browser Wallet extension | `ice-blockchain/ion-browser-wallet` (`src/js/extension/provider.js`) | `window.tonwallet` | `tonconnect` (legacy naming; gateway SDK checks `ionconnect`) |
| TonConnect protocol + detection | `ice-blockchain/ion-gateway` (`packages/sdk/src/provider/injected/`) | `window[jsBridgeKey].ionconnect` | Standard detection via `InjectedProvider.isWalletInjected` |

ION DEX frontend adapters: `frontend/src/lib/wallet/ion-official.ts`, `ion-bridge.ts`.

## How to use this source later

- For ION DNS/domain features: study `dns-auto-code.fc` and `dns-manual-code.fc` first.
- For multisig/timelock/governance security patterns: study `multisig-code.fc` and wallet contracts.
- For wallet compatibility: study wallet and highload wallet contracts plus tonlib/lite-client APIs.
- For FunC style and low-level helper functions: use `stdlib.fc`, `mathlib.fc`, and `crypto/func/test` examples.
- Do not copy code blindly into DEX contracts. Every reused pattern needs threat modeling, tests, and audit review.