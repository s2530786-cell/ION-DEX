# Official Addresses And Open Assumptions

This document lists the external facts that must be confirmed before production deployment.
Unconfirmed values must not be hardcoded into contracts or frontend production builds.

## ION Official Repositories Checked

- `ice-blockchain/ion`: ION node, validator, lite-client, tonlib, FunC compiler, and core tooling.
- `ice-blockchain/ion-http-api`: HTTP access layer for ION nodes.
- `ice-blockchain/ion-indexer` / `ice-charon/ion-indexer`: indexer for blocks, transactions, messages, NFTs, Jettons, and DNS domains.
- `ice-blockchain/heimdall`: service behind ION Identity, responsible for account management and first user-platform interaction layer.
- `ice-blockchain/ion-framework`: Flutter-based ION Framework with identity client integration.
- `ice-blockchain/ion-address-book`: official address book candidate for known ecosystem contract addresses.

## Must Confirm Before Mainnet

| Item | Status | Notes |
| --- | --- | --- |
| ION mainnet RPC / HTTP API endpoint | Pending | Required for frontend reads, indexer, and backend services. |
| ION testnet RPC / HTTP API endpoint | Pending | Required for testnet release. |
| ION wallet connection SDK/API | Verified (browser injection) | `ice-blockchain/ion-gateway` TonConnect bridge; Online+ `window.ionmask.ionconnect`; ION Browser `window.tonwallet.tonconnect`. |
| Online+ wallet dApp integration API | Verified (extension) | `ice-blockchain/ion-chrome-wallet` `provider.ts`; mobile deep links still TBD. |
| ION mainnet burn address | **Confirmed** | `UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ` — **Burn Address** in `ice-blockchain/ion-address-book` `source/system.yaml`. |
| BSC ION token contract address | **Confirmed** | `0xe1ab61f7b093435204df32f5b3a405de55445ea8` — see `docs/ion-official-canonical-addresses.md`. |
| BSC ION burn address | **Confirmed** | `0x000000000000000000000000000000000000dEaD` (BSC dead / burn sink). |
| ION total supply source | Pending | Needed for remaining supply calculation. |
| ION DNS resolver contract/API | Pending | Needed for `.ion` resolution and domain transfer UX. |
| `dns.ice.io` public API | Pending | The site appears to be SPA-like; hidden APIs must not be used without permission or stability guarantees. |
| ION Identity / Heimdall API | Pending | Needed for ION ID / KYC Pass verification. |
| CMC API key and plan | Pending | Used by backend market service, not directly by frontend. |
| Treasury wallet address | Pending | Must be multisig-controlled. |
| Team fee wallet address | Pending | Must be public and transparent. |
| Staking reward wallet/pool | Pending | Must be contract-controlled. |
| Oracle signer addresses | Pending | Must be multisig or threshold-managed. |
| Bridge validator addresses | Pending | At least threshold-based, not a single relayer. |

## Working Assumptions

- ION DEX will use ION as the protocol fee token.
- BSC ION burn data will be calculated from transfers to the BSC dead address.
- ION mainnet burn data will be calculated from official burn address transfers once confirmed.
- CMC API is suitable for market display and analytics, but not as a sole on-chain settlement oracle.
- Limit order and grid execution require keeper services.
- Domain resolution must be verified immediately before transfer confirmation.
- ION Identity credentials should be verified as proofs or signed attestations; raw KYC data should not be stored.

## Official Source Iron Law

- **Official `ice-blockchain/*` repositories and confirmed on-chain facts are the standard.** Before implementation, read the relevant repo or `docs/ion-official-canonical-addresses.md`.
- **Do not invent** token names (e.g. wION), wrapper contracts, or burn/bridge flows when official `ice-swap` / `bridge-solidity` or address book already defines behavior.
- **Reuse** `frontend/src/lib/officialIonAddresses.ts` and `backend/src/constants/official-ion-addresses.ts` for BSC ION + burn addresses.

## Production Rule

Any value marked `Pending` must stay configurable through environment variables, admin config, or governance-controlled contract storage until confirmed.
