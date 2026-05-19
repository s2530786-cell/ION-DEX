# ION Official Ecosystem — Cloned Repos Reference

**Cloned by Master, all on D drive. DO NOT CLONE AGAIN — use what's already local.**

---

## Bridge Code (P0 — 最高优先级，可直接复用)

### 主仓库：`D:\openclaw-data\workspace\ice-blockchain-bridge`
| 文件 | 用途 | 状态 |
|------|------|------|
| `solidity/Bridge.sol` | BSC 端多签桥合约 (≥2/3 签名) | ✅ 完整 |
| `solidity/BridgeInterface.sol` | 桥接口定义 | ✅ 完整 |
| `solidity/WrappedION.sol` | BSC 端 ION 包装代币 (ERC20) | ✅ 完整 |
| `solidity/SignatureChecker.sol` | ECDSA 签名验证 | ✅ 完整 |
| `solidity/IonUtils.sol` | ION 工具函数 | ✅ 完整 |
| `solidity/Ownable.sol` | 所有权管理 | ✅ 完整 |
| `solidity/ERC20.sol` | ERC20 标准实现 | ✅ 完整 |
| `func/bridge_code.fc` | ION 链桥合约 | ✅ 完整 |
| `func/votes-collector.fc` | ION 链投票收集器 | ✅ 完整 |
| `func/multisig-code.fc` | ION 链多签钱包 | ✅ 完整 |
| `func/bridge-config.fc` | ION 链桥配置读取 | ✅ 完整 |
| `func/message_utils.fc` | 消息发送辅助 | ✅ 完整 |

**适配清单：**
1. Solidity 0.7.0 → 0.8.26（移除 `experimental ABIEncoderV2`、更新 `require` 格式）
2. 桥地址从 config_param(72) 读取 → 我们的 `BSCVault.sol` 对接
3. 升级 OpenZeppelin v4 → v5 (contracts/bsc/lib/ 已有)
4. 添加 PancakeSwap LP 交互接口

### 桥前端：`D:\openclaw-data\workspace\ice-blockchain-bridge-v2`
| 文件 | 用途 |
|------|------|
| `package.json` | Nuxt.js 项目，Vue 2 |
| `README.md` | 开发文档 |

### 桥部署：`D:\openclaw-data\workspace\ion-bridge-deploy`
| 文件 | 用途 |
|------|------|
| `deploy-with-wallet.mjs` | ION 链桥部署脚本 (Node.js + @ton/ton) |
| `bridge_code.fc` | 桥合约 FunC |
| `build-collector*.fif` | 投票收集器构建脚本 (多种 chain_id) |
| `build-config71.fif` | Config 71 (多签) 配置构建 |
| `deploy-vault*.fif` | Vault 部署 (多种数据格式) |
| `deploy-router.fif` | Router 部署 |

---

## Swap / DEX 代码

### `D:\openclaw-data\workspace\ion-official\ice-swap`
| 文件 | 用途 |
|------|------|
| `contracts/IONSwap.sol` | ION Swap 主合约 |
| `contracts/IONBridgeRouter.sol` | 桥路由合约 |
| `contracts/IONBridgeRouterMainnetDeployer.sol` | 主网部署器 |
| `contracts/IONBridgeRouterTestnetDeployer.sol` | 测试网部署器 |
| `contracts/WrappedION.sol` | 包装 ION |
| `contracts/Bridge.sol` | 桥合约 (与 bridge 仓库重复) |
| `contracts/SignatureChecker.sol` | 签名验证 |
| `contracts/ICEToken.sol` | ICE 代币 |

### `D:\openclaw-data\workspace\ion-official-dex\ice-blockchain-dex-core-v2-af0a955`
| 目录 | 用途 |
|------|------|
| `contracts/` | DEX v2 核心合约 |
| `test/` | 测试 |
| `scripts/` | 脚本 |

---

## 基础设施（直接可用，无需重造）

