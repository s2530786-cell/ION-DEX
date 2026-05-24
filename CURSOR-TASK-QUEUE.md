# CURSOR AUTO TASK QUEUE — 执行前先读完所有任务

> ⏰ 生成时间: 2026-05-24 10:11 CST
> 分支: security-test-fix (PR #16, 等待合并)
> 项目: ion-dex-nuke

## 📋 总体优先级
P0 > P1 > P2 > P3

---

## 🟥 P0-001: 等待 PR 合并 → 继续开发

### 前置条件
1. PR #15 (main-refactor) CI 全绿 → Master Web approve → 合并到 main
2. PR #16 (security-test-fix) CI 全绿 → Master Web approve → 合并到 main
3. 合并后切到 main, `git pull`

### 验收门槛
- 两个 CI run 全部绿色（verify ✅ + CodeQL ✅）
- 所有 blocking warning 清零

---

## 🟥 P0-002: SecurityMatrix 1000/1000 全绿

### 目标
`forge test --match-contract SecurityMatrix -vvvv` → 1000/1000 PASS, 0 FAILED

### 当前状态
已知 vault.lock() 第 4 参数修复后 999/1000（差 1）
运行 `forge test --match-contract SecurityMatrix -vvvv --gas-report` 直到全绿

---

## 🟥 P0-003: ION 统一手续费（合约硬编码）

### 规则（Master 钦定）
- 整个 DEX **所有费用只收 ION 代币**
- Swap/Pool/Stake/Bridge/授权撤销 → 全部只收 ION
- 合约层写死，不可更改
- 非 ION 交易对 → 从 output 扣等值 ION（通过池内 swap）

### 修改范围
- FeeReceiver.sol / IonSwapRouter.sol / BSCVault.sol
- StakingPool.sol / BridgeRelay.sol 等
- Router、Pool、Fee 等 ION FunC 合约

---

## 🟧 P1-001: 真实合约地址替换

### 目标
`config/contracts.ts`（或等效配置文件）中所有占位地址 → 真实部署地址

### 需替换
- USDT BSC 正式合约地址
- ION BSC 合约地址
- IonRouter、Vault、FeeReceiver 等部署地址
- WBNB 地址（BSC 主网）

---

## 🟧 P1-002: 测试网部署 + E2E 自动化

### 目标
1. 跑通 `Deploy.s.sol` 到 BSC 测试网
2. Run Playwright E2E 全通

### 说明
- 需要测试网密钥（可在本地 .env 配置）
- 不需要真实资金
- BSC 测试网水龙头有免费 BNB

---

## 🟨 P2-001: UI 响应式适配

### 目标
所有页面在 375px~1440px 正常显示
- Swap / Pool / Stake / Profile / Bridge / Market

### 参考
https://github.com/DavidHDev/react-bits（Master 钦定 UI 参考源）

---

## 🟨 P2-002: 资产报告面板（新增）

### 需求
前端展示 Master 的完整持仓面板：
- ION 持仓 + 质押收益
- LINK 网格 + USDT
- 各链资产汇总
- 图表展示

---

## 🟩 P3-001: FunC CI 恢复

### 说明
当前 CI 中 FunC 编译走 fallback 模式（失败不阻塞）
等 ION 官方出 Linux 预编译 func/fift binary 后恢复
跟踪: https://github.com/ice-blockchain/ion/releases

---

## ⚡ 重要提示

1. **每次 commit 前跑：** `forge build && npm run verify`（后端+前端全通再提交）
2. **提交格式：** `type(scope): description`
3. **不提交问题代码**：所有文件 UTF-8 无 BOM，写后读回中文可读性
4. **CI 红灯必须修到位**：不能跳过、不能忽略、只用 fallback 机制过不了的
