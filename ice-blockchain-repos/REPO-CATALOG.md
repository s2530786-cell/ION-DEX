# Ice Open Network Official Repos — Categorized Index

> Source: github.com/ice-blockchain (87 repos)
> Local: D:\openclaw-tools\ion-dex-nuke\ice-blockchain-repos\
> Date: 2026-05-30

---

## 1. Core Blockchain / Node

| Repo | Description |
|------|-------------|
| ion | Main blockchain node (C++ / TON fork) |
| ion-framework | Node framework |
| ion-controller | Node controller |
| myionctrl | Node control utility |
| heimdall | Node monitoring / validator |
| subzero | Node infrastructure component |
| cometbft | CometBFT consensus (current) |
| cometbft_old | CometBFT (legacy) |
| go | Go language toolchain / bindings |

## 2. ION Identity (Pillar 1)

| Repo | Description |
|------|-------------|
| dns-contract | Decentralized DNS on ION |
| openionapi | Open API for ION identity / naming |

## 3. ION Connect (Pillar 2 — Social)

| Repo | Description |
|------|-------------|
| nostr-dart | Nostr protocol (Dart) |
| nostr-nips | Nostr NIPs implementation |
| nostr-sdk-ios | Nostr SDK for iOS |
| dart-nip44 | NIP-44 encryption (Dart) |
| go-nostr | Nostr protocol (Go) |

## 4. ION Liberty (Pillar 3 — Proxy / CDN / Privacy)

| Repo | Description |
|------|-------------|
| Tonutils-Proxy | Decentralized proxy (Frostbyte base) |

## 5. ION Vault (Pillar 4 — Storage)

| Repo | Description |
|------|-------------|
| tonutils-storage | Decentralized storage utilities |

## 6. Smart Contracts (TON / FunC)

| Repo | Description |
|------|-------------|
| wallet-contract | Wallet contract (v4) |
| wallet-contract-v5 | Wallet contract (v5) |
| multisig-contract-v2 | Multisig wallet contract |
| token-contract | Fungible token (jetton) contract |
| minter-contract | Token minter contract |
| stablecoin-contract | Stablecoin contract |
| governance-contract | On-chain governance |
| vesting-contract | Token vesting contract |
| lockup-wallet-contract | Lockup wallet contract |
| nominator-pool | Nominator pool contract |
| liquid-staking-contract | Liquid staking contract |
| dns-contract | DNS contract |
| jetton_dao | Jetton DAO contract |
| modern_jetton | Modern jetton implementation |
| pton-contracts | PTON contracts |
| tc-vesting-contract | TC vesting contract |

## 7. Bridge (Cross-chain)

| Repo | Description |
|------|-------------|
| bridge | Bridge core |
| bridge-func | Bridge (FunC implementation) |
| bridge-solidity | Bridge (Solidity / EVM) |
| token-bridge | Token bridge |
| token-bridge-func | Token bridge (FunC) |
| token-bridge-solidity | Token bridge (Solidity / EVM) |

## 8. DEX / Trading

| Repo | Description |
|------|-------------|
| dex-core-v2 | DEX core (v2) |
| ice-swap | Swap implementation |
| infinity-periphery | DEX periphery contracts |

## 9. Indexer / Data

| Repo | Description |
|------|-------------|
| ion-indexer | ION indexer (v1) |
| ion-indexer-v3 | ION indexer (v3, current) |
| ion-index-go | ION indexer (Go) |
| ion-index-worker | Indexer worker |

## 10. Explorer

| Repo | Description |
|------|-------------|
| ion-explorer-deprecated | Explorer (deprecated) |

## 11. Wallet / Browser Extension

| Repo | Description |
|------|-------------|
| ion-browser-wallet | Browser-based wallet |
| ion-chrome-wallet | Chrome extension wallet |
| wallets-list | Wallet registry |

## 12. HTTP API / Gateway

| Repo | Description |
|------|-------------|
| ion-http-api | HTTP API for ION |
| ion-gateway | ION gateway |
| ion-gateway-reactjs-example | Gateway React example |

