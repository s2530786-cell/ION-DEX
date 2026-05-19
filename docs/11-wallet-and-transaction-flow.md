# 11 — 钱包与交易流

> 单页设计 | 关联：`docs/05-product-prd.md`（Swap/Trade）、`docs/06-page-flow-and-user-journeys.md`

## 目标

- 统一 **ION 原生钱包** 与 **EVM 钱包**（MetaMask、WalletConnect、OKX 等）的连接、链切换、签名与交易状态机。
- 每笔资产操作前：**模拟 → 展示风险 → 用户确认 → 广播 → 确认数跟踪**。
- 定义跨链一致的错误码与用户可读文案（中英）。

## 边界

| 范围内 | 范围外 |
|--------|--------|
| 前端 Wallet Adapter 抽象、交易状态 UI | 钱包 App 内部实现 |
| 模拟 API 契约（后端或直连 RPC） | 硬件钱包固件 |
| ION cell 消息 vs EVM typed data 映射 | 交易所托管账户 |

## 依赖

- `docs/10-config-and-environments.md`（链 ID、合约地址）
- `docs/13-oracle-and-price-policy.md`（报价与最小输出）
- 官方实现：`ion-official/ion-browser-wallet`（`window.ton`）、`ion-dex-frontend` 的 `wallet-connect.js`（Online+ / `wallet.ice.io`）
- P0-4 真实 RPC

## 架构（建议）

```text
WalletProvider
  ├─ IonBrowserAdapter   (TON/ION cell, bounceable address)
  ├─ EvmInjectedAdapter  (window.ethereum)
  └─ WalletConnectAdapter

TransactionOrchestrator
  ├─ simulate(tx) → SimulationResult
  ├─ sign(tx)     → SignedPayload
  ├─ broadcast()  → txHash
  └─ trackConfirmations(n) → finality
```

### 交易状态机

`idle → simulating → ready_to_sign → signing → broadcasting → pending → confirmed | failed`

- **失败**必须保留：`code`（如 `ION_DEX_WALLET_REJECTED`）、`chain`、`txHash?`、可重试标记。

### V1 最小范围（对齐 PRD V1）

| 能力 | V1 | V2+ |
|------|----|-----|
| EVM 连接 + 余额读 | 壳 + 只读 | 完整 |
| ION 钱包连接 | 已接官方协议（扩展 / Online+ / TonConnect 桥） | 独立 WC QR SDK、链上 swap 签名 |
| Swap 模拟 + 签名 | 必须 | — |
| 限价/网格链上执行 | 否 | V3 + keeper |

### 签名类型

| 链 | 场景 | 格式 |
|----|------|------|
| BSC | Vault / Permit | EIP-712 |
| ION | Swap / LP | TON message / BOC（依官方 SDK） |
| 跨链 | Bridge intent | 双端各自格式 + relayer 元数据（见 `docs/18`） |

### Pending 交易队列

- 本地 `TransactionStore`：`pending[]` 含 `txHash`, `submittedAt`, `confirmations`, `action`
- UI：全局角标 + Swap 页内嵌；失败可 `retry`（新 nonce / 新签名）
- 终态后归档 24h（可配置）

### MEV / 私有 RPC

| 范围 | V1 | 说明 |
|------|-----|------|
| BSC Swap | 建议 | 可选 Flashbots Protect / 私有 RPC URL（`docs/10` env） |
| ION Swap | 文档化 | 依赖 ION 节点策略；V1 不强制私有通道 |
| Keeper 执行 | V3 | 见 `docs/20` |

工程标准中的 Flashbots 类机制：**V1 仅 BSC 大额 Swap 推荐**，非阻断项。

## 退出标准

- [ ] `WalletProvider` 接口文档 + 至少 **1 个 EVM** 适配器可连接测试网。
- [ ] Swap 页：未连接钱包时禁用提交；连接后展示地址 shortened + 链名。
- [ ] 模拟失败时展示 `minimumReceived`、`priceImpact`、错误原因（非 console only）。
- [ ] 广播后 UI 显示 pending/confirmed（轮询或 WebSocket，见 `docs/12`）。
- [ ] 错误码表 `docs/errors/wallet-transaction.md`（或 OpenAPI enum）≥ 15 条常见场景。
- [ ] Playwright：连接 mock 钱包 → 走通 swap 草稿流（可不真上链）。
