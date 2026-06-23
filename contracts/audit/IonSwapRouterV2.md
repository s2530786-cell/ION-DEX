# IonSwapRouterV2.sol 安全审计报告

## 合约概览
- 文件: `contracts/bsc/IonSwapRouterV2.sol`
- 功能: 通过白名单池执行 `swapExactIn`，带 `deadline`、`amountOutMinimum` 与协议费收取
- 依赖: `ReentrancyGuard`, `IonProtocolFeeLib`

## 10 类攻击面审计

### 1. 重入攻击
- `swapExactIn` 使用 `nonReentrant`
- 风险等级: **低**

### 2. 闪电贷操纵
- 路由层依赖池子自身定价
- `amountOutMinimum` 提供最小输出保护
- 风险等级: **低**

### 3. 三明治攻击
- `deadline` + `amountOutMinimum` 提供基础保护
- 风险等级: **低**

### 4. 预言机操纵
- 不直接依赖预言机
- 风险等级: **无**

### 5. 权限绕过
- `setFeeReceiver` / `setPoolWhitelist` / `transferOwnership` 仅 owner 可调
- 白名单池限制可调用目标
- 风险等级: **低**

### 6. 整数溢出
- Solidity `0.8.24` 自带检查
- 风险等级: **无**

### 7. 拒绝服务
- 无循环
- 风险等级: **无**

### 8. 假币攻击
- 白名单限制池地址
- 风险等级: **低**

### 9. 时间戳操纵
- `deadline` 使用标准时间比较
- 风险等级: **低**

### 10. 签名/抗量子面
- 不涉及签名
- 风险等级: **无**

## 本轮修复
- 修复 1: 将测试专用 `IonSwapPoolMock` 从生产文件移出
- 新路径: `contracts/test/mocks/IonSwapPoolMock.sol`

## 结论
- 总体评级: **低风险**
- 说明: 当前主要风险仍取决于底层池实现是否正确执行真实 swap 与代币校验。
