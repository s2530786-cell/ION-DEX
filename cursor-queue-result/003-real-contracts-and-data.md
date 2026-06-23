# 🔗 P1-TASK-003: 真实合约地址替换 + 前端链上对接

## 优先级
🟧 P1 — P0 全过之后马上执行

## 目标
- `.env` 和配置文件中的所有占位地址替换为真实合约地址
- 前端 React 组件从 hardcoded 地址改为从 config 读取
- 后端所有数据源从 mock/hardcoded 切换到链上真实数据

## 背景
Master 铁律⑯（零假代码）：绝对禁止 mock/placeholder/hardcoded 假数据。
Doubao 骨架已经整合进来，但它还带着大量占位地址。必须挨个替换。

## 操作指导

### Step 1: 扫描所有占位地址

```powershell
# 查找 0xdead 和类似占位地址
cd D:\openclaw-tools\ion-dex-nuke
Select-String "0x[0-9a-fA-F]{40}" -Path frontend\src\**\*.tsx,frontend\src\**\*.ts,backend\src\**\*.ts -AllMatches | 
  Where-Object { $_.Matches.Value -match "dead|0000|1234|test|mock|placeholder" } |
  Select-Object FileName, @{N='Address';E={$_.Matches.Value}} | Format-Table -AutoSize
```

### Step 2: 创建集中配置

创建 `frontend/src/config/contracts.ts`：
```typescript
/**
 * ION DEX 合约地址配置
 * 所有合约地址统一管理，组件通过这里读取，不 hardcode
 */
export const CONTRACTS = {
  ion: {
    // ION 代币主合约（BSC）
    token: {
      address: '0xe1ab61f7b093435204df32f5b3a405de55445ea8' as const,
      chainId: 56,
      decimals: 18,
      symbol: 'ION',
      name: 'ION Token',
    },
  },
  dex: {
    // PancakeSwap 互换路由
    router: {
      address: '0x10ED43C718714eb63d5aA57B78B54704E256024E' as const,
      chainId: 56,
    },
    // 池子
    factory: {
      address: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73' as const,
      chainId: 56,
    },
    // ION/WBNB 交易池
    pool: {
      address: '0x6487725b383954e05cA56F3c2B93a104B3DD2C25' as const,
      chainId: 56,
    },
    // 质押合约（如果已部署）
    staking: {
      address: '0x0000000000000000000000000000000000000000' as const, // TODO: 替换为真实地址
      chainId: 56,
    },
  },
  bridge: {
    inbox: {
      address: '0x0000000000000000000000000000000000000000' as const, // TODO: ION 链桥地址
      chainId: 56,
    },
  },
  // 手续费收取地址（Master 钦定只收 ION）
  fee: {
    receiver: {
      address: '0x8ff2e1210434495c4f5629bd9d8bd4965a67b84c' as const,
      chainId: 56,
    },
    // 所有费用统一用 ION —— 不设置 USDT/BNB 手续费地址
    tokenOnly: 'ION' as const,
  },
} as const;

// 未部署的合约标志
export const PLACEHOLDER_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * 检查合约是否已部署
 */
export function isDeployed(address: string): boolean {
  return address !== PLACEHOLDER_ADDRESS;
}
```

### Step 3: 创建后端集中配置

`backend/src/config/contracts.ts`：
```typescript
export const CONTRACTS = {
  ion: {
    tokenAddress: '0xe1ab61f7b093435204df32f5b3a405de55445ea8',
    chainId: 56,
  },
  rpc: {
    bsc: 'https://bsc-dataseed.binance.org/',
    // ION 链 RPC（需代理访问）
    ion: 'https://api.mainnet.ice.io',
  },
  apis: {
    geckoterminal: {
      baseUrl: 'https://api.geckoterminal.com/api/v2',
      poolId: '0x6487725b383954e05cA56F3c2B93a104B3DD2C25',
    },
    dexscreener: {
      baseUrl: 'https://api.dexscreener.com',
      pairs: ['0x6487725b383954e05cA56F3c2B93a104B3DD2C25'],
    },
    cmc: {
      apiKey: process.env.CMC_API_KEY || '',
    },
  },
  // 统一手续费配置（Master 2026-05-24 钦定）
  fees: {
    currency: 'ION',
    swapFee: 0.003,  // 0.3%
    poolFee: 0.003,
    withdrawalFee: 0.001, // 0.1%
  },
};
```

### Step 4: 后端数据源替换

关键文件清单（不要改非列表文件）：
1. `backend/src/services/quotes.ts` — 从 hardcoded → GeckoTerminal 实时
2. `backend/src/services/pool.ts` — 从 hardcoded → BSC RPC getReserves
3. `backend/src/services/burn.ts` — 从 hardcoded → BSC 链上燃烧记录
4. 删除 `backend/src/services/mock-quotes.ts`（如果存在且未被引用）

### Step 5: 前端 React 对接

1. **配置文件读取代替 hardcode** — 每个组件里手写的 `0x...` 地址全部替换为 `CONTRACTS.xx.address`
2. **Wallet 对接** — 确认 OKX Wallet / MetaMask 连接走正常 flow，没有 mock provider
3. **Trade 页** — Swap/Router 调用从 hardcoded function → viem/wagmi 真实合约调用
4. **Vault 页** — 同理，用真实 ABI + 真实地址
5. **Pool 页** — 显示真实池子状态（TVL、APR、流动性）

### Step 6: 验证

```powershell
# 后端验证
cd backend
curl http://localhost:8787/api/config/public
curl http://localhost:8787/api/markets/tickers

# 前端验证
cd frontend
npx tsc --noEmit  # 零类型错误
```

## 验收标准
- [ ] 前端所有合约地址统一从 `CONTRACTS` 读取，无 hardcode 地址
- [ ] 后端 quotes 返回真实链上价格（接近 $0.000139/ION）
- [ ] 后端 burn 返回真实燃烧量（非 0 非 mock）
- [ ] 前端 tsc exit code 0
- [ ] 前端 Wallet connect 用 wagmi + viem，无 mock provider
- [ ] 占位地址 (`0x0000...`) 只在未部署的合约上出现，有清晰的 TODO 标注
- [ ] commit 消息：`feat(config): replace all placeholders with real contract addresses`

## 铁律提醒
- 改一个文件后立即读回验证编码
- 不要一次性改太多文件 — 改 2-3 个就 build 一次确认能编译
- 0xdead 地址是典型的骗人占位，必删
