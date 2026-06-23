# 🎯 ION DEX Phase 1 — Swap + Pool 上线

## 定位

ION DEX 第一步：只做 ION 链上的 Swap + Pool。不碰跨链。

用户从 BSC 走 ION 官方桥进 ION 链 → ION DEX Swap/Pool。

## 任务拆解

### 1. ✅ 已完成（无需动）
- FeeDistributor v2 — 50% burn / 25% master / 25% rewards+treasury ✅
- DesignTokens v4.0 — typography/buttons/inputs/data-display ✅
- DEXGridHarness — 350px 1fr 300px 强制栅格 ✅
- NeonCard v2.0 ✅
- VisualAuditor v2.0 + Pixel-Perfect Audit ✅
- agent_harness.py — 安全审计 + FunC 编译 ✅

### 2. 🔴 P0 — Swap 合约 + 前端（本周）

#### 2.1 Swap 合约（已部分完成，验证+修复）
- 文件：`contracts/bsc/DexSwap.sol` + `contracts/bsc/IonSwapRouter.sol`
- 验证：Forge build 通过，Gas snapshot 更新
- 修复：如有编译错误，修到全绿

#### 2.2 Swap 前端页面
- 路由：`/swap`
- 组件：DEXGridHarness 包裹
- Token 选择器（下拉搜索）+ 金额输入 + 滑点设置 + 确认按钮
- 数据：从 IonOracle.sol getReserves 取实时价格
- 所有颜色从 `design-tokens.ts` 引用，禁止硬编码 hex/rgba

#### 2.3 Pool 前端页面
- 路由：`/pool`
- 流动性添加/移除界面
- 仓位展示（你的 LP 仓位列表）
- PancakeSwap V3 风格仓位卡片

### 3. 🟡 P1 — 数据对接

- IonOracle.sol → 前端 Web3 调用 getReserves
- 实时价格展示（ION/USDT, ION/BNB）
- 24h 交易量统计
- 从 CMC/GeckoTerminal API 拉市场数据（可选增强）

### 4. 🟡 P1 — 审计 + 测试

- agent_harness.py execute_security_audit 拦截
- 100 轮压力测试（全绿）
- 10 类攻击测试（重入/闪电贷/三明治/预言机操控/权限绕过/整数溢出/DoS/假币/时间戳/抗量子）

### 5. 🟢 P2 — 部署就绪

- ION 测试网部署脚本
- 主网部署 checklist
- README 部署文档

## 技术约束（铁律）

- 所有费用只收 ION，合约层写死
- Swap 0.3% 手续费 → 50% 销毁 + 25% Master + 25% 质押奖励+国库
- Pool 0.1% 手续费
- Token Launch 创建费 0.1 ION（防粉尘攻击）
- 代码 ≤300 行/文件，超了拆分
- 零 mock/placeholder，每个接口对接真实链上数据
- 前端颜色全从 design-tokens.ts 引用

## 参考

- PancakeSwap V3 合约：`contracts/bsc/DexSwap.sol` + `IonSwapRouter.sol`
- 设计系统：`src/lib/design-tokens.ts`
- 栅格底座：`src/components/layout/DEXGridHarness.tsx`
- 安全引擎：`agent_harness.py`
- ION 手续费库：`contracts/bsc/IonProtocolFeeLib.sol`
- FeeDistributor：`contracts/bsc/FeeReceiver.sol`
- 销毁配置：`contracts/bsc/DynamicBurnConfig.sol`

## 验证标准

1. `forge build` 全绿
2. Swap 页面可正常加载，Token 选择器可用
3. Pool 页面可正常加载，LP 仓位卡片渲染
4. 100 轮压力测试全绿
5. 10 类攻击测试全绿
6. 视觉审计通过（VisualAuditor v2.0）
7. 像素级对齐（Pixel-Perfect Audit Protocol）

---

**此任务为 Cursor 专属。不要手动写代码，指挥 Cursor 干。**