| 仓库 | 路径 | 用途 | 状态 |
|------|------|------|------|
| `ion-address-book` | `D:\openclaw-data\workspace\ion-official\ion-address-book` | 官方合约地址 (system.yaml, validators.yaml, exchanges.yaml) | ✅ |
| `ion-indexer` | `D:\openclaw-data\workspace\ion-official\ion-indexer` | 区块/交易索引器 v2 | ✅ |
| `ion-indexer-v3` | `D:\openclaw-data\workspace\ion-official\ion-indexer-v3` | 索引器 v3 (推荐) | ✅ |
| `ion-http-api` | `D:\openclaw-data\workspace\ion-official\ion-http-api` | HTTP API 服务 | ✅ |
| `ion-go` | `D:\openclaw-data\workspace\ion-official\iongo` | Go SDK | ✅ |
| `openionapi` | `D:\openclaw-data\workspace\ion-official\openionapi` | Open API 规范 | ✅ |
| `heimdall` | `D:\openclaw-data\workspace\ion-official\heimdall` | ION Identity 身份系统 | ✅ |
| `ion-framework` | `D:\openclaw-data\workspace\ion-official\ion-framework` | Flutter 框架 (钱包集成) | ✅ |
| `ion-browser-wallet` | `D:\openclaw-data\workspace\ion-official\ion-browser-wallet` | 浏览器钱包扩展 | ✅ |
| `ion-gateway` | `D:\openclaw-data\workspace\ion-official\ion-gateway` | Gateway 服务 | ✅ |
| `ion-controller` | `D:\openclaw-data\workspace\ion-official\ion-controller` | 控制器 | ✅ |

---

## 早期 DEX 代码（可参考，不直接使用）

| 仓库 | 路径 | 备注 |
|------|------|------|
| `ion-dex` | `D:\openclaw-data\workspace\ion-dex` | 早期版本 |
| `ion-dex-audit` | `D:\openclaw-data\workspace\ion-dex-audit` | 审计记录 |
| `ion-dex-did-full-final` | `D:\openclaw-data\workspace\ion-dex-did-full-final` | DEX + DID 集成版 |
| `ion-dex-frontend` | `D:\openclaw-data\workspace\ion-dex-frontend` | 前端 |
| `ion-dex-official` | `D:\openclaw-data\workspace\ion-dex-official` | 官方版 |
| `iondex` | `D:\openclaw-data\workspace\iondex` | 早期 DEX |

---

## 外部依赖地址（BSC 主网，已确认）

| 合约 | 地址 | 用途 |
|------|------|------|
| PancakeSwap Router V2 | `0x10ED43C718714eb63d5aA57B78B54704E256024E` | ION/USDT 交换 |
| PancakeSwap Factory V2 | `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73` | 创建 LP 对 |
| USDT (BSC) | `0x55d398326f99059fF775485246999027B3197955` | 交易对基础资产 |
| BSC Dead Address | `0x000000000000000000000000000000000000dEaD` | 燃烧地址 |

---

## 🏗️ 桥建设指令（Cursor 下一步）

### 不要做的事
- ❌ 不要自己写 Bridge.sol — 直接从 `ice-blockchain-bridge/solidity/Bridge.sol` 改
- ❌ 不要自己写 SignatureChecker — 已有
- ❌ 不要自己写 WrappedION — 已有
- ❌ 不要重新设计桥协议 — 官桥已生产运行

### 要做的事
1. 拷贝 `ice-blockchain-bridge/solidity/` → `ion-dex-nuke/contracts/bsc/src/bridge/`
2. 升级 Solidity 版本 0.7.0 → 0.8.26
3. 对接 `BSCVault.sol` 的存取接口
4. 添加 PancakeSwap Router 接口调用
5. 写 BSC 端部署脚本 (Foundry)
6. 写 ION 端部署脚本 (复用 `ion-bridge-deploy/`)
7. 写 Relayer 服务 (Node.js, 监控双链)
8. 写 PancakeSwap LP 创建脚本
9. 写 `BridgePage.tsx` 前端页面
10. 联调测试：ION 链 ION → 桥 → BSC ION → PancakeSwap 可交易

### PancakeSwap LP 创建流程
```
1. 部署 BSCBridge.sol (改自官桥)
2. 部署 WrappedION.sol (BSC 端)
3. 桥少量 ION 到 BSC (测试)
4. 调用 PancakeSwap Factory.createPair(WrappedION, USDT)
5. addLiquidity(WrappedION, USDT, amountION, amountUSDT, ...)
6. 验证 LP 代币到账 + 价格合理
7. 开放前端 Bridge 页面
```
