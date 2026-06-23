# 🔗 Real Wallet Connection Requirements

> **Master 钦定 (2026-05-19)：前端必须对接真实钱包，零 mock/placeholder。**
> Cursor TASK 0 必读：本文件 + live-data-reference.md + strategy-borrow-liquidity.md

---

## 7 钱包完整对接清单

| # | 钱包 | wagmi connector | 检测方式 | 优先级 |
|---|------|----------------|----------|--------|
| 1 | **MetaMask** | `@wagmi/connectors/metaMask` | `window.ethereum.isMetaMask` | 🔴 P0 |
| 2 | **Binance Web3** | `@binance/w3w-agmi` 或 `@wagmi/connectors/injected` | `window.BinanceChain` | 🔴 P0 |
| 3 | **OKX Wallet** | `@wagmi/connectors/injected` | `window.okxwallet` | 🟡 P1 |
| 4 | **Bitget Wallet** | `@wagmi/connectors/injected` | `window.bitkeep.ethereum` | 🟡 P1 |
| 5 | **Trust Wallet** | `@wagmi/connectors/injected` | `window.trustwallet` | 🟡 P1 |
| 6 | **Coinbase Wallet** | `@coinbase/wallet-sdk` | `window.coinbaseWalletExtension` | 🟡 P1 |
| 7 | **Rabby Wallet** | `@wagmi/connectors/injected` | `window.rabby` | 🟢 P2 |

## 前端组件要求

1. **钱包选择弹窗** — 用户点击 "Connect Wallet" → 弹出 7 钱包选择列表
2. **自动检测已安装** — 通过 `window.ethereum` 上的品牌标记检测，已安装的排前面
3. **钱包切换** — 已连接状态下可切换钱包（disconnect → reconnect）
4. **链切换** — 支持 BSC Mainnet (56) + ION Mainnet 切换，连接后自动切换目标链

## 数据结构要求

### wagmi Config
```typescript
// frontend/src/lib/wagmi.ts — 不能用 mock，必须真实创建
import { createConfig, http } from 'wagmi'
import { metaMask, injected } from '@wagmi/connectors'
import { bsc, mainnet } from 'wagmi/chains'

export const config = createConfig({
  chains: [bsc, mainnet],
  connectors: [
    metaMask(),
    injected({
      target: 'metaMask',
      shimDisconnect: false
    })
  ],
  transports: {
    [bsc.id]: http('https://bsc-dataseed1.binance.org'),
    [mainnet.id]: http('https://ethereum.publicnode.com')
  }
})
```

### 钱包检测
```typescript
// frontend/src/lib/wallet-detection.ts
export const WALLET_TYPES = {
  METAMASK: 'MetaMask',
  BINANCE: 'Binance Web3 Wallet',
  OKX: 'OKX Wallet',
  BITGET: 'Bitget Wallet',
  TRUST: 'Trust Wallet',
  COINBASE: 'Coinbase Wallet',
  RABBY: 'Rabby Wallet'
}

export function detectInstalledWallets(): string[] {
  const ethereum = window.ethereum
  if (!ethereum) return []
  
  const installed: string[] = []
  
  // 按品牌特征检测
  if (ethereum.isMetaMask && !ethereum.isOKExWallet) installed.push(WALLET_TYPES.METAMASK)
  if (ethereum.isBinance || window.BinanceChain) installed.push(WALLET_TYPES.BINANCE)
  if (ethereum.isOKExWallet || window.okxwallet) installed.push(WALLET_TYPES.OKX)
  if (ethereum.isBitKeep || window.bitkeep?.ethereum) installed.push(WALLET_TYPES.BITGET)
  if (ethereum.isTrust || window.trustwallet) installed.push(WALLET_TYPES.TRUST)
  if (ethereum.isCoinbaseWallet) installed.push(WALLET_TYPES.COINBASE)
  if (ethereum.isRabby) installed.push(WALLET_TYPES.RABBY)
  
  return installed
}
```

## 后端接口要求

### /api/wallet/nonce
```typescript
// GET /api/wallet/nonce?address=0x... → { nonce: string }
// 生成登录签名用的 nonce，存在 Redis TTL 5min
```

### /api/wallet/verify
```typescript
// POST /api/wallet/verify { address, signature, nonce }
// 验证 EIP-191 签名，返回 JWT token
```

### /api/wallet/balance
```typescript
// GET /api/wallet/balance?address=0x...&chain=bsc
// 返回 BNB + ION + USDT + BUSD 余额，真链上查询
```

## 预留功能（Phase 2+）

| 功能 | 状态 | 说明 |
|------|------|------|
| WalletConnect v2 | ⏳ 预留 | `@walletconnect/web3wallet` — 支持移动端钱包扫码 |
| ION Browser Wallet | ⏳ 预留 | ION 链原生浏览器扩展钱包 |
| Online+ | ⏳ 预留 | ION 生态内社交登录 |

## 参考来源

- **ION 官方钱包代码**: `https://github.com/ice-blockchain/ion` → `crypto/smartcont/wallet3-code.fc`
- **wagmi 文档**: `https://wagmi.sh/react/connectors`
- **EIP-1193**: `https://eips.ethereum.org/EIPS/eip-1193`

## 禁止事项

- ❌ 禁止 mock wallet provider — 每个连接器必须真实可用
- ❌ 禁止 placeholder TON wallet — ION 链钱包暂不原生支持，走 BSC MetaMask 桥接
- ❌ 禁止硬编码测试地址 — 所有地址来自用户真实钱包
- ❌ 禁止假余额 — 必须链上查 `getBalance()` + ERC20 `balanceOf()`
