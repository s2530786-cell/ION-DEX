# 🚀 P3-TASK-006: 测试网部署 + E2E 验证

## 优先级
🟩 P3 — 前三阶段都完成后再做

## 目标
1. FunC 合约部署到 ION 测试网
2. Solidity 合约部署到 BSC 测试网
3. E2E 测试：完整交易流通过

## Step 1: ION 测试网部署

**确认测试网信息：**
```powershell
# 查找 ION 测试网配置
curl -s $env:HTTPS_PROXY https://api.testnet.ice.io/ 2>$null
```

ION 链部署需要用 `sendBoc` 方式：
```javascript
const deployResult = await fetch('https://api.testnet.ice.io/http/v2/sendBoc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ boc: fift_output_base64 })
});
```

**部署顺序：**
1. 先部署 `common.fc` 依赖
2. 部署 `pool.fc`（AMM 池核心）
3. 部署 `router.fc`
4. 部署 `vault.fc`
5. 部署 `staking-pool.fc`
6. 部署 `deployer.fc`
7. 部署剩余合约

## Step 2: BSC 测试网部署

```powershell
cd D:\openclaw-tools\ion-dex-nuke\contracts\bsc

# 1. 创建部署脚本
# contracts/bsc/script/Deploy.s.sol

# 2. 设置测试网 .env
echo "BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545" >> .env
echo "PRIVATE_KEY=your_test_wallet_pk" >> .env

# 3. 部署
D:\openclaw-tools\foundry\bin\forge.exe script script/Deploy.s.sol --rpc-url $env:BSC_TESTNET_RPC --broadcast -vvvv
```

## Step 3: E2E 集成测试

经过前面 5 个任务，我们已有：
- ✅ FunC 合约部署到 ION 测试网
- ✅ Solidity 合约部署到 BSC 测试网
- ✅ 前端对接真实合约
- ✅ UI 打磨完毕

最终 E2E 验证流程：
1. 打开前端页面 → 连接钱包（OKX / MetaMask）
2. 选择 ION 测试网的代币进行 Swap
3. 添加流动性（Add Liquidity）
4. 查看 Pool 页面显示新池子
5. 使用 Stake/Unstake 功能
6. 尝试代币创建（Token Launch）
7. 确认费用显示为 ION

## Step 4: CI 更新

```yaml
# .github/workflows/ion-dex-deploy.yml
name: ION DEX Deploy
on:
  push:
    tags:
      - 'v*'

jobs:
  deploy-testnet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge build --via-ir
      - run: forge script script/Deploy.s.sol --rpc-url ${{ secrets.BSC_TESTNET_RPC }} --broadcast
```

## 验收标准
- [ ] ION 测试网上至少部署 pool.fc + router.fc + vault.fc
- [ ] BSC 测试网上至少部署 IonSwapRouter + BSCVault + FeeReceiver
- [ ] 前端通过 wagmi 连接测试网并读出合约状态（不是报错）
- [ ] E2E 流程全部走通（Swap → Add LP → Stake → 验证 ION 费用）
- [ ] CI 配置了 deploy 工作流
- [ ] commit: `feat(deploy): testnet deployment + e2e flow green`

## 铁律提醒
- 测试网有免费水龙头 faucet，不要用主网私钥
- 部署后立刻用 cast 验证：`cast call --rpc-url $RPC $CONTRACT "name()"`
- 部署地址更新到 `frontend/src/config/contracts.ts`
- 不跳过 E2E，不改范围
