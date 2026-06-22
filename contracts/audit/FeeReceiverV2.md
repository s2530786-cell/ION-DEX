# FeeReceiverV2.sol 安全审计报告

## 合约概览
- 文件: contracts/bsc/FeeReceiverV2.sol
- 行数: 100
- 功能: 手续费分配器 V2 — 接收 ION 手续费，根据市场模式动态分配至销毁/质押/国库/Keeper/Team
- 依赖: DynamicBurnConfig, IonOracleV2

## 10 类攻击面审计

### 1. 重入攻击 ✅ 安全
- `distributeFees` 使用自定义 `nonReentrant` 修饰符
- 状态更新（_updateMarketMode）在外部 transfer 调用前完成
- 风险等级: **无**

### 2. 闪电贷操纵 ✅ 安全
- 不涉及 AMM 池
- 风险等级: **无**

### 3. 三明治攻击 ✅ 安全
- 不涉及交易路由
- 风险等级: **无**

### 4. 预言机价格操纵 ⚠️ 需注意
- 使用 IonOracleV2 获取价格判断市场模式
- IonOracleV2 有价格偏差检查 (MAX_PRICE_DEVIATION_BPS = 50%)
- Oracle 过期时回退到 Neutral 模式
- 风险等级: **低**

### 5. 权限绕过 ✅ 安全
- `onlyOwner` 修饰符正确
- `distributeFees` 无权限限制（任何人可调用），但 fee 来自调用者 transferFrom
- 风险等级: **无**

### 6. 整数溢出 ✅ 安全
- Solidity ^0.8.24 自带溢出检查
- 费用计算: `amount * bps / FEE_DENOMINATOR` 先乘后除
- toKeeper = amount - sum(others)，可能为 0
- 风险等级: **无**

### 7. 拒绝服务 ✅ 安全
- 无循环
- 风险等级: **无**

### 8. 假币攻击 ✅ 安全
- `distributeFees` 强制检查 `token == ionToken`
- 风险等级: **无**

### 9. 时间戳操纵 ✅ 安全
- 不直接使用 block.timestamp 做关键决策
- 风险等级: **无**

### 10. 抗量子攻击 ✅ 安全
- 标准 ECDSA
- 风险等级: **低**

## ⚠️ 发现的问题

### P5: distributeFees 中 keeper 费用可能为 0 时仍执行 transfer
- 当 `toKeeper = 0` 时，`if (toKeeper > 0)` 正确跳过
- 但所有其他分配也做了 > 0 检查，正确
- **影响**: 无

### P6: _updateMarketMode 中 oracle 调用可能 revert
- `oracle.getPriceWithDeviationCheck` 如果 oracle 地址无效会 revert
- 但 oracle 由 owner 设置，且构造函数检查非零地址
- **影响**: 低

## 总体评级: ✅ 低风险 (V1 问题已修复)
