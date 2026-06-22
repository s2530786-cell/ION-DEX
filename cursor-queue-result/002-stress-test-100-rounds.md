# 🧪 P0-TASK-002: 100 轮压力测试 + Gas 基线

## 优先级
🟥 P0 — 编译通过后立即干这个

## 目标
- IonWrapper 压力测试 100 轮全绿
- BSCVault 压力测试 100 轮全绿
- Gas 快照基线记录

## 血泪教训（必读）
Master 铁律㉑：**修不好不跳过。** 同一个问题修三次修不好就跳过——这不行。必须修好，修到行为止。

铁律㉒：**99绿+1红 = FAIL。** 100 轮必须全部绿色，少一轮都不算。

## 需要创建的文件

### 1. `contracts/bsc/test/IonWrapper.stress.t.sol`
```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.25;

import "forge-std/Test.sol";
import "../IonWrapper.sol";
import "../MockERC20.sol";

contract IonWrapperStressTest is Test {
    IonWrapper wrapper;
    MockERC20 ion;
    MockERC20 usdt;
    address user = address(0x1);
    
    // 配置参数
    uint256 constant ROUNDS = 100;
    uint256 constant MINT_AMOUNT = 1_000_000 ether;
    uint256 constant BURN_AMOUNT = 500_000 ether;
    
    function setUp() public {
        ion = new MockERC20("ION", "ION", 18);
        usdt = new MockERC20("USDT", "USDT", 18);
        wrapper = new IonWrapper();
        
        ion.mint(user, MINT_AMOUNT);
        usdt.mint(user, MINT_AMOUNT);
        
        vm.startPrank(user);
        ion.approve(address(wrapper), type(uint256).max);
        vm.stopPrank();
    }
    
    function testStress_100Rounds_MintBurn() public {
        vm.startPrank(user);
        for (uint256 i = 0; i < ROUNDS; i++) {
            // mint
            wrapper.mint(MINT_AMOUNT);
            assertGe(ion.balanceOf(user), 0);
            
            // burn
            wrapper.burn(BURN_AMOUNT);
            assertGe(ion.balanceOf(user), 0);
            
            // 边界条件：小量操作
            if (i % 10 == 0) {
                wrapper.mint(1 wei);
                wrapper.burn(1 wei);
            }
            
            // 边界条件：大量操作
            if (i % 25 == 0) {
                wrapper.mint(MINT_AMOUNT - 1);
                wrapper.burn(BURN_AMOUNT - 1);
            }
        }
        vm.stopPrank();
    }
    
    function testStress_100Rounds_ZeroBalances() public {
        // 测试余额为 0 时的边界行为
        vm.startPrank(user);
        for (uint256 i = 0; i < ROUNDS; i++) {
            // 全量 burn
            uint256 balance = wrapper.balanceOf(user);
            if (balance > 0) {
                wrapper.burn(balance);
            }
            // 再 mint
            wrapper.mint(MINT_AMOUNT / ROUNDS);
        }
        vm.stopPrank();
    }
    
    function testGasSnapshot_MintBurn() public {
        vm.startPrank(user);
        
        // 首次 mint（gas 较高）
        uint256 gasBefore = gasleft();
        wrapper.mint(1000 ether);
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("Gas used - first mint", gasUsed);
        
        // 后续 mint
        gasBefore = gasleft();
        wrapper.mint(1000 ether);
        gasUsed = gasBefore - gasleft();
        emit log_named_uint("Gas used - subsequent mint", gasUsed);
        
        // burn
        gasBefore = gasleft();
        wrapper.burn(500 ether);
        gasUsed = gasBefore - gasleft();
        emit log_named_uint("Gas used - burn", gasUsed);
        
        vm.stopPrank();
    }
}
```

### 2. `contracts/bsc/test/BSCVault.stress.t.sol`
类似结构，测试 deposit/withdraw/signature 场景。

## 验证命令

```powershell
cd D:\openclaw-tools\ion-dex-nuke\contracts\bsc

# 跑全部测试（含 stress）
D:\openclaw-tools\foundry\bin\forge.exe test --via-ir --gas-report -vvv

# 只跑 stress 测试
D:\openclaw-tools\foundry\bin\forge.exe test --match-test testStress -vvv

# Gas snapshot
D:\openclaw-tools\foundry\bin\forge.exe snapshot --via-ir
```

## 验收标准
- [ ] `testStress_100Rounds_MintBurn` — 100 轮循环全部 PASS
- [ ] `testStress_100Rounds_ZeroBalances` — 100 轮边界条件全部 PASS
- [ ] BSCVault stress test — 同类 100 轮 PASS
- [ ] Gas gasreport 无异常峰值（mint/burn 不应超过 200K gas 的 3 倍）
- [ ] 结果输出到 `contracts/bsc/gas-snapshot.txt`
- [ ] 跑完之后 git commit，消息包含 "stress-test-pass-100"
- [ ] 不通过就修，修好再跑，跑通为止

## 铁律提醒
- 🚫 不缩减轮数（100 轮就是 100，5 轮不算）
- 🚫 不忽略 WARNING（forge test 的提醒可以看，黄色警告必须修）
- 🚫 不标记 TODO 跳过失败 case
- ✅ 记录首次 mint vs 后续 mint 的 gas 差异，确认逻辑正确
