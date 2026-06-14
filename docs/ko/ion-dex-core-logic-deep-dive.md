**Languages:** [English](../ion-dex-core-logic-deep-dive.md) | [简体中文](../zh-CN/ion-dex-core-logic-deep-dive.md) | [繁體中文](../zh-TW/ion-dex-core-logic-deep-dive.md) | [Русский](../ru/ion-dex-core-logic-deep-dive.md) | [Español](../es/ion-dex-core-logic-deep-dive.md) | [Português](../pt/ion-dex-core-logic-deep-dive.md) | [العربية](../ar/ion-dex-core-logic-deep-dive.md) | [Français](../fr/ion-dex-core-logic-deep-dive.md) | [Deutsch](../de/ion-dex-core-logic-deep-dive.md) | [日本語](../ja/ion-dex-core-logic-deep-dive.md) | [한국어](./ion-dex-core-logic-deep-dive.md) | [हिन्दी](../hi/ion-dex-core-logic-deep-dive.md) | [Türkçe](../tr/ion-dex-core-logic-deep-dive.md) | [Italiano](../it/ion-dex-core-logic-deep-dive.md) | [Bahasa Indonesia](../id/ion-dex-core-logic-deep-dive.md) | [Tiếng Việt](../vi/ion-dex-core-logic-deep-dive.md) | [ไทย](../th/ion-dex-core-logic-deep-dive.md) | [Polski](../pl/ion-dex-core-logic-deep-dive.md)

# ION Official DEX Core Logic Deep Dive

Source: ice-blockchain/dex-core-v2 + ice-swap + infinity-periphery Date: 2026-05-30 Purpose: Complete understanding of official DEX code for ION DEX development


## 여기서 시작

- [ION Official DEX Core Logic Deep Dive (English)](../ion-dex-core-logic-deep-dive.md)
- [Contracts Overview](./contracts-overview.md)
- [문서 허브](./index.md)
- [whitepaper 인덱스](./whitepaper-index.md)

## Key Sections

- I. Architecture Overview — Three-Layer DEX System
- II. dex-core-v2 — ION Chain DEX Core (FunC)
- A. Router (`router.fc`)
- B. Pool (`pool.fc` → `constant_product/pool.fc`)
- C. LP Account (`lp_account.fc`)
- D. LP Wallet (`lp_wallet.fc`)
- E. Vault (`vault.fc`)
- F. Deployer (`deployer.fc`)
- III. ice-swap — BSC Swap + Bridge (Solidity)
- A. IONSwap.sol

## 다음 읽을거리

- [Technical Architecture](./03-technical-architecture.md)
- [Swap Router Minimum Output Enforcement](./24-swap-router-minimum-output.md)
- [Official Addresses And Open Assumptions](./01-official-addresses-and-assumptions.md)

> 참고: 이 언어 경로는 안정적인 공개 읽기 입구를 제공합니다. 최종 정본은 여전히 영어 공개 문서입니다.

