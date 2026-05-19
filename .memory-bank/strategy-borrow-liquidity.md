# 🎯 ION DEX 核心战略 — 借鸡生蛋

> **Master 钦定 2026-05-19 23:15~23:27**
> 此文件是 Cursor 理解"为什么做"的核心文档。启动必读。

---

## 🏗️ 根在 ION 链

```
我们开发的是 ION 链上的原生 DEX。
根在 ION 链。一切围绕 ION 链。
```

**ION 链现状：**
- ❌ 没有一家 DEX 在 ION 链上
- ❌ 没有流动性
- ❌ 生态项目无交易场所

**ION DEX 目标：**
- ✅ ION 链第一个原生 DEX
- ✅ 为所有 ION 生态项目提供流动性
- ✅ 用户可以用 ION 链钱包直接交易

---

## 🐔 借鸡生蛋 — BSC 生态对接策略

> 借助 BSC 链上的流量和流动性，促进 ION 链上的繁荣。
> 这叫借鸡生蛋。其他链刚开始的时候也是这么做的。

### 二条关键流动性链路

#### 链路一：USDT 桥
```
USDT (BSC)  ←→  ION (ION 链)
     ↑                ↑
  PancakeSwap      ION DEX
  已有流动性        暂无流动性（要建）
```

#### 链路二：BNB 桥
```
BNB/ION (BSC)  ←→  BNB/ION (ION 链)
     ↑                    ↑
  PancakeSwap           ION DEX
  已有池子             要建池子
```

**打通这两条链路 = 链上就有根本的流动性。**

### 三步走

```
Step 1: 桥部署 (Bridge.sol on BSC ←→ ION 内建验证者)
  → 资产可跨链流动

Step 2: ION DEX 上线 (ION 链 FunC 合约)
  → ION 链上有交易场所

Step 3: PancakeSwap LP 对接
  → BSC 流量导入 ION 链
```

---

## 👛 ION 链钱包 — 不是 BSC 钱包

### 当前问题
Cursor 写的钱包代码（Online+/ION Browser/WalletConnect）都是预览壳，不能真用。

### 正确方向
ION 链钱包 ≠ BSC/EVM 钱包。ION 链基于 TON 技术，钱包机制不同：
- ION 链有自己原生的钱包扩展（类似 TON 的 Tonkeeper/TonHub）
- 需要对接 ION 链的 wallet 扩展注入（类似 `window.ton`）
- 官方代码库 `https://github.com/ice-blockchain/ion` 有对应的钱包代码

### ION 链钱包对接方式
1. **ION Browser Extension Wallet** — 浏览器扩展钱包（类似 MetaMask 之于 EVM）
   - 注入方式：`window.ion` 或 `window.ton`（需验证 ION 链具体注入名）
   - 官方仓库：`https://github.com/ice-blockchain/ion` → 搜索 wallet/extension/inject
   
2. **WalletConnect for ION** — 移动端钱包扫码连接
   - TON Connect 协议适配 ION 链
   - 参考：官方 `wallet-connect` 相关代码

3. **Online+ (ION 链内置)** — ION 链的在线钱包方案
   - 从官方代码仓库获取真实实现

### 不可做的事
- ❌ 不要自己从头写钱包逻辑 → 从官方仓库搬
- ❌ 不要写 EVM 钱包伪装成 ION 钱包 → 两套不同体系
- ❌ BSC/EVM 钱包对接（MetaMask/OKX等）用于 BSC 侧桥交互
- ❌ ION 链钱包对接（官方方案）用于 ION 链 DEX 交互

---

## 📊 完整数据参考

详见 `.memory-bank/live-data-reference.md`：
- CMC API → 行情报价
- PancakeSwap Router `0x10ED43...` → BSC 交易
- ION RPC `api.mainnet.ice.io` → ION 链数据
- ION BSC Token `0xe1ab61f7...` → 烧币查询
- ION/USDT Pair `0x1610eDd...` → 价格降级
- 7 个 EVM 钱包 → BSC 侧桥交互

---

## ⚠️ Cursor 当前卡住的问题

1. **行情 live** → 缺 CMC_API_KEY，降级走 PancakeSwap 链上查询 ✅ 已有方案
2. **烧币 live** → BSC_ION_TOKEN_ADDRESS 已写入 `backend/.env` ✅
3. **Staking/Domain live** → ION Indexer v3 API `api.mainnet.ice.io/indexer/v3/` ✅
4. **Swap 链上签名** → 依赖合约部署，ION 链 FunC 合约先编译再部署 ✅
5. **钱包对接** → 需要从官方仓库参考真实代码，不是写壳 ❌ 需行动

---

**写于 2026-05-19 23:26 | Master 审定**
