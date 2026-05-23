# ION DEX — 完整工作计划

**生成时间**: 2026-05-24 06:35 CST  
**同步时间**: 2026-05-22（仓库 `docs/` 副本）  
**当前状态**: 骨架完整（Doubao canonical bundle + Cursor task-001~005 已完成）  
**项目路径**: `D:\openclaw-tools\ion-dex-nuke`

---

## P0: 必须完成 — 上线前死线

### P0-1: ION 主链合约部署与 E2E 联调

| 子项 | 描述 | 验收标准 |
|------|------|----------|
| 1a | FunC 13 合约编译全绿 + FIF 构建 | 13/13 `.fc` → `.fif` 编译成功 |
| 1b | 测试网 ION 链部署（router/pool/vault/FeeDistributor/deployer） | `testnet.ice.io` 上合约地址有效 |
| 1c | BSC ↔ ION 跨链桥 E2E | BSC lock → ION mint 全流程跑通 |
| 1d | 主网部署 gas 预算 + 部署脚本 | `deploy-live-send.fif` 可执行 |
| 1e | 主网 ION 流动性池创建 | LP 地址有初始流动性 |

### P0-2: FeeReceiver — ION 统一手续费强制执行

| 子项 | 描述 | 验收标准 |
|------|------|----------|
| 2a | FeeReceiver 合约重构：交易/提现/质押/销毁/铸币 — 全部强制 ION | 非 ION 支付全部 revert |
| 2b | FeeReceiver 集成到 DexSwap / LiquidityPool / IonSwapRouter / Burn / StakeReward | 每笔交易自动扣 ION |
| 2c | 合约层写死 ION 地址 `0xE1Ab...5ea8` — 不可更改 | `constant ION = 0xE1Ab...5ea8` |
| 2d | Frontend 所有 Swap/Pool/Stake/Bridge 界面的费用显示改为 ION | UI 展示 ION 而非 USD 手续费 |

### P0-3: 安全检查 — 100% 链上安全测试

| 子项 | 描述 | 验收标准 |
|------|------|----------|
| 3a | 重入攻击测试（BSC + ION） | 100 次全绿 |
| 3b | 闪电贷攻击测试 | 100 次全绿 |
| 3c | 三明治攻击测试 | 100 次全绿 |
| 3d | 预言机操控测试 | 100 次全绿 |
| 3e | 权限绕过测试 | 100 次全绿 |
| 3f | 整数溢出测试 | 100 次全绿 |
| 3g | DoS/气体耗尽测试 | 100 次全绿 |
| 3h | 假币攻击测试 | 100 次全绿 |
| 3i | 时间戳操控测试 | 100 次全绿 |
| 3j | 抗量子攻击测试 | 100 次全绿 |
| **总计** | **1000 次安全测试全绿** | **不通过不走下一步** |

---

## P1: 高优先 — 功能完整

### P1-1: 真实数据替换（Doubao mock → 链上实时）

| 子项 | 描述 |
|------|------|
| 1a | `markets-live.ts` — GeckoTerminal 实时 K 线 + 深度 |
| 1b | `quotes-live.ts` — DexScreener 秒级价格 |
| 1c | `tokens-live.ts` — ION 链上 token 元数据 |
| 1d | `staking-live.ts` — `stake.ice.io` 质押数据 |
| 1e | `bridge-live.ts` — 跨链桥真实 Tx 状态 |
| 1f | `burn-live.ts` — 真实销毁数据 |
| 1g | `cmc.ts` — CMC 排名/市值 |
| 1h | `bsc-rpc.ts` — BSC RPC 链上交互 |

### P1-2: Swap/Pool UI 打磨

| 子项 | 描述 |
|------|------|
| 2a | SwapPage — 滑点设置 / 路由路径显示 / ION 费率 popup |
| 2b | PoolPage — 添加/移除流动性 / LP 份额 / fee tier |
| 2c | ChartFrame + MarketChart — 联动 |
| 2d | TradeProPage — 限价单 / 订单簿 |
| 2e | 响应式：320px ~ 2560px 全适配 |

### P1-3: Wallet 集成

| 子项 | 描述 |
|------|------|
| 3a | EvmWalletProvider — MetaMask / OKX / Bitget |
| 3b | IonWalletProvider — ION 链原生钱包 |
| 3c | tonconnect — TON 钱包桥 |
| 3d | 余额 / 授权 / Tx 签名 / 网络切换 |

---

## P2: 中优先 — 商业逻辑

### P2-1: StakeReward 合约

- 质押/解押 / 收益分配 / APY
- 前端 StakePage + VaultStakePage

### P2-2: BatchTransfer / TokenIssuer

- 批量转账（空投）
- 一键发币（Pump.fun 模式）/ 灰度上线

### P2-3: NFTAuction

- NFT 铸造 + 拍卖引擎
- 前端拍卖页面

### P2-4: OrderBook

- 链上限价单簿
- TradeProPage 集成

---

## P3: 低优先 — 锦上添花

### P3-1: 管理后台

- AdminManager 管理面板
- 费率/白名单/暂停

### P3-2: BridgeRelay + BSCVault

- BSC 跨链桥 UI
- 交易历史/状态追踪

### P3-3: 合规

- RiskModal / TradeConfirm / FooterLegal
- 地区限制 + 风险提示

### P3-4: CI/CD

- GitHub Actions：Forge test / FunC build / tsc / Vite build
- 测试网自动部署

---

## P4: 长期 — 推官方

### P4-1: ION DEX → `ice-blockchain/ion-dex`

- README 对标官方格式
- GPL v3.0
- 部署文档 + API 文档 + 架构说明
- 向 ice-blockchain 维护者提交 proposal

---

## 执行节奏

| 阶段 | 时限 | 产出 |
|------|------|------|
| **P0** | 3-5 天 | 主网可上线 |
| **P1** | 5-7 天 | 功能完整 |
| **P2** | 7-10 天 | 商业逻辑完整 |
| **P3** | 10-14 天 | 运营就绪 |
| **P4** | 14-21 天 | 提交官方 |

### 每日节奏

- 06:00-09:00 — 旺财验收/审计/报错
- 09:00-20:00 — Cursor 全速干活（桌面窗口可见）
- 20:00-22:00 — 旺财全天汇总 + Master 审查

### 铁律

- 所有费用只收 ION — 合约层写死，任何 UI/API 层不可改
- 每步 commit + push，不积攒垃圾
- 1000 次安全测试全绿才走下一步

---

## 仓库内相关文档

- ION 测试网部署清单：`docs/ion-testnet-deploy-checklist.md`
- FunC 编译与部署命令：`contracts/ion/deploy/compile-and-deploy.md`
- BSC 测试网 Forge 脚本：`contracts/script/Deploy.s.sol`