## 13. Mobile App

| Repo | Description |
|------|-------------|
| mobile-app | Mobile application |
| qr_code_scanner | QR code scanner component |
| ion-address-book | Address book |

## 14. NFT / Metadata

| Repo | Description |
|------|-------------|
| ion-nft-metadata | NFT metadata service |

## 15. Vesting / Tokenomics

| Repo | Description |
|------|-------------|
| vesting | Vesting infrastructure |
| vesting-contract | Vesting contract |

## 16. Tools / Utilities

| Repo | Description |
|------|-------------|
| address-util | Address utility |
| iongo | ION Go SDK |
| tonweb | TON Web SDK |
| tonutils-go | TON utilities (Go) |
| fastText | Text processing library |
| es_compression | Compression utility |
| go-tarantool | Tarantool (Go) |
| greenfield-go-sdk | Greenfield Go SDK |

## 17. Flutter / UI Components

| Repo | Description |
|------|-------------|
| flutterfire | Firebase Flutter |
| flutter-quill | Rich text editor |
| flutter_cache_manager | Cache manager |
| flutter_local_notifications | Local notifications |
| flutter-passkeys | Passkeys support |
| flutter-tflite | TFLite for Flutter |
| markdown_quill | Markdown + Quill |
| appsflyer-flutter-plugin | AppsFlyer analytics |
| dio | HTTP client |

## 18. Other / Forked

| Repo | Description |
|------|-------------|
| eskimo | Internal tool / codename |
| freezer | Internal tool / codename |
| husky | Internal tool / codename |
| santa | Internal tool / codename |
| snowface | Internal tool / codename |
| wintr | Internal tool / codename |
| community-assets | Community branding assets |
| ffmpeg-kit | FFmpeg toolkit |
| pulse | Pulse monitoring |
| supabase | Supabase integration |
| core-v2 | Core v2 component |

---

## Summary by Category

| Category | Count | Key Repos |
|----------|-------|-----------|
| Core Blockchain / Node | 9 | ion, ion-framework, cometbft |
| ION Identity | 2 | dns-contract, openionapi |
| ION Connect (Social) | 5 | nostr-dart, nostr-nips |
| ION Liberty (Proxy) | 1 | Tonutils-Proxy |
| ION Vault (Storage) | 1 | tonutils-storage |
| Smart Contracts | 16 | wallet-contract-v5, token-contract, governance |
| Bridge | 6 | bridge-solidity, token-bridge |
| DEX / Trading | 3 | dex-core-v2, ice-swap |
| Indexer / Data | 4 | ion-indexer-v3 |
| Explorer | 1 | ion-explorer-deprecated |
| Wallet | 3 | ion-chrome-wallet |
| HTTP API / Gateway | 3 | ion-gateway, ion-http-api |
| Mobile App | 3 | mobile-app |
| NFT | 1 | ion-nft-metadata |
| Vesting | 2 | vesting, vesting-contract |
| Tools / Utilities | 8 | iongo, tonweb, tonutils-go |
| Flutter / UI | 9 | flutterfire, flutter-quill |
| Other / Codenames | 9 | eskimo, freezer, husky, santa, snowface, wintr |
| **Total** | **87** | |

---

## ION DEX Integration Priority

### P0 — Must study deeply
- ion (main chain code)
- dex-core-v2 (official DEX core)
- ice-swap (official swap)
- ion-indexer-v3 (data access)
- ion-chrome-wallet (wallet integration)
- bridge-solidity / token-bridge-solidity (cross-chain)

### P1 — Important reference
- wallet-contract-v5 (wallet integration)
- token-contract / minter-contract (token integration)
- ion-http-api / ion-gateway (API access)
- dns-contract (identity/naming)
- governance-contract (governance)

### P2 — Medium-term reference
- ion-framework / ion-controller (node operations)
- Tonutils-Proxy (Liberty / Frostbyte)
- nostr-dart (Connect / social)
- tonutils-storage (Vault)
- mobile-app (mobile strategy)

### P3 — Awareness only
- Flutter components
- Internal codename repos
- Community assets
