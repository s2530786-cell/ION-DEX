# DexSwap.sol 安全审计报告

## 合约概览
- 文件: `contracts/bsc/DexSwap.sol`
- 当前状态: 兼容封装
- 实际逻辑: 继承 `DexSwapV2.sol`

## 本轮审计结论
- 历史高风险已关闭: 旧版缺少 `amountOutMinimum`、无 `deadline`、无白名单的实现已移除。
- 当前 `DexSwap.sol` 仅作为向后兼容别名，实际逻辑复用 `DexSwapV2`:
  - 最小输出保护
  - deadline 保护
  - token 白名单
  - `nonReentrant`

## 10 类攻击面审计
### 1. 重入攻击 ✅ 安全
- 复用 `DexSwapV2.nonReentrant`

### 2. 闪电贷操纵 ⚠️ 低
- 仍为 AMM 类合约，经济层风险取决于池模型，但已具备 `amountOutMinimum`

### 3. 三明治攻击 ✅ 安全
- 复用 `deadline + amountOutMinimum`

### 4. 预言机价格操纵 ✅ 安全
- 不依赖预言机

### 5. 权限绕过 ✅ 安全
- 复用 `DexSwapV2.onlyOwner`

### 6. 整数溢出 ✅ 安全
- Solidity `0.8.24`

### 7. 拒绝服务 ✅ 安全
- 无无界循环

### 8. 假币攻击 ✅ 安全
- 复用 token 白名单约束

### 9. 时间戳操纵 ✅ 安全
- 仅用于 deadline 上界

### 10. 抗量子攻击 ⚠️ 低
- 标准 EVM 权限模型

## 验证
- `forge test --root contracts` ✅
- 相关覆盖:
  - `test_Security_Bonus_DexSwapV2MinOut_100x`
  - `test_Security_2_FlashLoanSlippage_100x`

## 总体评级
- ✅ 低风险
- 说明: 旧版直接暴露的高风险 AMM 入口已封口，兼容入口已指向 V2。
