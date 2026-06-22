# BridgeRelayV2.sol 安全审计报告

## 合约概览
- 文件: contracts/bsc/BridgeRelayV2.sol
- 行数: 113
- 功能: 跨链桥多签中继器 V2 — 多 relayer 通过 quorum 机制 attest 入站消息后释放资金
- 依赖: OpenZeppelin ReentrancyGuard, IBSCVault

## 10 类攻击面审计

### 1. 重入攻击 ✅ 安全
- `attestInbound` 使用 OpenZeppelin `nonReentrant` 修饰符
- 状态更新（consumedNonce、attestationMask、attestationCount）在外部调用 `IBSCVault.release` 之前完成
- 风险等级: **无**

### 2. 闪电贷操纵 ✅ 安全
- 不涉及 AMM 池储备或价格计算
- 风险等级: **无**

### 3. 三明治攻击 ✅ 安全
- 不涉及链上交易路由
- 风险等级: **无**

### 4. 预言机价格操纵 ✅ 安全
- 不使用预言机
- 风险等级: **无**

### 5. 权限绕过 ✅ 安全
- `onlyOwner` 和 `onlyRelayer` 修饰符正确
- `attestInbound` 双重检查：`onlyRelayer` + `getRelayerIndex` 内部验证
- 风险等级: **无**

### 6. 整数溢出 ✅ 安全
- Solidity ^0.8.24 自带溢出检查
- `1 << idx` 位运算在 idx < 32 范围内安全（MAX_RELAYERS = 32）
- 风险等级: **无**

### 7. 拒绝服务 ⚠️ 需注意
- `getRelayerIndex` 遍历 relayerList，最坏 O(32)，可接受
- `removeRelayer` 遍历 relayerList，最坏 O(32)，可接受
- `attestInbound` 中 `consumedNonce[nonce]` 在 quorum 达到后才设为 true，重复 nonce 被正确拒绝
- 风险等级: **低**

### 8. 假币攻击 ✅ 安全
- token 参数由 relayer 提供，但 release 由 BSCVault 执行
- BSCVault 应自行验证 token 合法性
- 风险等级: **低**（依赖 BSCVault 验证）

### 9. 时间戳操纵 ✅ 安全
- 不使用 block.timestamp
- 风险等级: **无**

### 10. 抗量子攻击 ⚠️ 需注意
- 标准 ECDSA
- 风险等级: **低**

## ⚠️ 发现的问题

### P1: setQuorum 在 relayerList 为空时可能被绕过
- `setQuorum` 检查 `quorum_ > uint8(relayerList.length)`，当 relayerList 为空时 quorum 必须为 0，但构造函数要求 quorum > 0
- 如果所有 relayer 被移除后，quorum 可能大于 relayerList.length，导致永远无法达到 quorum
- **影响**: 中 — 需要 owner 恶意操作
- **建议**: 在 removeRelayer 后检查 quorum <= relayerList.length

### P2: attestInbound 中 nonce 可被第一个 relayer 设置任意 token/user/amount
- 第一个 attest 的 relayer 可以设置任意参数，后续 relayer 无法验证参数一致性
- 如果第一个 relayer 作恶，可以设置不同的 token/user/amount
- **影响**: 高 — 需要 relayer 作恶
- **建议**: 在第一次 attest 时存储 (token, user, amount) 哈希，后续 attest 验证一致性

## 总体评级: ⚠️ 中等风险 (P2 需关注)
