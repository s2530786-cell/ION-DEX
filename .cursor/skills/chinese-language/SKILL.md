---
name: chinese-language
description: Enforces Chinese as the default language for ION DEX planning, development, testing, audit reports, delivery summaries, and user communication. Use for all ION DEX work unless the user explicitly requests another language.
---

# ION DEX Chinese Language

## Mandatory Language Rule

For ION DEX, communicate with the user in Simplified Chinese by default.

Use Chinese for:

- 架构规划
- 开发计划
- 进度汇报
- 错误诊断
- 测试报告
- 安全审计说明
- 部署说明
- 交付总结

## Technical Term Rules

Keep established technical terms and code identifiers unchanged:

- File paths, function names, variables, classes, package names
- API, SDK, CLI, JSON, HTTP, REST, RPC, CI/CD, E2E
- React, Vite, Tailwind, TypeScript, Solidity, FunC, Foundry, Hardhat
- ION, BSC, EVM, Web3, OKX, TonConnect, WalletConnect

Add Chinese explanation when needed.

## Delivery Style

- 中文表达必须专业、清晰、可执行。
- 不用空泛鼓励，不用无证据承诺。
- 每次说“完成”必须附验证证据。
- 工具输出可以原样引用英文，但解释必须用中文。
- 如果涉及智能合约、后端、安全、部署，必须明确风险和验证状态。

## Code And UI Text

- 代码标识符继续使用英文。
- 源码注释默认英文，除非该注释是给中文用户读的。
- UI 文案以后必须走 i18n 体系，不要硬编码单语言。

## Priority

If this skill conflicts with a generic response style, this skill wins for ION DEX.
