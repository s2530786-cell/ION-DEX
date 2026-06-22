# ION FunC 编译修复日志 (FIX-LOG)

> 日期：2026-05-22  
> 范围：仅 `contracts/ion/**/*.fc`  
> 编译器：`D:\openclaw-data\workspace\func.exe`（FunC v0.4.4）  
> stdlib：`D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc`  
> 命令模板：`func -o build/<name>.fif -SPA stdlib.fc common/gas.fc common/common.fc <contract>.fc`

---

## 1. 初始逐文件编译扫描

对 13 个主合约各执行一次编译，**零报错**：

| 合约 | exit code | 备注 |
|------|-----------|------|
| pool.fc | 0 | OK |
| router.fc | 0 | OK |
| FeeDistributor.fc | 0 | OK |
| lp_account.fc | 0 | OK |
| lp_wallet.fc | 0 | OK |
| vault.fc | 0 | OK |
| staking-pool.fc | 0 | OK |
| sandwich.fc | 0 | OK |
| BridgeInbox.fc | 0 | OK |
| deployer.fc | 0 | OK |
| dns-auction.fc | 0 | OK |
| dns-registrar.fc | 0 | OK |
| dns-resolver.fc | 0 | OK |

**本次会话新增编译错误：0**（历史修复见 `FIX_LOG.md` F1–F8 / S1）。

---

## 2. 与 `contracts/bsc/IonSwapRouter.sol` 功能对照

| BSC Solidity | FunC 对应 | 说明 |
|--------------|-----------|------|
| `swapExactIn(pool, amountIn, amountOutMinimum, recipient)` | `router.fc` → `op::route_swap` → `handle_route_swap()` | 解析 `amount_in`、`min_out`、`recipient`，转发至 pool |
| `amountIn == 0` → revert | `throw_unless(error::invalid_amount, amount_in > 0)` | router + pool 双侧校验 |
| `amountOut < amountOutMinimum` → revert | `pool.fc` → `handle_swap()` → `throw_unless(error::slippage, amount_out >= min_out)` | AMM 计算后强制滑点下限 |
| pool 地址校验 | `throw_unless(error::invalid_path, …)` + `storage::pool_dict` 注册表 | ION 侧用已注册 pool 白名单替代 EVM `address(0)` 检查 |
| `SwapExactIn` 事件 | pool 出站消息携带 `op::swap` + `amount_out` | 链上消息等价于 swap 完成通知 |

**结论**：BSC 路由的 exact-input + minimum-output 语义已在 `router.fc`（转发 `min_out`）与 `pool.fc`（`error::slippage`）完整实现，无需额外改动。

---

## 3. 修复项（本次会话）

无。基线已可编译；未修改任何 `.fc` 源文件。

---

## 4. 压力测试（100 绿门禁）

### 4.1 单合约 × 100 次编译

脚本：`scripts/func-compile-100.ps1`

```
13 contracts × 100 passes = 1300 compiles
RESULT=GREEN — all 13 contracts x 100 passes
```

### 4.2 全量连续 100 轮编译

脚本：`scripts/phase1-compile.ps1`

```
100 consecutive rounds × 13 contracts = 1300 compiles (round-gated)
RESULT=GREEN — PHASE 1 COMPLETE (100 consecutive clean rounds)
```

### 4.3 业务逻辑测试套件 × 100 次

脚本：`contracts/ion/test/run_tests.ps1`

```
100 consecutive runs, each: ALL TESTS PASSED (exit 0)
RESULT=GREEN — all 100 test-suite runs passed
```

---

## 5. 编译要点（供后续 CI 复用）

1. **stdlib 必须第一个**出现在 `func` 命令行参数中。  
2. **路径使用正斜杠** `/`（含 `#include` 与 CLI 路径）。  
3. 公共库顺序：`stdlib.fc` → `common/gas.fc` → `common/common.fc` → 合约 `.fc`。  
4. 勿使用 `contracts/ion/imports/stdlib.fc`（不存在）；使用官方 ION stdlib 路径。

---

## 6. 状态摘要

| 检查项 | 结果 |
|--------|------|
| 13 合约单次编译 | ✅ 0 错误 |
| func-compile-100 | ✅ 1300/1300 |
| phase1-compile 100 轮 | ✅ 100/100 轮全绿 |
| run_tests × 100 | ✅ 100/100 全绿 |
| IonSwapRouter 语义对齐 | ✅ 已覆盖 |

**最终结论：`contracts/ion/` 全部 `.fc` 可编译，100 次压力测试全绿，任务完成。**
