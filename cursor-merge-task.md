# ION DEX 豆包代码合并任务

## 任务概述
将豆包生成的完整代码合并进 ion-dex-nuke 项目。源文件在 `over---deduped.txt`（46,878行）。

## 第一步：修复并写入 Solidity 合约到 contracts/bsc/

从源文件中提取以下合约，修复 Bug 后写入 `contracts/bsc/`：

### 1. AdminManager.sol
**Bug**: `modifier whenNotPaused() override` 语法错误。Pausable 已有 whenNotPaused modifier。
**修复**: 去掉整行 `modifier whenNotPaused() override { ... }`。保留 pause/unpause。
写入路径: `contracts/bsc/AdminManager.sol`

### 2. LiquidityPool.sol 
**Bug**: `admin.whenNotPaused()` 是 modifier 不是函数，不能用在 require 里。
**修复**: 改成 `require(!admin.paused(), "paused")`。
写入路径: `contracts/bsc/LiquidityPool.sol`

### 3. DexSwap.sol
**Bug 1**: `admin.whenNotPaused()` 同样修复
**Bug 2**: `IERC20(tokenOut).transferFrom(address(lpPool), ...)` 错。lpPool 没给 DexSwap 授权。改成 `IERC20(tokenOut).transfer(msg.sender, amountOut)`
写入路径: `contracts/bsc/DexSwap.sol`

### 4. StakeReward.sol
**Bug 1**: `admin.whenNotPaused()` 修复
**Bug 2**: 精度问题 - 加 uint256 精度系数，防止除以 totalStaked 时的精度丢失
写入路径: `contracts/bsc/StakeReward.sol`

写入后运行 `forge build` 验证编译通过。

## 第二步：提取 Python 后端到 backend/

从源文件 L39060~L46900 提取 Python 文件到 `backend/`。

## 第三步：提取 Vue3 前端到 frontend/

从源文件提取所有前端文件到 `frontend/src/`（35个页面 + stores + components + utils + hooks + i18n + abi + router + styles）。

所有占位符（chainId:12345, 合约地址:0x你的XXX）保持原样待后续替换。

## 原则
- 不写 mock/placeholder
- 修复 Bug 不改架构
- 文件写完读回检查 UTF-8 中文无乱码
- 每个合约 forge build 验证
