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

## Full ION Ecosystem (All Local)

All repos cloned by Master to `D:\openclaw-tools\`:

| 仓库 | 路径 | 用途 |
|------|------|------|
| `ice-blockchain-bridge` | `D:\openclaw-tools\ice-blockchain-bridge` | **完整桥合约** — Solidity(BSC端) + FunC(ION端), 19文件 |
| `ion-bridge-deploy` | `D:\openclaw-tools\ion-bridge-deploy` | 桥部署脚本 + .fif文件, 70文件 |
| `ice-swap` | `D:\openclaw-tools\ice-swap` | Swap + Bridge Router + 部署器, 90文件 |
| `ion-address-book` | `D:\openclaw-tools\ion-address-book` | 官方合约地址簿 |
| `ion-indexer` | `D:\openclaw-tools\ion-indexer` | 链上索引器 v2 |
| `ion-indexer-v3` | `D:\openclaw-tools\ion-indexer-v3` | 链上索引器 v3 |
| `ion-http-api` | `D:\openclaw-tools\ion-http-api` | HTTP API (Go) |
| `ion-go` | `D:\openclaw-tools\ion-go` | Go SDK |
| `ion-browser-wallet` | `D:\openclaw-tools\ion-browser-wallet` | 浏览器钱包扩展 |
| `heimdall` | `D:\openclaw-tools\heimdall` | ION Identity 身份系统 |

### 官桥核心发现

**ION 链桥合约（已内建主网）：**

| 合约 | 配置参数 | 功能 |
|------|---------|------|
| `multisig-code.fc` | config_param(71) | n-of-k 多签钱包，验证者签完 k 个名后执行链上操作 |
| `votes-collector.fc` | config_param(72) | 收集验证者 ECDSA 签名，批准跨链事件 |

**验证者多签桥流程：**
```
BSC事件 → 验证者观测 → 签ECDSA → 收集到k个签名 → votes-collector放行
ION事件 → 验证者观测 → multisig-code投票 → k个签名 → 桥地址执行BSC操作
```

**`ice-blockchain-bridge/solidity/Bridge.sol`（BSC端）已完成：**
- 多签验证者桥（≥2/3签名）
- `voteForMinting()` / `voteForBurning()` — 铸造/销毁跨链ION
- `WrappedION.sol` — BSC端包装代币
- `SignatureChecker.sol` — ECDSA签名验证
- `IONBridgeRouterMainnetDeployer.sol` — 主网部署器

**缺失（BSC端）：**
1. BSC多签合约（Solidity，镜像ION的multisig-code.fc）
2. BSC事件中继服务（Node.js，监控双链）
3. PancakeSwap LP创建脚本

**桥不需要从零写。** 只需：
1. 升级 Solidity 版本（0.7.0 → 0.8.26）
2. 对接 BSCVault.sol
3. 创建 PancakeSwap ION/USDT LP

**PancakeSwap BSC 主网地址：**
- Router V2: `0x10ED43C718714eb63d5aA57B78B54704E256024E`
- Factory V2: `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73`
- USDT: `0x55d398326f99059fF775485246999027B3197955`

## Important Caveat

The official repository is a node/tooling/reference contract monorepo. It does not provide a ready-made DEX, AMM, staking, burn, bridge, or router contract. DEX-specific contracts must be designed separately while reusing official style, patterns, and interfaces where appropriate. When working on bridge/DEX, FIRST inspect the ecosystem repos above.

## Usage Rules

- Do not copy official code blindly.
- Cite the local source file used for each architectural decision.
- For ION DNS/domain work, start from `dns-auto-code.fc` and `dns-manual-code.fc`.
- For governance/security patterns, study `multisig-code.fc` and wallet contracts.
- For client/API planning, inspect `tonlib`, `lite-client`, and TL schemes.
- Record any reusable finding in `docs/99-current-progress.md` or Memory Bank.
