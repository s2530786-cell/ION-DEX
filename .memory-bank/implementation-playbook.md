# 🔧 真实链上对接操作手册 — Cursor 代码落地指南

> **Master 钦定 2026-05-19 23:53 | 写代码前必读**
> 此文件是 TASK 1 的具体操作步骤。照着做，不要自己猜。

---

## 🔴 动手前先读

```
📜 .cursor/rules/ion-dex-iron-law.mdc       (三红线)
📜 .memory-bank/live-data-reference.md      (所有地址)
📜 .memory-bank/strategy-borrow-liquidity.md (借鸡生蛋)
📜 SESSION_STATE.md                          (本文件)
```

---

## 1. ION 链数据查询 — 具体操作

### 1.1 查全网质押总量 (elector balance)

```typescript
// backend/src/upstream/ion-chain.ts
const ION_RPC = 'https://api.mainnet.ice.io/http/v2/jsonRPC'
const ELECTOR = '-1:3333333333333333333333333333333333333333333333333333333333333333'

async function getTotalStaked(): Promise<number> {
  const res = await fetch(ION_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'getAddressBalance',
      params: { address: ELECTOR },
      id: 1
    })
  })
  const data = await res.json()
  // nanoION → ION: ÷ 1e9
  return Number(data.result) / 1e9
}
```

### 1.2 查区块信息

```typescript
// 当前区块高度和时间
const masterchainInfo = await fetch('https://api.mainnet.ice.io/http/v2/getMasterchainInfo')
// → { last: { seqno: 18714644, gen_utime: ... } }
```

### 1.3 查任意地址余额

```typescript
async function getBalance(address: string): Promise<number> {
  const res = await fetch(ION_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'getAddressBalance',
      params: { address },
      id: 1
    })
  })
  return Number((await res.json()).result) / 1e9
}
```

### 1.4 销毁数据 (addr_none)
```
ION 主链: 销毁走 addr_none (TVM 地址类型 00)，不是 0x0...dEaD
销毁量 = block value_flow.burned 字段 (CurrencyCollection)
直接从区块追踪，不查固定地址
```

---

## 2. BSC 链数据查询 — 具体操作

### 2.1 PancakeSwap 查 ION 价格

```typescript
// frontend/src/lib/ionPrice.ts
import { ethers } from 'ethers'

const BSC_RPC = 'https://bsc-dataseed.binance.org/'
const PANCAKE_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E'
const ION_BSC = '0xe1ab61f7b093435204df32f5b3a405de55445ea8'
const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955'

const routerAbi = [
  'function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)'
]

async function getIonPrice(): Promise<number> {
  const provider = new ethers.JsonRpcProvider(BSC_RPC)
  const router = new ethers.Contract(PANCAKE_ROUTER, routerAbi, provider)
  // 1 ION → USDT
  const amounts = await router.getAmountsOut(
    ethers.parseUnits('1', 18),  // ION: 18 decimals
    [ION_BSC, USDT_BSC]
  )
  return Number(ethers.formatUnits(amounts[1], 18))
}
```

### 2.2 BSC 销毁查询

```typescript
const DEAD_ADDR = '0x000000000000000000000000000000000000dEaD'
const tokenAbi = [
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)'
]

async function getBscBurnStats() {
  const provider = new ethers.JsonRpcProvider(BSC_RPC)
  const token = new ethers.Contract(ION_BSC, tokenAbi, provider)
  const burned = await token.balanceOf(DEAD_ADDR)
  const total = await token.totalSupply()
  return {
    burned: Number(ethers.formatUnits(burned, 18)),
    total: Number(ethers.formatUnits(total, 18)),
    ratio: Number(burned) / Number(total) * 100
  }
}
```

### 2.3 PancakeSwap LP 池查询

```typescript
const FACTORY = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'
const factoryAbi = [
  'function getPair(address tokenA, address tokenB) view returns (address pair)'
]
const pairAbi = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)'
]

async function getPoolReserves() {
  const provider = new ethers.JsonRpcProvider(BSC_RPC)
  const factory = new ethers.Contract(FACTORY, factoryAbi, provider)
  const pairAddr = await factory.getPair(ION_BSC, USDT_BSC)
  const pair = new ethers.Contract(pairAddr, pairAbi, provider)
  const [r0, r1] = await pair.getReserves()
  const t0 = await pair.token0()
  return {
    pair: pairAddr,
    reserve0: ethers.formatUnits(r0, 18),
    reserve1: ethers.formatUnits(r1, 18),
    token0isION: t0.toLowerCase() === ION_BSC.toLowerCase()
  }
}
```

---

## 3. CMC 行情 — 具体操作

```typescript
// backend/src/upstream/cmc.ts
const CMC_BASE = 'https://pro-api.coinmarketcap.com'
const ION_CMC_ID = 27650

async function getMarketData() {
  // ⚠️ CMC_API_KEY 需要 Master 提供，放 backend/.env
  
  // 方法一: CMC (有Key时)
  // GET /v1/cryptocurrency/quotes/latest?id=27650
  // Header: X-CMC_PRO_API_KEY: <key>
  
  // 方法二: 降级 → PancakeSwap 链上查询 (无Key时)
  // 直接调 2.1 的 getIonPrice()
  
  // 方法三: CMC 市场快照
  // ION 流通量在 CMC 显示为 0
  // 市值公式: price × 11.36 × 10^9
}
```

