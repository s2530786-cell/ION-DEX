# 快速开始

> 面向中文读者的 ION DEX 本地启动导读。

## 前置要求

| 工具 | 版本建议 |
|------|----------|
| Node.js | 18+ |
| npm | 9+ |
| Git | 2.40+ |

若涉及合约开发，还需要：

| 工具 | 版本建议 |
|------|----------|
| Foundry (`forge`) | 1.7+ |
| TON CLI | 0.12+ |

## 1. 克隆与安装

```bash
git clone https://github.com/s2530786-cell/ION-DEX.git
cd ION-DEX
npm install
cd frontend
npm install
cd ..
```

## 2. 配置环境变量

```bash
cp .env.example .env
```

常见变量包括：

- `ION_RPC_URL`
- `ION_INDEXER_URL`
- `BSC_RPC_URL`
- `CMC_API_KEY`

## 3. 启动前端

```bash
cd frontend
npm run dev
```

## 4. 钱包方向

### ION 链钱包

- Online+ Wallet
- ION Wallet / Browser Wallet

### EVM 钱包

- MetaMask
- OKX Wallet
- Bitget Wallet

## 5. 第一笔报价示例

```typescript
import { IONDEX } from "@ion-dex/sdk";

const client = new IONDEX({
  network: "mainnet",
  rpc: process.env.ION_RPC_URL,
});

const quote = await client.swap.getQuote({
  fromToken: "ION",
  toToken: "BNB",
  amount: "1000",
  slippage: 0.5,
});
```

## 合约开发方向

### 构建

```bash
cd contracts/ion
npm run build

cd ../bsc
forge build
```

### 测试

```bash
cd contracts/ion
npm test

cd ../bsc
forge test -vvv
```

## 常见问题

### 无法连接 ION RPC

- 检查网络访问 `api.mainnet.ice.io`
- 如在受限网络下，确认代理或防火墙配置

### 钱包未检测到

- 安装浏览器扩展
- 安装后刷新页面
- 确认钱包连接到了正确网络

### FunC 构建失败

- 确认 TON CLI 已安装并在 PATH 中
- 确认 `contracts/ion/` 依赖完整安装

## 下一步

- [API 概览](./api-overview.md)
- [合约概览](./contracts-overview.md)
- [SDK 概览](./sdk-overview.md)
- [英文技术架构](../03-technical-architecture.md)

---

返回 [开发者入口](./developer-index.md) | [中文文档中心](./index.md) | [英文 Quick Start](../quick-start.md)
