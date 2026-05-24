# ION 测试网部署清单（P0-1b）

**网络**: ION testnet — RPC `https://api.testnet.ice.io/http/v2/jsonRPC`  
**广播 API**: `POST https://api.testnet.ice.io/http/v2/sendBoc`  
**前提**: FunC 13/13 编译 100× 已通过（`node scripts/compile-func.mjs`）

> CI 与 verify 脚本 **不会** 自动广播交易。仅在受信机器、测试网钱包、人工确认后执行。

---

## 1. 环境变量（必填）

| 变量 | 说明 |
|------|------|
| `ION_DEPLOY_OWNER_ADDRESS` | 部署者/管理员 ION 钱包地址 |
| `ION_DEPLOY_LP_RECIPIENT` | LP 手续费接收地址 |
| `ION_DEPLOY_TREASURY_RECIPIENT` | 国库接收地址 |
| `ION_DEPLOY_INSURANCE_RECIPIENT` | 保险/质押+开发接收地址 |
| `ION_DEPLOY_TOKEN0_ADDRESS` | 交易对 token0 |
| `ION_DEPLOY_TOKEN1_ADDRESS` | 交易对 token1 |
| `ION_DEPLOY_NETWORK` | `testnet`（默认） |
| `ION_DEPLOY_ALLOW_LIVE` | `1`（preflight） |
| `ION_DEPLOY_BROADCAST` | `1`（plan/send 阶段） |

可选：`ION_DEPLOY_RPC_URL`、`ION_FIFT_EXE`、`ION_TOOLCHAIN_ROOT`、`ION_SMARTCONT_DIR`。

Send 阶段额外需要：

| 变量 | 说明 |
|------|------|
| `ION_DEPLOY_WALLET_BASE` | wallet-v3 文件前缀（`.pk` / `.addr`） |
| `ION_DEPLOY_WALLET_SEQNO` | 钱包 seqno |
| `ION_DEPLOY_CONFIRM` | 精确字符串 `YES BROADCAST to testnet` |

**禁止** 使用主网私钥；测试网水龙头另行领取 gas。

---

## 2. 部署顺序（链上）

1. **FeeDistributor** — 设置 LP / Treasury / Insurance bps（默认 5000 / 1000 / 4000）
2. **Router** — `protocol_fee_bps` + 绑定 FeeDistributor
3. **Pool** — 交易对池；绑定 router、fee_distributor、sandwich guard
4. **Router 注册池** — `op::deploy_pool`
5. **Vault** — 绑定 token + router
6. **staking-pool**、**BridgeInbox**、**DNS 套件** — 按产品需要

当前 `deploy-live-send.fif` 已实现 **FeeDistributor** 段；Router/Pool/Vault 沿用同一 BoC + sendBoc 模式扩展（见 `contracts/ion/deploy/compile-and-deploy.md`）。

---

## 3. Windows 一键预检（不广播）

```powershell
Set-Location D:\openclaw-tools\ion-dex-nuke
# 设置 ION_DEPLOY_* 地址后：
.\scripts\deploy-ion-testnet.cmd
```

步骤：FunC 编译检查 → live preflight → plan 模式生成 StateInit BoC（若 fift 可用）。

---

## 4. 生成 BoC（plan）

```powershell
$env:ION_DEPLOY_BROADCAST = "1"
$env:ION_DEPLOY_SEND_MODE = "plan"
$env:ION_DEPLOY_CONFIRM = "YES BROADCAST to testnet"
powershell -File scripts/deploy-fift-live-send.ps1 -Network testnet -SendMode plan
```

输出（gitignore）：`contracts/ion/deploy/out/fee-distributor-state-init.boc`

---

## 5. 提交 BoC（operator）

```powershell
node scripts/submit-ion-testnet-boc.mjs `
  --boc contracts/ion/deploy/out/fee-distributor-state-init.boc `
  --confirm "YES BROADCAST to testnet"
```

或使用 send 模式生成的 wallet-query BoC（需 wallet 文件 + seqno）。

---

## 6. 部署后验收

- [ ] RPC 返回新合约地址（explorer / lite-client）
- [ ] 将地址写入 `frontend/src/config/contracts.ts` 或 env 覆盖层
- [ ] 前端 wagmi / ION 钱包能读取池子/路由状态（非 placeholder revert）
- [ ] 记录到 `SESSION_STATE.md` 与 `docs/99-current-progress.md`
- [ ] 重跑 `scripts\verify-full-save-log.cmd --no-pause`

---

## 7. BSC 测试网（配套）

```powershell
# contracts/.env（勿提交私钥）
# BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
# PRIVATE_KEY=0x...

cd contracts
forge script script/Deploy.s.sol --rpc-url $env:BSC_TESTNET_RPC --broadcast -vvvv
```

部署产物：`FeeReceiver`、`IonSwapRouter`、`DexSwap`、`LiquidityPool`、`StakeReward`、`IonBurn`（见 `Deploy.s.sol` 日志）。

---

## 8. 相关脚本

| 脚本 | 用途 |
|------|------|
| `scripts/deploy-ion-testnet.cmd` | 测试网预检编排 |
| `scripts/deploy-fift-live.mjs` | 生成 preflight fift |
| `scripts/deploy-fift-live-send.mjs` | plan/send BoC |
| `scripts/submit-ion-testnet-boc.mjs` | HTTP sendBoc |
| `scripts/compile-func.mjs` | FunC 100× 编译 |
| `contracts/ion/deploy/LIVE-DEPLOY.md` | 详细操作手册 |
