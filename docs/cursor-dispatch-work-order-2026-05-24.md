# ION DEX — Cursor 派工单（旺财 2026-05-24）

**Project**: ION DEX — `D:\openclaw-tools\ion-dex-nuke`  
**Branch**: `security-test-fix`  
**CI 基线**（2026-05-25）：Playwright **31/31** E2E ✅ · backend **43** tests ✅ · FunC **13×100 RESULT=GREEN** ✅ · `verify-full` exit **0** ✅ · Stress copy-trade/batch-transfer **100/100** ✅ · Forge LiquidityMine **100/100** ✅

> **Agent 入口**：执行 Phase 1 前读 `docs/00-engineering-standards.md`、`SESSION_STATE.md`、本文档；UI 任务另读 `docs/10-ui-design-route.md` 与 `.cursor/skills/ion-web3-ui/SKILL.md`。

---

## Global rules（硬执行，不可跳过）

1. **所有费用仅 ION** — 协议层固定，不可配置。
2. **禁止 mock/placeholder/fake 数据** — 链不可用时用 `warn("[module] not yet wired")`，不得伪造链上结果。
3. **文件体量**：组件 > 300 行或 util > 200 行 → 必须拆分。
4. **Pre-commit 检查**：`tsc` && `vite build` && `forge test` && `git diff --check`（无 trailing whitespace）。
5. **Pre-commit 中文**：写含中文的文件后读回，确认 UTF-8 可读（无 BOM、无乱码）。
6. **Vue 原型参考**：
   - `doubao-dex-source/doubao-vue-prototype/src/views/`
   - `doubao-dex-source/frontend-vue/src/views/`
7. **100 轮门禁（模块级）**：每个**新模块** commit 前必须 **100/100 连续全绿**（Forge 或 E2E，见各 TASK）。**红一次 = 修复后从 0 重计**，无例外。

### 100 轮压力测试 — 执行命令

| 场景 | 命令 | 脚本 |
|------|------|------|
| 全仓 verify-full ×100 | `powershell -File scripts\verify-100.ps1` | 已有 |
| 单合约 Forge ×100 | `node scripts/stress-forge-contract-100.mjs --match-contract LiquidityMine` | 新增 |
| 单 E2E spec ×100 | `node scripts/stress-playwright-100.mjs --spec e2e/copy-trade.spec.ts` | 新增 |
| P0-3 安全矩阵（1000） | `node scripts/verify-security-1000.mjs` | 已有 |
| P0-1c 桥 E2E | `node scripts/verify-bridge-e2e.mjs` | 已有 |

---

## Phase 1 — Priority P1（立即按序执行）

### TASK-P1A: CopyTrade

**文件清单**

| # | 路径 | 说明 |
|---|------|------|
| 1 | `frontend/src/pages/CopyTradePage.tsx` | 主页面 |
| 2 | `backend/src/api/copyTrade.routes.ts` | API 路由 |
| 3 | `frontend/e2e/copy-trade.spec.ts` | E2E |
| 4 | 路由注册 | `AppShell.tsx` / `App.tsx` / `pageRouting.ts` |

**1. CopyTradePage.tsx**

- **State**：`leaderAddress: string`, `maxCopyAmount: bigint`, `minProfitBps: number (1–1000)`, `stopLossBps: number (1–2000)`, `copySlippageBps: number (1–500)`, `copyDirection: 'same'|'reverse'`, `isActive: boolean`
- **Stats**：`onlineTraders`, `todayCopiedTotal`, `avgReturnRate`, `myCopyCount`
- **UI**：4 统计卡 grid → 交易员列表（头像渐变圆、名称、月收益、「Copy」按钮）→ TradeHistory 面板
- **组件**：`GlassPanel`, `NeonButton`, `BackgroundBg`（`@/components/ui/glass/`、`@/components/background/`）
- **data-testid** 前缀：`copy-trade-*`
- **参考**：`doubao-dex-source/doubao-vue-prototype/src/views/CopyTrade.vue`

**2. copyTrade.routes.ts**

- `POST /api/copy-trade/start` — body: `{ leaderAddress, maxCopyAmount, minProfitBps, stopLossBps, copySlippageBps, copyDirection }`
- `POST /api/copy-trade/stop` — body: `{}`
- `GET /api/copy-trade/stats` — `{ totalCopied, totalPnl, activeCopies, leaderAddress, isActive, onlineTraders, todayCopiedTotal, avgReturnRate, myCopyCount }`
- **参考**：`backend/src/services/markets.ts` 服务模式

**3. copy-trade.spec.ts**

- `loads and shows stats cards` — 4 张统计卡可见
- `can toggle copy trading on/off` — 填表、切换、确认态可见
- **参考**：`e2e/smoke.spec.ts` 的 `clickNav()` + `test()` 模式

**4. 100 轮压力（E2E）**

```bash
cd frontend
node ../scripts/stress-playwright-100.mjs --spec e2e/copy-trade.spec.ts
```

100/100 全绿方可 commit；失败则从 0 重跑。

**5. 路由注册**

- `AppShell.tsx`：`PageKey` 增加 `"copy-trade"`；`navItems` 增加 `{ key: "copy-trade", label: "Copy Trade" }`
- `App.tsx`：`case "copy-trade": return <CopyTradePage />`
- `pageRouting.ts`：`PAGE_KEYS` 增加 `"copy-trade"`

---

### TASK-P1B: LiquidityMine

**文件清单**

