# ION 测试网部署清单（P0-1b）

**网络**: ION testnet (`https://testnet.ice.io` 或项目配置的 RPC)  
**前置**: FunC 13/13 编译绿、`build-func/*.fif` 就绪、钱包助记词/私钥仅通过环境变量注入。

## 1. 环境变量

| 变量 | 说明 |
|------|------|
| `ION_TESTNET_RPC` | 测试网 JSON-RPC |
| `ION_DEPLOY_WALLET_MNEMONIC` 或 `ION_DEPLOY_WALLET_KEY` | 部署钱包（禁止写入仓库） |
| `ION_DEPLOY_ALLOW_LIVE` | 设为 `1` 才允许真实发送 |
| `ION_DEPLOY_BROADCAST` | 设为 `1` 生成可广播 BoC |

## 2. 预检（dry-run）

```powershell
cd D:\openclaw-tools\ion-dex-nuke
node scripts/compile-func.mjs
node scripts/deploy-ion-testnet.mjs --dry-run
```

## 3. 部署顺序（FunC 主链）

按依赖顺序部署并记录地址：

1. **FeeDistributor** — 手续费分配（LP / treasury / insurance bps）
2. **sandwich_guard** — MEV 防护（router 依赖）
3. **Router** — `router.fc`，绑定 FeeDistributor + sandwich
4. **Pool**（每交易对）— 零储备启动 → 注入 LP → `status=2` 启用
5. **Vault** — 跨链/金库逻辑
6. **Deployer** — 后续池子工厂（可选）
7. **BridgeInbox** — 跨链入站（与 BSC Vault 联调）

## 4. BSC 测试网（配对）

```powershell
# 需 PRIVATE_KEY + BSC_TESTNET_RPC
forge script contracts/script/Deploy.s.sol --rpc-url $env:BSC_TESTNET_RPC --broadcast
```

产出：`ION_TOKEN`、`BSC_VAULT`、`BRIDGE_RELAY`、`FEE_RECEIVER`、`ION_SWAP_ROUTER`（见脚本 console.log）。

## 5. 验收

- [ ] 各合约地址写入 `frontend/src/config/contracts.ts` 与 `backend/src/config/contracts.ts`（或通过 `.env` 覆盖）
- [ ] Router `swap` / Pool `add_liquidity` 测试网单笔成功
- [ ] BSC `vault.lock(..., ionProtocolFee)` + relayer `release` 模拟通过
- [ ] `scripts/verify-full-save-log.cmd --no-pause` 全绿

## 6. 参考

- `contracts/ion/deploy/LIVE-DEPLOY.md`
- `contracts/ion/deploy/deploy-checklist.fif`
- `docs/ion-official-canonical-addresses.md`