---

## 4. 7 个钱包对接 — 具体代码

### 4.1 检测代码

```typescript
// frontend/src/wallet/detectWallets.ts
export const WALLET_DETECTORS = {
  metaMask: () => typeof window !== 'undefined' && !!window.ethereum?.isMetaMask,
  binance:   () => typeof window !== 'undefined' && !!window.BinanceChain,
  okx:       () => typeof window !== 'undefined' && !!window.okxwallet,
  bitget:    () => typeof window !== 'undefined' && !!window.bitkeep?.ethereum,
  trust:     () => typeof window !== 'undefined' && !!window.trustwallet,
  coinbase:  () => typeof window !== 'undefined' && !!window.coinbaseWalletExtension,
  rabby:     () => typeof window !== 'undefined' && !!window.rabby,
} as const

export function detectAllWallets(): string[] {
  return Object.entries(WALLET_DETECTORS)
    .filter(([_, detect]) => detect())
    .map(([name]) => name)
}
```

### 4.2 ION 原生钱包检测

```typescript
// frontend/src/wallet/detectIonWallet.ts
// ION 链原生钱包 (类似 TON 的 Tonkeeper)
// 需要从官方仓库 https://github.com/ice-blockchain/ion 获取真实注入方式
// 预估值:
export function detectIonWallet() {
  return typeof window !== 'undefined' && (
    !!(window as any).ion ||
    !!(window as any).ton  // ION 基于 TON，可能共用 window.ton
  )
}
```

### 4.3 wagmi 配置

```typescript
// frontend/src/wallet/wagmiConfig.ts
import { createConfig, http, injected } from 'wagmi'
import { bsc } from 'wagmi/chains'

export const wagmiConfig = createConfig({
  chains: [bsc],
  connectors: [
    injected({ target: 'metaMask' }),
    injected({ target: 'binance' }),
    injected({ target: 'okx' }),
    // ... 每个钱包一个 connector
  ],
  transports: {
    [bsc.id]: http(BSC_RPC)
  }
})
```

---

## 5. FeeDistributor.fc — 费用分配合约

### 5.1 费率模型

```
交易手续费 0.3% → 100%
  ├── 35% → 销毁 (addr_none)
  ├── 25% → 团队 (team_wallet)
  ├── 20% → 质押奖励 (staking_pool)
  ├── 15% → 国库 (treasury)
  └── 5%  → 运营 (operations)
```

### 5.2 FunC 合约骨架

```func
;; FeeDistributor.fc
;; 费用分配器 — 所有费用以 ION 收取

() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {
    ;; 解析费用金额
    ;; 按比例分配
    ;; 销毁部分 → addr_none
    ;; 团队部分 → team_wallet
    ;; 质押部分 → staking_pool
    ;; 国库部分 → treasury
    ;; 运营部分 → operations
}
```

参考: `contracts/ion/treasury.func` (如果已有) 修改为上述分配比例
参考: `D:\openclaw-tools\ice-blockchain-bridge\solidity\Bridge.sol` (桥合约模式)

---

## 6. 桥部署操作

### 6.1 已有源码

```
D:\openclaw-tools\ice-blockchain-bridge\solidity\Bridge.sol     — BSC 侧桥合约
D:\openclaw-tools\ion-bridge-deploy\                             — 部署脚本
```

### 6.2 ION 侧 (只读)

```
multisig-code.fc → config_param(71) — ION 验证者多签 (L1内建，不部署)
votes-collector.fc → config_param(72) — 投票收集器 (L1内建，不部署)
```

### 6.3 桥资产映射

```
USDT (BSC 0x55d398326f99059fF775485246999027B3197955)
  ↕ 桥 ↕
ION (ION 链原生代币)

BNB (BSC 原生)
  ↕ 桥 ↕
ION (ION 链原生代币)
```

---

## 7. 验证标准 — 每步必验

### 7.1 编译验证

```bash
# FunC 合约
node scripts/compile-func.mjs  # 必须 22/22 PASS

# Solidity 合约
forge build                    # 必须 0 error

# 前端
cd frontend && npm run build   # 必须 0 error
```

### 7.2 数据验证 (每个接口写完后立即验证)

```typescript
// 运行验证脚本确认数据是真实的
// scripts/verify-live-data.mjs
// → 打印所有接口查询结果
// → 失败接口标注 FAIL，修复后重跑
```

### 7.3 禁止事项

```
❌ console.log('mock data')       — 删除
❌ return { price: 0.001 }        — 改链上查询
❌ // TODO: implement             — 实现它
❌ const fee = 0.003              — 从合约读取
❌ dummyProvider                  — 用真实 injected provider
```

---

**照着做。不许跳步。不许 mock。不许中文乱码。**
