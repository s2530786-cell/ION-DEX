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
| ION wallet connection SDK/API | Pending | Required for ION Browser Wallet and Online+ integration. |
| Online+ wallet dApp integration API | Pending | Must verify provider object, signing methods, and mobile deep links. |
| ION mainnet burn address | Pending | Must come from official repo/docs/address book, not guessed. |
| BSC ION token contract address | Pending | Required for BSC burn stats, bridge, and token list. |
| BSC ION burn address | Confirmed by requirement | `0x000000000000000000000000000000000000dEaD`. |
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

## Production Rule

Any value marked `Pending` must stay configurable through environment variables, admin config, or governance-controlled contract storage until confirmed.