| # | 路径 | 说明 |
|---|------|------|
| 6 | `contracts/bsc/LiquidityMine.sol` | 主合约 |
| 7 | `contracts/test/LiquidityMine.t.sol` | Foundry 测试 |
| 8 | 100 轮 Forge 压力 | 见下 |
| 9 | `frontend/src/pages/LiquidityMinePage.tsx` | 主页面 |
| 10 | `backend/src/api/liquidityMine.routes.ts` | API |
| 11 | 路由注册 | 同 P1A 模式 |

**6. LiquidityMine.sol**

```solidity
struct MinePool {
  address stakeToken;
  address rewardToken;  // = ION，硬编码官方地址
  uint256 tvl;
  uint256 apr;          // 4 decimals
  uint256 totalStaked;
  uint256 rewardPerBlock;
  uint256 lastRewardBlock;
  uint256 accRewardPerShare;
  uint256 lockupDays;
  uint256 multiplier;   // 100 = 1x
}
struct UserMineInfo {
  uint256 amount;
  uint256 rewardDebt;
  uint256 pendingReward;
  uint256 stakedAt;
}
```

- **Functions**：`stake(poolId, amount)`, `unstake(poolId, amount)`, `claimReward(poolId)`, `emergencyWithdraw(poolId)`, `getPoolInfo(poolId)`, `getUserInfo(poolId, user)`
- **集成**：`IonProtocolFeeLib`（`contracts/bsc/IonProtocolFeeLib.sol`）
- **参考**：`StakeReward.sol`、`LiquidityPool.sol`、`SecurityMatrix.t.sol` 扣费模式

**7. LiquidityMine.t.sol**

- stake/unstake、claimReward 算术、emergencyWithdraw、多用户、ION 扣费
- `forge test --match-contract LiquidityMine -vvv`

**8. 100 轮压力（Forge）**

```bash
node scripts/stress-forge-contract-100.mjs --match-contract LiquidityMine
```

100/100 全绿方可 commit。

**9. LiquidityMinePage.tsx**

- **State**：`myLpShares`, `pendingReward`, `pools: MinePoolView[]`
- **MinePoolView**：`id`, `name`, `apr`, `stakedToken`, `rewardToken`, `tvl`, `userStaked`, `lockupDays`, `multiplier`, `canStake`
- **UI**：2 统计卡 → 矿池卡片（名称、APR、stake/claim/exit）
- **data-testid** 前缀：`liquidity-mine-*`
- **参考**：`doubao-vue-prototype/src/views/LiquidityMine.vue`

**10. liquidityMine.routes.ts**

- `GET /api/liquidity-mine/pools` → `MinePool[]`
- `POST /api/liquidity-mine/stake` — `{ poolId, amount }`
- `POST /api/liquidity-mine/unstake` — `{ poolId, amount }`
- `POST /api/liquidity-mine/claim` — `{ poolId }`

**11. 路由注册**

- `PageKey` / `navItems` / `App.tsx` / `PAGE_KEYS` 增加 `"liquidity-mine"` / `"Liquidity Mine"`

---

## 单 TASK 工作流（必须按序）

1. 写实现文件  
2. `tsc` — 前端类型  
3. `vite build` — 前端构建  
4. `forge build && forge test` — 合约（在 `contracts/` 目录或 `verify-contracts.mjs`）  
5. **100 轮压力** — 见上表；**100/100 绿才 commit**  
6. `git add . && git commit -m "feat(copy-trade): ..."`（用户/operator 要求 push 时再 push）  
7. 等 CI 绿  
8. 汇报 + 更新 `SESSION_STATE.md` / `docs/99-current-progress.md`

---

## Phase 2 — P2（P1 完成后）

### TASK-P2A: DomainManage 增强（2–3 文件）

- 完整域名注册：输入+查询+注册、已拥有列表、bind/transfer/renew 操作卡
- **参考**：`doubao-vue-prototype/src/views/DomainManage.vue`

### TASK-P2B: SettingPage（2 文件）

- 深色模式、滑点、通知开关、清缓存
- **参考**：`doubao-vue-prototype/src/views/SettingPage.vue`

---

## Phase 3 — P3（P2 完成后）

### TASK-P3A: BatchTransfer 页面（2 文件）

- Transfer / Collect 双 Tab；textarea 填 `address,amount` 对
- 合约已有：`contracts/bsc/BatchTransfer.sol`
- **参考**：`frontend-vue/src/views/BatchTransferPage.vue`

---

## 进度追踪（执行时更新）

**Phase 1–3 全部完成**（2026-05-25）。细节以 `SESSION_STATE.md` 为准。

| Task | 状态 | 100 轮 / 验证 | 备注 |
|------|------|----------------|------|
| P1A CopyTrade | ✅ | E2E **100/100** · verify-full 绿 | `copy-trade.spec.ts` · 页面/API/路由已交付 |
| P1B LiquidityMine | ✅ | Forge **100/100** · verify-full 绿 | `c43eca3a` feat(liquidity-mine) |
| P2A DomainManage | ✅ | verify-full **31/31**（含 domain 2 tests） | `DomainManagePage` · backend domain-manage |
| P2B SettingPage | ✅ | verify-full 绿 · settings **2** tests | `fd1f0673` feat(settings) |
| P3A BatchTransfer | ✅ | E2E **100/100** · verify-full **31/31** | `93bdafb7` stress 加固 · backend 4 tests |

**派工单外**：AI 订阅 `#/ai` ✅（`ai-subscription.spec.ts` 2 · pytest **19/19**）；verify 基建 `143df860`（编码检查排除 `.cursor`）。

---

## 相关文档

- 工程铁律：`docs/00-engineering-standards.md`
- 总计划：`docs/ion-dex-work-plan.md`
- 会话状态：`SESSION_STATE.md`
- 验证：`scripts/verify-full-save-log.cmd`、`scripts/verify-100.ps1`
