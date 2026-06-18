**Languages:** [English](../27-ion-dex-scraping-security-integration-v1.md) | [简体中文](../zh-CN/27-ion-dex-scraping-security-integration-v1.md) | [繁體中文](./27-ion-dex-scraping-security-integration-v1.md) | [Русский](../ru/27-ion-dex-scraping-security-integration-v1.md) | [Español](../es/27-ion-dex-scraping-security-integration-v1.md) | [Português](../pt/27-ion-dex-scraping-security-integration-v1.md) | [العربية](../ar/27-ion-dex-scraping-security-integration-v1.md) | [Français](../fr/27-ion-dex-scraping-security-integration-v1.md) | [Deutsch](../de/27-ion-dex-scraping-security-integration-v1.md) | [日本語](../ja/27-ion-dex-scraping-security-integration-v1.md) | [한국어](../ko/27-ion-dex-scraping-security-integration-v1.md) | [हिन्दी](../hi/27-ion-dex-scraping-security-integration-v1.md) | [Türkçe](../tr/27-ion-dex-scraping-security-integration-v1.md) | [Italiano](../it/27-ion-dex-scraping-security-integration-v1.md) | [Bahasa Indonesia](../id/27-ion-dex-scraping-security-integration-v1.md) | [Tiếng Việt](../vi/27-ion-dex-scraping-security-integration-v1.md) | [ไทย](../th/27-ion-dex-scraping-security-integration-v1.md) | [Polski](../pl/27-ion-dex-scraping-security-integration-v1.md)

# ION DEX Scraping Security Integration Checklist

This checklist defines how to integrate the scraping stack into ION DEX and how to isolate offensive security tooling in Docker sandbox profiles.


## 從這裡開始

- [ION DEX Scraping Security Integration Checklist (English)](../27-ion-dex-scraping-security-integration-v1.md)
- [API Overview](./api-overview.md)
- [文件中心](./index.md)
- [白皮書索引](./whitepaper-index.md)

## Key Sections

- 1) Scope and principle
- 2) Target repositories and value
- A-tier (business chain)
- B-tier (controlled scraping lab)
- Sandbox-only (not business main chain)
- 3) Concrete integration points in current backend
- Add new scraping module paths
- Add API routes
- 4) Interface schema (v1)
- Request: `POST /api/scraping/extract`

## 下一步閱讀

- [AI Sentinel Security Test Matrix](./28-ai-sentinel-security-test-matrix-v1.md)
- [AI Sentinel And Gateway Contract](./ai-sentinel-gateway-contract.md)
- [Technical Architecture](./03-technical-architecture.md)


## Extended Reading

- [Security Audit And Stress Sandbox](./23-security-audit-and-stress-sandbox.md)
- [Reference Architecture And External Patterns](./09-reference-architecture.md)
- [Public Development Scope](./28-public-development-scope.md)

> 說明：本語言頁面提供穩定的公開閱讀入口；英文公開文件仍是最終規範來源。
