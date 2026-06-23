# ⚙️ P0-TASK-001: FunC 全量编译修复 + Forge Build 通过

## 优先级
🟥 P0 — 立即开始，不通不能下一步

## 目标
1. Windows 下用 func-js 管线编译全部 14 个 `.fc` 文件
2. `contracts/bsc/` 下 `forge build` 零警告通过

## 为什么重要
合约不编译 = 废纸。FunC 语法与 Solidity 天差地别，必须逐文件修复运算符优先级、类型不匹配、import 路径问题。

## 执行步骤

### Step 1: 确认工具链
```powershell
# 检查 func-js 是否可用
node -e "require('@ton/func-js')" 2>$null
# 检查 foundry forge
D:\openclaw-tools\foundry\bin\forge.exe --version
```

如果 func-js 报错，需重新安装：
```powershell
cd D:\openclaw-tools\ion-dex-nuke
$env:HTTP_PROXY="http://127.0.0.1:7890"
$env:HTTPS_PROXY="http://127.0.0.1:7890"
npm install @ton/func-js
```

### Step 2: 修复合约导入路径

**现有 FunC 文件清单：**
```
contracts/ion/
├── common/
│   ├── common.fc       # 基础函数
│   └── gas.fc          # Gas 常量
├── pool.fc             # AMM 池主逻辑
├── pool/               # (如有子文件夹)
├── router.fc           # 路由
├── vault.fc            # 金库
├── lp_account.fc       # LP 账户
├── lp_wallet.fc        # LP 钱包
├── deployer.fc         # 部署器
├── FeeDistributor.fc   # 费用分发
├── BridgeInbox.fc      # 桥收件箱
├── staking-pool.fc     # 质押池
├── sandwich.fc         # MEV 夹子
├── dns-auction.fc      # DNS 拍卖
├── dns-registrar.fc    # DNS 注册器
└── dns-resolver.fc     # DNS 解析器
```

**每个文件必须修复的常见问题：**
1. `#include` 路径 → 全部改成相对路径，如 `#include "common/common.fc"`
2. 比较运算符 → FunC 的 `==` 优先于 `&`，必须加括号：`(a == b) & c`
3. 非空检查 → `~ null?(c)` 而不是 `c != null`
4. 类型注解 → 确保函数签名类型正确（int/cell/slice/builder/tuple）
5. 变量命名 → FunC 不支持 `let`，用 `int x = ...`
6. 方法调用 → 确保 `.slice` 等操作符只对正确类型使用

### Step 3: 编写编译脚本

创建 `scripts/compile-func.cmd`：
```batch
@echo off
setlocal enabledelayedexpansion
set ERROR_COUNT=0
set SUCCESS_COUNT=0

for %%f in (contracts\ion\*.fc) do (
  echo Compiling %%~nxf...
  node scripts\compile-func.mjs %%f
  if !ERRORLEVEL! neq 0 (
    echo FAIL: %%f
    set /a ERROR_COUNT+=1
  ) else (
    echo PASS: %%f
    set /a SUCCESS_COUNT+=1
  )
)

echo.
echo Results: %SUCCESS_COUNT% passed, %ERROR_COUNT% failed
if %ERROR_COUNT% neq 0 exit /b 1
exit /b 0
```

创建 `scripts/compile-func.mjs`：
```javascript
import { compile } from '@ton/func-js';
import fs from 'fs';
import path from 'path';

const funcFile = process.argv[2];
const baseDir = path.dirname(path.dirname(funcFile)); // contracts/ion/
const outDir = path.join(path.dirname(funcFile), '..', 'build-func');
fs.mkdirSync(outDir, { recursive: true });

const source = fs.readFileSync(funcFile, 'utf8');
const sources = [{ path: funcFile, content: source }];

// 自动收集所有 .fc 文件作为可能的 include 源
const commonFiles = fs.readdirSync(path.join(baseDir, 'common'))
  .filter(f => f.endsWith('.fc'))
  .map(f => ({
    path: path.join(baseDir, 'common', f),
    content: fs.readFileSync(path.join(baseDir, 'common', f), 'utf8')
  }));

try {
  const result = await compile({
    sources: [...commonFiles, ...sources],
    entries: [funcFile],
    optimization: {
      level: 2,
      methods: {
        constant_folding: true,
        dead_code_elimination: true
      }
    }
  });
  
  // 写入编译产物
  const outName = path.basename(funcFile, '.fc') + '.fif';
  fs.writeFileSync(path.join(outDir, outName), result.fift);
  console.log(`  -> ${outName} (${result.fift.length} bytes)`);
  process.exit(0);
} catch (err) {
  console.error(`  -> ERROR: ${err.message}`);
  process.exit(1);
}
```

### Step 4: Forge Build

```powershell
cd D:\openclaw-tools\ion-dex-nuke\contracts\bsc
D:\openclaw-tools\foundry\bin\forge.exe build --via-ir --optimize --optimizer-runs 200
```

常见 Solidity 修复：
1. 导入路径修正（用 forge remappings）
2. OpenZeppelin 合约版本兼容性
3. 移除未使用的 import
4. 修复 `pragma solidity` 版本约束

### Step 5: 创建 remappings.txt

```txt
@openzeppelin/=lib/openzeppelin-contracts/contracts/
forge-std/=lib/forge-std/src/
```

### Step 6: 验证

```powershell
# FunC 全部编译
node scripts\compile-func.mjs contracts\ion\pool.fc
node scripts\compile-func.mjs contracts\ion\router.fc
# ... 全部 14 个文件

# Forge build
forge build --via-ir --optimize

# 确认结果
echo FunC: all 14/14 compiled
echo Forge: exit code 0, zero warnings
```

## 验收标准
- [ ] 全部 14 个 `.fc` 文件编译通过
- [ ] `forge build` exit code 0
- [ ] 零 warning（forge build 容忍友情提示可以，黄色警告不行）
- [ ] 每个 .fc 编译产物在 `contracts/ion/build-func/` 有对应 .fif
- [ ] 出问题立即修，修好再跑下一轮，不跳过

## 铁律提醒
- 代码必须 UTF-8 无 BOM，写后立刻读回验证
- 每修好一个文件就 git commit
- 发现 FunC 运算符优先级问题 → 立刻加括号，不要加注释 TODO
- **同一个错误修三次不过就搜全网，不要自己硬猜**
- 修通了才能进下一步 P0-TASK-002
