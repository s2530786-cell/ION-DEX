**Languages:** [English](../ion-dex-core-logic-deep-dive.md) | [简体中文](./ion-dex-core-logic-deep-dive.md) | [繁體中文](../zh-TW/ion-dex-core-logic-deep-dive.md) | [Русский](../ru/ion-dex-core-logic-deep-dive.md) | [Español](../es/ion-dex-core-logic-deep-dive.md) | [Português](../pt/ion-dex-core-logic-deep-dive.md) | [العربية](../ar/ion-dex-core-logic-deep-dive.md) | [Français](../fr/ion-dex-core-logic-deep-dive.md) | [Deutsch](../de/ion-dex-core-logic-deep-dive.md) | [日本語](../ja/ion-dex-core-logic-deep-dive.md) | [한국어](../ko/ion-dex-core-logic-deep-dive.md) | [हिन्दी](../hi/ion-dex-core-logic-deep-dive.md) | [Türkçe](../tr/ion-dex-core-logic-deep-dive.md) | [Italiano](../it/ion-dex-core-logic-deep-dive.md) | [Bahasa Indonesia](../id/ion-dex-core-logic-deep-dive.md) | [Tiếng Việt](../vi/ion-dex-core-logic-deep-dive.md) | [ไทย](../th/ion-dex-core-logic-deep-dive.md) | [Polski](../pl/ion-dex-core-logic-deep-dive.md)

# ION Official DEX Core Logic Deep Dive

Source: ice-blockchain/dex-core-v2 + ice-swap + infinity-periphery Date: 2026-05-30 Purpose: Complete understanding of official DEX code for ION DEX development


## 从这里开始

- [ION Official DEX Core Logic Deep Dive (English)](../ion-dex-core-logic-deep-dive.md)
- [Contracts Overview](./contracts-overview.md)
- [中文文档中心](./index.md)
- [中文白皮书索引](./whitepaper-index.md)

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

## 下一步阅读

- [Technical Architecture](./03-technical-architecture.md)
- [Swap Router Minimum Output Enforcement](./24-swap-router-minimum-output.md)
- [Official Addresses And Open Assumptions](./01-official-addresses-and-assumptions.md)

> 说明：这条中文路径提供稳定的公开阅读入口；涉及最终措辞、经济参数、安全边界与发布状态时，仍以英文公共文档为准。

