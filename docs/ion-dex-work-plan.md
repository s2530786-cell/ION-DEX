# ION DEX — 完整工作计划

**生成时间**: 2026-05-25 CST（全自动工单 W 系列）  
**项目路径**: `D:\openclaw-tools\ion-dex-nuke`  
**已完成派工单**: [`docs/cursor-dispatch-work-order-2026-05-24.md`](cursor-dispatch-work-order-2026-05-24.md)  
**当前执行**: [`docs/cursor-autonomous-work-order-2026-05-25.md`](cursor-autonomous-work-order-2026-05-25.md) — 全自动 · 每阶段 `verify-100` 绿

---

## 当前里程碑（全自动 W 系列）

| 阶段 | 任务 | 状态 |
|------|------|------|
| W0 | 文档/记忆库同步 + 基线 verify-full | ✅ |
| W1 | 六引擎真实数据层 | ⏳ |
| W2 | 7 钱包真实对接 | ⏳ |
| W3 | UI Pixel Correction | ⏳ |
| W4 | 链上接线波次 1 | ⏳ |
| W5 | Indexer 骨架 | ⏳ |
| W6 | 安全功能测 | ⏳ |
| W7 | CI/CD + 测试网脚本 | ⏳ |
| W8 | 全仓 verify-100 收口 | ⏳ |

## 历史里程碑（2026-05-24 派工单 — 已完成）

| 代号 | 任务 | 状态 |
|------|------|------|
| P0-1c | BSC ↔ ION 跨链桥 E2E | ✅ |
| P0-2b | FeeReceiver 全链路 ION 扣费 | ✅ |
| P0-3 | 1000 次安全矩阵 | ✅ |
| CI | E2E 31/31 · Forge · Stress 120/120 | ✅ |
| **P1A** | CopyTrade（+ E2E **100/100**） | ✅ |
| **P1B** | LiquidityMine（+ Forge **100/100**） | ✅ |
| P2A/P2B/P3A | Domain / Settings / BatchTransfer | ✅ |
| AI 订阅 | `#/ai` + pytest 19/19 + Docker | ✅ |

---

## 全局铁律（2026-05-24）

1. 所有费用仅 ION，协议层固定。  
2. 禁止 mock/fake 链上数据；未接线用 `warn("[module] not yet wired")`。  
3. 组件 ≤300 行、util ≤200 行。  
4. **新模块 commit 前：100 连续 Forge 或 E2E 全绿**（红一次从 0 重计）。  
5. 脚本：`stress-forge-contract-100.mjs`、`stress-playwright-100.mjs`、`verify-100.ps1`。

---

## P0: 上线前死线

### P0-1: ION 主链部署与 E2E

| 子项 | 验收 | 进度 |
|------|------|------|
| 1a | FunC 13/13 编译 | ✅ |
| 1b | 测试网部署 | 🟡 脚本就绪 |
| 1c | BSC ↔ ION 桥 E2E | ✅ |
| 1d | 主网 gas + 部署脚本 | 🟡 |
| 1e | 主网 LP 初始流动性 | ⏳ |

### P0-2: FeeReceiver ION 统一手续费

| 子项 | 进度 |
|------|------|
| 2a–2d | ✅ `IonProtocolFeeLib` + 前后端 ION 费展示 |

### P0-3: 安全检查 1000 次

| 3a–3j | 各 100 次 | ✅ `SecurityMatrix.t.sol` |

---

## P1: 高优先 — Cursor Phase 1（立即执行）

> 细节见 [`cursor-dispatch-work-order-2026-05-24.md`](cursor-dispatch-work-order-2026-05-24.md)

### P1A — CopyTrade

- 前端 `CopyTradePage.tsx` + E2E `copy-trade.spec.ts` + 路由注册  
- 后端 `copyTrade.routes.ts`（start/stop/stats）  
- **门禁**：`stress-playwright-100.mjs --spec e2e/copy-trade.spec.ts` → **100/100**

### P1B — LiquidityMine

- `contracts/bsc/LiquidityMine.sol` + `LiquidityMine.t.sol`  
- 前端 `LiquidityMinePage.tsx` + `liquidityMine.routes.ts` + 路由  
- **门禁**：`stress-forge-contract-100.mjs --match-contract LiquidityMine` → **100/100**

### P1-legacy（原表，与 P1A/B 并行或后置）

- 真实数据替换（markets/quotes/tokens/staking/bridge/burn/CMC/RPC）  
- Swap/Pool UI 打磨、Wallet 集成  

---

## P2: Phase 2（P1 完成后）

| Task | 内容 |
|------|------|
| P2A | DomainManage 增强（注册/列表/bind/transfer/renew） |
| P2B | SettingPage（深色/滑点/通知/清缓存） |

---

## P3: Phase 3（P2 完成后）

| Task | 内容 |
|------|------|
| P3A | BatchTransfer 页面（Transfer/Collect Tab，`BatchTransfer.sol` 已有） |

---

## P4: 长期

- StakeReward / NFT / OrderBook / Admin / CI 自动部署 / 官方 proposal  

---

## 验证命令

| 用途 | 命令 |
|------|------|
| 全量一次 | `scripts\verify-full-save-log.cmd --no-pause` |
| 全量 ×100 | `powershell -File scripts\verify-100.ps1` |
| 单合约 ×100 | `node scripts/stress-forge-contract-100.mjs --match-contract <Name>` |
| 单 E2E ×100 | `node scripts/stress-playwright-100.mjs --spec e2e/<file>.spec.ts` |
| 安全 1000 | `node scripts/verify-security-1000.mjs` |
| 桥 E2E | `node scripts/verify-bridge-e2e.mjs` |

---

## 相关文档

- 派工单：`docs/cursor-dispatch-work-order-2026-05-24.md`  
- 工程标准：`docs/00-engineering-standards.md`  
- 会话状态：`SESSION_STATE.md`  
- ION 测试网：`docs/ion-testnet-deploy-checklist.md`  
- BSC 部署：`contracts/script/Deploy.s.sol`
