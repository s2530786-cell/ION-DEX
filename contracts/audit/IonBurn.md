# IonBurn.sol 安全审计报告

## 合约概览
- 文件: contracts/bsc/IonBurn.sol
- 行数: 97
- 功能: ION 销毁合约 — 根据市场模式执行动态销毁，支持 feeReceiver 和 owner 调用 executeBurn，任何人可 burn
- 依赖: OpenZeppelin IERC20, DynamicBurnConfig, IonOracleV2

## 10 类攻击面审计

### 1. 重入攻击 ✅ 安全
- `executeBurn` 和 `burn` 使用自定义 `nonReentrant` 修饰符
- 状态更新（totalBurned += amount）在外部 transfer 调用前完成
- 风险等级: **无**

### 2. 闪电贷操纵 ✅ 安全
- 不涉及 AMM 池
- 风险等级: **无**

### 3. 三明治攻击 ✅ 安全
- 不涉及交易路由
- 风险等级: **无**

### 4. 预言机价格操纵 ✅ 安全
- 使用 IonOracleV2.getPriceView() 判断市场模式
- getPriceView 是 view 函数，不修改状态
- 市场模式仅用于事件日志，不影响销毁逻辑
- 风险等级: **低**

### 5. 权限绕过 ✅ 安全
- `executeBurn`: 仅 feeReceiver 或 owner 可调用
- `burn`: 任何人可调用（公开销毁）
- `onlyOwner` 修饰符正确
- 风险等级: **无**

### 6. 整数溢出 ✅ 安全
- Solidity ^0.8.24 自带溢出检查
- `totalBurned += amount` 安全
- 风险等级: **无**

### 7. 拒绝服务 ✅ 安全
- 无循环
- 风险等级: **无**

### 8. 假币攻击 ✅ 安全
- `ionToken` 在构造函数中设置且为 immutable
- 风险等级: **无**

### 9. 时间戳操纵 ✅ 安全
- 不直接使用 block.timestamp 做关键决策
- 风险等级: **无**

### 10. 抗量子攻击 ✅ 安全
- 标准 ECDSA
- 风险等级: **低**

## ⚠️ 发现的问题

### P11: burn() 公开函数可能被滥用
- `burn()` 允许任何人销毁自己的 ION
- 这是设计意图（公开销毁），但可能导致意外销毁
- **影响**: 低 — 需要用户主动调用
- **建议**: 在前端添加确认提示

### P12: executeBurn 中 _getMarketMode 使用 view 函数
- `_getMarketMode` 调用 `oracle.getPriceView()` 是 view 函数
- 如果 oracle 地址无效，view 调用也会 revert
- **影响**: 低 — oracle 由 owner 设置

## 总体评级: ✅ 低风险
