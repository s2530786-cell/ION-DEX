# 🎯 任务：把 EVM 合约翻译成 FunC

## 一句话
豆包生成的 DEX 框架设计全部保留，但合约层是 EVM (Solidity) 的，ION 链用的是 FunC。只需要把 `contracts/ion/` 下的 FunC 代码修好编译通过就行。

## 什么不能碰 ❌
以下目录**绝对不要改**，他们是 API/UI 层，跟链上合约无关：
- `backend/` — 后端 API（Node.js）
- `frontend/` — React 前端
- `indexer/` — 索引器
- `relayer/` — 中继服务
- `sentinel/` — 监控
- `contracts/bsc/` — BSC 桥合约（Solildity，官方已有现成的）
- `contracts/lib/forge-std` — Foundry 工具
- `contracts/test/` — Foundry 测试
- `contracts/foundry.toml` — 配置

## 什么要改 ✅
**只修 `contracts/ion/` 目录下的 FunC 代码。**

已经有的 `.fc` 文件清单：
- `router.fc` — DEX 路由（核心）
- `pool.fc` — 流动性池（核心）
- `lp_account.fc` / `lp_wallet.fc` — LP 凭证
- `vault.fc` — 金库
- `staking-pool.fc` — 质押池
- `sandwich.fc` — 三明治攻击检测
- `FeeDistributor.fc` — 手续费分配
- `BridgeInbox.fc` — 跨链收件箱
- `deployer.fc` — 部署器
- `common/common.fc` — 公共函数
- `common/gas.fc` — Gas 工具

另外还有：
- `build/` — 编译脚本 (.fif)
- `deploy/` — 部署脚本 (.fif)
- `test/` — 测试脚本

## 执行步骤

### 第1步：检查现有 FunC 能不能编译
- 跑 `func` 命令编译每个 `.fc` 文件
- 记录所有编译错误到 `contracts/ion/FIX-LOG.md`
- 常见的 FunC 坑：运算符优先级要加括号 `(a > 0) & (b > 0)`、少分号、比较操作符不对

### 第2步：比对 EVM vs FunC 功能
- 看一眼 `contracts/bsc/IonSwapRouter.sol` 的实现
- 检查 `contracts/ion/router.fc` 有没有实现同样的功能
- 确保 FunC 版实现了所有核心函数（swap、addLiquidity、removeLiquidity 等）
- 缺什么补什么

### 第3步：修到能编译通过
- 修所有编译错误，直到 `func` 命令零报错
- 每个 `.fc` 文件单独编译验证
- 确认 `build/` 里的 .fif 脚本能正常跑

### 第4步：跑测试
- 执行 `contracts/ion/test/` 里的测试
- 确保所有测试通过

## EVM vs FunC 对照表
| EVM (Solidity) | FunC (ION/TON) |
|---------------|----------------|
| uint256 | int257（注意是模运算）|
| address | MsgAddress / cell |
| mapping | HashMap（cell 字典）|
| require/revert | throw / ~ |
| emit Event | 没有事件，用消息日志 |
| this.balance | MyBalance() |
| transfer | SendRawMessage |
| ERC-20 | Jetton 标准 |
| UniswapV2 | 自定义 Jetton 转账模式 |

## 完成标准
1. 所有 `.fc` 文件编译零报错 👉 `func` 命令通过
2. EVM 合约的功能在 FunC 里都有对应实现
3. 测试脚本通过
4. commit 信息：`"feat(contracts): translate EVM BSC contracts to FunC"`
