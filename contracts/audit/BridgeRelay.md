# BridgeRelay.sol 安全审计报告

## 合约概览
- 文件: `contracts/bsc/BridgeRelay.sol`
- 当前状态: 兼容封装
- 实际逻辑: 继承 `BridgeRelayV2.sol`

## 本轮审计结论
- 历史高风险已关闭: 旧版单 relayer 直接放款实现已移除。
- 当前 `BridgeRelay.sol` 仅作为 `BridgeRelayV2` 的向后兼容别名，实际执行路径已具备:
  - `nonReentrant`
  - relayer quorum 计数
  - 参数哈希一致性校验
  - 重放防护
  - quorum 动态边界约束

## 10 类攻击面审计
### 1. 重入攻击 ✅ 安全
- 复用 `BridgeRelayV2.nonReentrant`

### 2. 闪电贷操纵 ✅ 安全
- 桥消息流不依赖价格或池储备

### 3. 三明治攻击 ✅ 安全
- 桥消息不参与 AMM 排序成交

### 4. 预言机价格操纵 ✅ 安全
- 不依赖预言机

### 5. 权限绕过 ✅ 安全
- 复用 `BridgeRelayV2` 的 relayer 白名单与 quorum 约束

### 6. 整数溢出 ✅ 安全
- Solidity `0.8.24`

### 7. 拒绝服务 ⚠️ 低
- relayer 列表仍受 `MAX_RELAYERS` 限制，属于设计上界，不构成无限增长

### 8. 假币攻击 ✅ 安全
- 代币释放仍受 vault 锁仓余额约束

### 9. 时间戳操纵 ✅ 安全
- 不依赖 `block.timestamp`

### 10. 抗量子攻击 ⚠️ 低
- 仍为标准 EVM 地址权限模型

## 验证
- `forge test --root contracts` ✅
- 覆盖用例:
  - `test_revert_duplicate_nonce`
  - `test_Security_3a_ReentrancyReleaseGuard_100x`
  - `test_Security_BridgeQuorum2of3_100x`
  - `test_P0_1c_IonToBsc_Release_100Rounds`

## 总体评级
- ✅ 低风险
- 说明: 旧版桥中继逻辑已不再独立暴露，兼容入口现已指向已修复的 V2。
