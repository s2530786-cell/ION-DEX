# 🥚 借鸡生蛋 — BSC PancakeSwap 做 ION 交易入口

> **策略**: 利用BSC现有DEX基础设施做ION流动性入口，零成本起步。
> **引用**: architecture-audit.md → SESSION_STATE.md → 本文件

---

## 核心思路

ION链目前没有原生DEX生态。但ION代币已通过跨链桥部署在BSC上 (`0xe1ab61f7b093435204df32f5b3a405de55445ea8`)。

**策略**: 不自己建链，借BSC PancakeSwap的流动性池做ION交易入口。

## 三阶段路线

### 阶段1: 借鸡生蛋 (当前)
- ION/WBNB PancakeSwap V3 池子: TVL $258K, 24h量 $12.5K
- 六免费数据引擎零成本覆盖价格/市值/K线/深度
- swap.ion 域名 → 前端聚合交易界面

### 阶段2: 自建生态
- ION链原生DEX智能合约部署
- Bridge双向打通 (ION↔BSC)
- 自有流动性池

### 阶段3: 繁荣发展
- ION百万TPS承载全球交易
- 多区域验证人集群
- 跨链聚合器

## 技术架构

```
用户 → swap.ion → React前端 → 后端缓存层
                    ↓
              wagmi钱包连接 → MetaMask → BSC链
                    ↓
              PancakeSwap Router → 执行交易
                    ↓
              实时价格 (六引擎聚合)
```

## 数据流

```
价格: PancakeSwap(getReserves) × Binance(BNB/USDT) → /api/price/ion
K线: GeckoTerminal OHLCV → /api/klines/ion
市值: CMC + DexScreener FDV → /api/market/ion
交易: PancakeSwap Router swapExactTokensForTokens → 用户签名 → BSC链执行
```

## 关键地址

| 项目 | 地址 |
|------|------|
| ION (BSC) | `0xe1ab61f7b093435204df32f5b3a405de55445ea8` |
| ION/WBNB Pool | `0x6487725b383954e05cA56F3c2B93a104B3DD2C25` |
| WBNB | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` |
| PancakeSwap Router | `0x13f4EA83D0bd40E75C450AA4996c5F88E1a5F27C` (V3) |

## 禁止事项

- ❌ 禁止自己发币/建池 — 用已有的PancakeSwap池
- ❌ 禁止在ION链没准备好时强行上线原生DEX
- ❌ 禁止忽略BSC Gas成本 — 前端必须显示预估Gas
