# IonOracleV2.sol 安全审计报告

## 合约概览
- 文件: `contracts/bsc/IonOracleV2.sol`
- 功能: 主/备预言机读取、价格过期判断、偏差保护、缓存最近有效价格
- 依赖: `AggregatorV3Interface`

## 10 类攻击面审计

### 1. 重入攻击
- 仅做 view 读取与本地状态缓存
- 风险等级: **无**

### 2. 闪电贷操纵
- 默认依赖 Chainlink 类喂价，不直接读取 AMM 现货
- 风险等级: **低**

### 3. 三明治攻击
- 不直接执行交易
- 风险等级: **无**

### 4. 预言机操纵
- 有 `STALE_THRESHOLD`
- 有 `maxDeviationBps` 偏差保护
- 支持 backup oracle
- 本轮补强:
  - `getPriceView` 在主源过期/无效时会回退 fresh backup
  - 主/备 decimals 必须一致
- 风险等级: **低**

### 5. 权限绕过
- `setOracle` / `setBackupOracle` / `transferOwnership` 仅 owner 可调
- 风险等级: **无**

### 6. 整数溢出
- Solidity `0.8.24` 自带检查
- 偏差计算分母使用 `lastValidPrice > 0` 守卫
- 风险等级: **无**

### 7. 拒绝服务
- 主源失效时可回退 backup 或 cached price
- 风险等级: **低**

### 8. 假币攻击
- 不涉及代币转账
- 风险等级: **无**

### 9. 时间戳操纵
- 仅用时间戳判断喂价陈旧度
- 属于标准预言机 freshness 检查
- 风险等级: **低**

### 10. 签名/抗量子面
- 不涉及签名
- 风险等级: **无**

## 本轮修复
- 修复 1: `setBackupOracle` 增加 decimals 一致性校验
- 修复 2: `setOracle` 在已有 backup 时同步校验 decimals 一致性
- 修复 3: `getPriceView` 支持只读路径回退 backup oracle

## 结论
- 总体评级: **低风险**
- 说明: 剩余风险主要来自 owner 错配外部预言机地址，而非内部算术或状态机缺陷。
