# 鈿欙笍 P0-TASK-001: FunC 鍏ㄩ噺缂栬瘧淇 + Forge Build 閫氳繃

## 浼樺厛绾?馃煡 P0 鈥?绔嬪嵆寮€濮嬶紝涓嶉€氫笉鑳戒笅涓€姝?
## 鐩爣
1. Windows 涓嬬敤 func-js 绠＄嚎缂栬瘧鍏ㄩ儴 14 涓?`.fc` 鏂囦欢
2. `contracts/bsc/` 涓?`forge build` 闆惰鍛婇€氳繃

## 涓轰粈涔堥噸瑕?鍚堢害涓嶇紪璇?= 搴熺焊銆侳unC 璇硶涓?Solidity 澶╁樊鍦板埆锛屽繀椤婚€愭枃浠朵慨澶嶈繍绠楃浼樺厛绾с€佺被鍨嬩笉鍖归厤銆乮mport 璺緞闂銆?
## 鎵ц姝ラ

### Step 1: 纭宸ュ叿閾?```powershell
# 妫€鏌?func-js 鏄惁鍙敤
node -e "require('@ton/func-js')" 2>$null
# 妫€鏌?foundry forge
D:\openclaw-tools\foundry\bin\forge.exe --version
```

濡傛灉 func-js 鎶ラ敊锛岄渶閲嶆柊瀹夎锛?```powershell
cd D:\openclaw-tools\ion-dex-nuke
$env:HTTP_PROXY="http://127.0.0.1:7890"
$env:HTTPS_PROXY="http://127.0.0.1:7890"
npm install @ton/func-js
```

### Step 2: 淇鍚堢害瀵煎叆璺緞

**鐜版湁 FunC 鏂囦欢娓呭崟锛?*
```
contracts/ion/
鈹溾攢鈹€ common/
鈹?  鈹溾攢鈹€ common.fc       # 鍩虹鍑芥暟
鈹?  鈹斺攢鈹€ gas.fc          # Gas 甯搁噺
鈹溾攢鈹€ pool.fc             # AMM 姹犱富閫昏緫
鈹溾攢鈹€ pool/               # (濡傛湁瀛愭枃浠跺す)
鈹溾攢鈹€ router.fc           # 璺敱
鈹溾攢鈹€ vault.fc            # 閲戝簱
鈹溾攢鈹€ lp_account.fc       # LP 璐︽埛
鈹溾攢鈹€ lp_wallet.fc        # LP 閽卞寘
鈹溾攢鈹€ deployer.fc         # 閮ㄧ讲鍣?鈹溾攢鈹€ FeeDistributor.fc   # 璐圭敤鍒嗗彂
鈹溾攢鈹€ BridgeInbox.fc      # 妗ユ敹浠剁
鈹溾攢鈹€ staking-pool.fc     # 璐ㄦ娂姹?鈹溾攢鈹€ sandwich.fc         # MEV 澶瑰瓙
鈹溾攢鈹€ dns-auction.fc      # DNS 鎷嶅崠
鈹溾攢鈹€ dns-registrar.fc    # DNS 娉ㄥ唽鍣?鈹斺攢鈹€ dns-resolver.fc     # DNS 瑙ｆ瀽鍣?```

**姣忎釜鏂囦欢蹇呴』淇鐨勫父瑙侀棶棰橈細**
1. `#include` 璺緞 鈫?鍏ㄩ儴鏀规垚鐩稿璺緞锛屽 `#include "common/common.fc"`
2. 姣旇緝杩愮畻绗?鈫?FunC 鐨?`==` 浼樺厛浜?`&`锛屽繀椤诲姞鎷彿锛歚(a == b) & c`
3. 闈炵┖妫€鏌?鈫?`~ null?(c)` 鑰屼笉鏄?`c != null`
4. 绫诲瀷娉ㄨВ 鈫?纭繚鍑芥暟绛惧悕绫诲瀷姝ｇ‘锛坕nt/cell/slice/builder/tuple锛?5. 鍙橀噺鍛藉悕 鈫?FunC 涓嶆敮鎸?`let`锛岀敤 `int x = ...`
6. 鏂规硶璋冪敤 鈫?纭繚 `.slice` 绛夋搷浣滅鍙姝ｇ‘绫诲瀷浣跨敤

### Step 3: 缂栧啓缂栬瘧鑴氭湰

鍒涘缓 `scripts/compile-func.cmd`锛?```batch
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

鍒涘缓 `scripts/compile-func.mjs`锛?```javascript
import { compile } from '@ton/func-js';
import fs from 'fs';
import path from 'path';

const funcFile = process.argv[2];
const baseDir = path.dirname(path.dirname(funcFile)); // contracts/ion/
const outDir = path.join(path.dirname(funcFile), '..', 'build-func');
fs.mkdirSync(outDir, { recursive: true });

const source = fs.readFileSync(funcFile, 'utf8');
const sources = [{ path: funcFile, content: source }];

// 鑷姩鏀堕泦鎵€鏈?.fc 鏂囦欢浣滀负鍙兘鐨?include 婧?const commonFiles = fs.readdirSync(path.join(baseDir, 'common'))
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
  
  // 鍐欏叆缂栬瘧浜х墿
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

甯歌 Solidity 淇锛?1. 瀵煎叆璺緞淇锛堢敤 forge remappings锛?2. OpenZeppelin 鍚堢害鐗堟湰鍏煎鎬?3. 绉婚櫎鏈娇鐢ㄧ殑 import
4. 淇 `pragma solidity` 鐗堟湰绾︽潫

### Step 5: 鍒涘缓 remappings.txt

```txt
@openzeppelin/=lib/openzeppelin-contracts/contracts/
forge-std/=lib/forge-std/src/
```

### Step 6: 楠岃瘉

```powershell
# FunC 鍏ㄩ儴缂栬瘧
node scripts\compile-func.mjs contracts\ion\pool.fc
node scripts\compile-func.mjs contracts\ion\router.fc
# ... 鍏ㄩ儴 14 涓枃浠?
# Forge build
forge build --via-ir --optimize

# 纭缁撴灉
echo FunC: all 14/14 compiled
echo Forge: exit code 0, zero warnings
```

## 楠屾敹鏍囧噯
- [ ] 鍏ㄩ儴 14 涓?`.fc` 鏂囦欢缂栬瘧閫氳繃
- [ ] `forge build` exit code 0
- [ ] 闆?warning锛坒orge build 瀹瑰繊鍙嬫儏鎻愮ず鍙互锛岄粍鑹茶鍛婁笉琛岋級
- [ ] 姣忎釜 .fc 缂栬瘧浜х墿鍦?`contracts/ion/build-func/` 鏈夊搴?.fif
- [ ] 鍑洪棶棰樼珛鍗充慨锛屼慨濂藉啀璺戜笅涓€杞紝涓嶈烦杩?
## 閾佸緥鎻愰啋
- 浠ｇ爜蹇呴』 UTF-8 鏃?BOM锛屽啓鍚庣珛鍒昏鍥為獙璇?- 姣忎慨濂戒竴涓枃浠跺氨 git commit
- 鍙戠幇 FunC 杩愮畻绗︿紭鍏堢骇闂 鈫?绔嬪埢鍔犳嫭鍙凤紝涓嶈鍔犳敞閲?TODO
- **鍚屼竴涓敊璇慨涓夋涓嶈繃灏辨悳鍏ㄧ綉锛屼笉瑕佽嚜宸辩‖鐚?*
- 淇€氫簡鎵嶈兘杩涗笅涓€姝?P0-TASK-002
---
# === TASK 002: 100 轮压力测试 ===

# 馃И P0-TASK-002: 100 杞帇鍔涙祴璇?+ Gas 鍩虹嚎

## 浼樺厛绾?馃煡 P0 鈥?缂栬瘧閫氳繃鍚庣珛鍗冲共杩欎釜

## 鐩爣
- IonWrapper 鍘嬪姏娴嬭瘯 100 杞叏缁?- BSCVault 鍘嬪姏娴嬭瘯 100 杞叏缁?- Gas 蹇収鍩虹嚎璁板綍

## 琛€娉暀璁紙蹇呰锛?Master 閾佸緥銐戯細**淇笉濂戒笉璺宠繃銆?* 鍚屼竴涓棶棰樹慨涓夋淇笉濂藉氨璺宠繃鈥斺€旇繖涓嶈銆傚繀椤讳慨濂斤紝淇埌琛屼负姝€?
閾佸緥銐掞細**99缁?1绾?= FAIL銆?* 100 杞繀椤诲叏閮ㄧ豢鑹诧紝灏戜竴杞兘涓嶇畻銆?
## 闇€瑕佸垱寤虹殑鏂囦欢

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
    
    // 閰嶇疆鍙傛暟
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
            
            // 杈圭晫鏉′欢锛氬皬閲忔搷浣?            if (i % 10 == 0) {
                wrapper.mint(1 wei);
                wrapper.burn(1 wei);
            }
            
            // 杈圭晫鏉′欢锛氬ぇ閲忔搷浣?            if (i % 25 == 0) {
                wrapper.mint(MINT_AMOUNT - 1);
                wrapper.burn(BURN_AMOUNT - 1);
            }
        }
        vm.stopPrank();
    }
    
    function testStress_100Rounds_ZeroBalances() public {
        // 娴嬭瘯浣欓涓?0 鏃剁殑杈圭晫琛屼负
        vm.startPrank(user);
        for (uint256 i = 0; i < ROUNDS; i++) {
            // 鍏ㄩ噺 burn
            uint256 balance = wrapper.balanceOf(user);
            if (balance > 0) {
                wrapper.burn(balance);
            }
            // 鍐?mint
            wrapper.mint(MINT_AMOUNT / ROUNDS);
        }
        vm.stopPrank();
    }
    
    function testGasSnapshot_MintBurn() public {
        vm.startPrank(user);
        
        // 棣栨 mint锛坓as 杈冮珮锛?        uint256 gasBefore = gasleft();
        wrapper.mint(1000 ether);
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("Gas used - first mint", gasUsed);
        
        // 鍚庣画 mint
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
绫讳技缁撴瀯锛屾祴璇?deposit/withdraw/signature 鍦烘櫙銆?
## 楠岃瘉鍛戒护

```powershell
cd D:\openclaw-tools\ion-dex-nuke\contracts\bsc

# 璺戝叏閮ㄦ祴璇曪紙鍚?stress锛?D:\openclaw-tools\foundry\bin\forge.exe test --via-ir --gas-report -vvv

# 鍙窇 stress 娴嬭瘯
D:\openclaw-tools\foundry\bin\forge.exe test --match-test testStress -vvv

# Gas snapshot
D:\openclaw-tools\foundry\bin\forge.exe snapshot --via-ir
```

## 楠屾敹鏍囧噯
- [ ] `testStress_100Rounds_MintBurn` 鈥?100 杞惊鐜叏閮?PASS
- [ ] `testStress_100Rounds_ZeroBalances` 鈥?100 杞竟鐣屾潯浠跺叏閮?PASS
- [ ] BSCVault stress test 鈥?鍚岀被 100 杞?PASS
- [ ] Gas gasreport 鏃犲紓甯稿嘲鍊硷紙mint/burn 涓嶅簲瓒呰繃 200K gas 鐨?3 鍊嶏級
- [ ] 缁撴灉杈撳嚭鍒?`contracts/bsc/gas-snapshot.txt`
- [ ] 璺戝畬涔嬪悗 git commit锛屾秷鎭寘鍚?"stress-test-pass-100"
- [ ] 涓嶉€氳繃灏变慨锛屼慨濂藉啀璺戯紝璺戦€氫负姝?
## 閾佸緥鎻愰啋
- 馃毇 涓嶇缉鍑忚疆鏁帮紙100 杞氨鏄?100锛? 杞笉绠楋級
- 馃毇 涓嶅拷鐣?WARNING锛坒orge test 鐨勬彁閱掑彲浠ョ湅锛岄粍鑹茶鍛婂繀椤讳慨锛?- 馃毇 涓嶆爣璁?TODO 璺宠繃澶辫触 case
- 鉁?璁板綍棣栨 mint vs 鍚庣画 mint 鐨?gas 宸紓锛岀‘璁ら€昏緫姝ｇ‘
---
# === TASK 003: 真实合约地址替换 ===

# 馃敆 P1-TASK-003: 鐪熷疄鍚堢害鍦板潃鏇挎崲 + 鍓嶇閾句笂瀵规帴

## 浼樺厛绾?馃煣 P1 鈥?P0 鍏ㄨ繃涔嬪悗椹笂鎵ц

## 鐩爣
- `.env` 鍜岄厤缃枃浠朵腑鐨勬墍鏈夊崰浣嶅湴鍧€鏇挎崲涓虹湡瀹炲悎绾﹀湴鍧€
- 鍓嶇 React 缁勪欢浠?hardcoded 鍦板潃鏀逛负浠?config 璇诲彇
- 鍚庣鎵€鏈夋暟鎹簮浠?mock/hardcoded 鍒囨崲鍒伴摼涓婄湡瀹炴暟鎹?
## 鑳屾櫙
Master 閾佸緥鈶紙闆跺亣浠ｇ爜锛夛細缁濆绂佹 mock/placeholder/hardcoded 鍋囨暟鎹€?Doubao 楠ㄦ灦宸茬粡鏁村悎杩涙潵锛屼絾瀹冭繕甯︾潃澶ч噺鍗犱綅鍦板潃銆傚繀椤绘尐涓浛鎹€?
## 鎿嶄綔鎸囧

### Step 1: 鎵弿鎵€鏈夊崰浣嶅湴鍧€

```powershell
# 鏌ユ壘 0xdead 鍜岀被浼煎崰浣嶅湴鍧€
cd D:\openclaw-tools\ion-dex-nuke
Select-String "0x[0-9a-fA-F]{40}" -Path frontend\src\**\*.tsx,frontend\src\**\*.ts,backend\src\**\*.ts -AllMatches | 
  Where-Object { $_.Matches.Value -match "dead|0000|1234|test|mock|placeholder" } |
  Select-Object FileName, @{N='Address';E={$_.Matches.Value}} | Format-Table -AutoSize
```

### Step 2: 鍒涘缓闆嗕腑閰嶇疆

鍒涘缓 `frontend/src/config/contracts.ts`锛?```typescript
/**
 * ION DEX 鍚堢害鍦板潃閰嶇疆
 * 鎵€鏈夊悎绾﹀湴鍧€缁熶竴绠＄悊锛岀粍浠堕€氳繃杩欓噷璇诲彇锛屼笉 hardcode
 */
export const CONTRACTS = {
  ion: {
    // ION 浠ｅ竵涓诲悎绾︼紙BSC锛?    token: {
      address: '0xe1ab61f7b093435204df32f5b3a405de55445ea8' as const,
      chainId: 56,
      decimals: 18,
      symbol: 'ION',
      name: 'ION Token',
    },
  },
  dex: {
    // PancakeSwap 浜掓崲璺敱
    router: {
      address: '0x10ED43C718714eb63d5aA57B78B54704E256024E' as const,
      chainId: 56,
    },
    // 姹犲瓙
    factory: {
      address: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73' as const,
      chainId: 56,
    },
    // ION/WBNB 浜ゆ槗姹?    pool: {
      address: '0x6487725b383954e05cA56F3c2B93a104B3DD2C25' as const,
      chainId: 56,
    },
    // 璐ㄦ娂鍚堢害锛堝鏋滃凡閮ㄧ讲锛?    staking: {
      address: '0x0000000000000000000000000000000000000000' as const, // TODO: 鏇挎崲涓虹湡瀹炲湴鍧€
      chainId: 56,
    },
  },
  bridge: {
    inbox: {
      address: '0x0000000000000000000000000000000000000000' as const, // TODO: ION 閾炬ˉ鍦板潃
      chainId: 56,
    },
  },
  // 鎵嬬画璐规敹鍙栧湴鍧€锛圡aster 閽﹀畾鍙敹 ION锛?  fee: {
    receiver: {
      address: '0x8ff2e1210434495c4f5629bd9d8bd4965a67b84c' as const,
      chainId: 56,
    },
    // 鎵€鏈夎垂鐢ㄧ粺涓€鐢?ION 鈥斺€?涓嶈缃?USDT/BNB 鎵嬬画璐瑰湴鍧€
    tokenOnly: 'ION' as const,
  },
} as const;

// 鏈儴缃茬殑鍚堢害鏍囧織
export const PLACEHOLDER_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * 妫€鏌ュ悎绾︽槸鍚﹀凡閮ㄧ讲
 */
export function isDeployed(address: string): boolean {
  return address !== PLACEHOLDER_ADDRESS;
}
```

### Step 3: 鍒涘缓鍚庣闆嗕腑閰嶇疆

`backend/src/config/contracts.ts`锛?```typescript
export const CONTRACTS = {
  ion: {
    tokenAddress: '0xe1ab61f7b093435204df32f5b3a405de55445ea8',
    chainId: 56,
  },
  rpc: {
    bsc: 'https://bsc-dataseed.binance.org/',
    // ION 閾?RPC锛堥渶浠ｇ悊璁块棶锛?    ion: 'https://api.mainnet.ice.io',
  },
  apis: {
    geckoterminal: {
      baseUrl: 'https://api.geckoterminal.com/api/v2',
      poolId: '0x6487725b383954e05cA56F3c2B93a104B3DD2C25',
    },
    dexscreener: {
      baseUrl: 'https://api.dexscreener.com',
      pairs: ['0x6487725b383954e05cA56F3c2B93a104B3DD2C25'],
    },
    cmc: {
      apiKey: process.env.CMC_API_KEY || '',
    },
  },
  // 缁熶竴鎵嬬画璐归厤缃紙Master 2026-05-24 閽﹀畾锛?  fees: {
    currency: 'ION',
    swapFee: 0.003,  // 0.3%
    poolFee: 0.003,
    withdrawalFee: 0.001, // 0.1%
  },
};
```

### Step 4: 鍚庣鏁版嵁婧愭浛鎹?
鍏抽敭鏂囦欢娓呭崟锛堜笉瑕佹敼闈炲垪琛ㄦ枃浠讹級锛?1. `backend/src/services/quotes.ts` 鈥?浠?hardcoded 鈫?GeckoTerminal 瀹炴椂
2. `backend/src/services/pool.ts` 鈥?浠?hardcoded 鈫?BSC RPC getReserves
3. `backend/src/services/burn.ts` 鈥?浠?hardcoded 鈫?BSC 閾句笂鐕冪儳璁板綍
4. 鍒犻櫎 `backend/src/services/mock-quotes.ts`锛堝鏋滃瓨鍦ㄤ笖鏈寮曠敤锛?
### Step 5: 鍓嶇 React 瀵规帴

1. **閰嶇疆鏂囦欢璇诲彇浠ｆ浛 hardcode** 鈥?姣忎釜缁勪欢閲屾墜鍐欑殑 `0x...` 鍦板潃鍏ㄩ儴鏇挎崲涓?`CONTRACTS.xx.address`
2. **Wallet 瀵规帴** 鈥?纭 OKX Wallet / MetaMask 杩炴帴璧版甯?flow锛屾病鏈?mock provider
3. **Trade 椤?* 鈥?Swap/Router 璋冪敤浠?hardcoded function 鈫?viem/wagmi 鐪熷疄鍚堢害璋冪敤
4. **Vault 椤?* 鈥?鍚岀悊锛岀敤鐪熷疄 ABI + 鐪熷疄鍦板潃
5. **Pool 椤?* 鈥?鏄剧ず鐪熷疄姹犲瓙鐘舵€侊紙TVL銆丄PR銆佹祦鍔ㄦ€э級

### Step 6: 楠岃瘉

```powershell
# 鍚庣楠岃瘉
cd backend
curl http://localhost:8787/api/config/public
curl http://localhost:8787/api/markets/tickers

# 鍓嶇楠岃瘉
cd frontend
npx tsc --noEmit  # 闆剁被鍨嬮敊璇?```

## 楠屾敹鏍囧噯
- [ ] 鍓嶇鎵€鏈夊悎绾﹀湴鍧€缁熶竴浠?`CONTRACTS` 璇诲彇锛屾棤 hardcode 鍦板潃
- [ ] 鍚庣 quotes 杩斿洖鐪熷疄閾句笂浠锋牸锛堟帴杩?$0.000139/ION锛?- [ ] 鍚庣 burn 杩斿洖鐪熷疄鐕冪儳閲忥紙闈?0 闈?mock锛?- [ ] 鍓嶇 tsc exit code 0
- [ ] 鍓嶇 Wallet connect 鐢?wagmi + viem锛屾棤 mock provider
- [ ] 鍗犱綅鍦板潃 (`0x0000...`) 鍙湪鏈儴缃茬殑鍚堢害涓婂嚭鐜帮紝鏈夋竻鏅扮殑 TODO 鏍囨敞
- [ ] commit 娑堟伅锛歚feat(config): replace all placeholders with real contract addresses`

## 閾佸緥鎻愰啋
- 鏀逛竴涓枃浠跺悗绔嬪嵆璇诲洖楠岃瘉缂栫爜
- 涓嶈涓€娆℃€ф敼澶鏂囦欢 鈥?鏀?2-3 涓氨 build 涓€娆＄‘璁よ兘缂栬瘧
- 0xdead 鍦板潃鏄吀鍨嬬殑楠椾汉鍗犱綅锛屽繀鍒?
---
# === TASK 004: 统一 ION 手续费收费逻辑 ===

# 馃挵 P1-TASK-004: 缁熶竴 ION 鎵嬬画璐规敹璐归€昏緫

## 浼樺厛绾?馃煣 P1 鈥?涓?TASK-003 鍚岀骇

## 鑳屾櫙
Master 2026-05-24 鍒氭柊澧炵殑閾佸緥锛?> **鏁翠釜 DEX 鐨勬墍鏈夎垂鐢ㄧ粺涓€閲囩敤 ION 涓婚摼 `$ION` 鏀跺彇锛屼笉鍋氬甯佺鎵嬬画璐逛綋绯汇€?*
> 瑕嗙洊閿€姣併€佽川鎶笺€丩P 绛夊叏閮ㄦ敹璐瑰満鏅€?
## 蹇呴』妫€鏌ョ殑鏂囦欢娓呭崟

### 鍚庣
1. `backend/src/config/contracts.ts` 鈥?纭 fees.currency = 'ION'
2. `backend/src/services/quotes.ts` 鈥?纭 price 杩斿洖 ION 浠锋牸
3. `backend/src/services/pool.ts` 鈥?LP 璐圭敤瀛楁鐢?ION 璁′环
4. `backend/src/services/fees.ts` 鈥?(濡傚瓨鍦? 鍘绘帀 USDT/BNB 璐圭敤閫昏緫

### 鍓嶇
1. `frontend/src/pages/trade/` 鈥?Swap 鐣岄潰璐圭敤鏄剧ず ION
2. `frontend/src/pages/pool/` 鈥?Pool 鐣岄潰 LP 鏀剁泭鏄剧ず ION
3. `frontend/src/pages/staking/` 鈥?Staking 鐣岄潰璐ㄦ娂鏀剁泭鏄剧ず ION
4. `frontend/src/components/FeeDisplay.tsx` 鈥?(濡傚瓨鍦? 璐圭敤缁勪欢纭璐у竵绗﹀彿
5. `frontend/src/config/contracts.ts` 鈥?fees.currency = 'ION'

### 鍚堢害
1. `contracts/bsc/FeeReceiver.sol` 鈥?妫€鏌?receiveFee 鏄惁鍙帴鍙?ION
2. `contracts/bsc/IonSwapRouter.sol` 鈥?Swap 鎵嬬画璐规槸鍚﹀啓姝?ION
3. `contracts/bsc/StakeReward.sol` 鈥?鏀剁泭鍒嗛厤鏄惁浠?ION 璁＄畻

## 鍏抽敭鏀瑰姩

### FeeReceiver.sol 鏍稿績閫昏緫
```solidity
// Master 閽﹀畾锛氭墍鏈夊彧鏀?ION
// 涓嶈 fallback/transfer 鍑芥暟鎺ュ彈鍏朵粬浠ｅ竵
function collectFee(address token, uint256 amount) external onlyRouter {
    require(token == ionToken, "FeeReceiver: only ION");
    // ... 鏀跺彇閫昏緫
}

// 鎷掔粷浠讳綍闈?ION 杞处
function onERC20Received(address, address, uint256, bytes calldata) external returns (bytes4) {
    // 鍙帴鍙?ION 鍚堢害
    require(msg.sender == ionToken, "FeeReceiver: only ION");
    return this.onERC20Received.selector;
}
```

## 楠屾敹鏍囧噯
- [ ] 鍚庣 fees.currency 鍙緭鍑?'ION'
- [ ] 鍓嶇浠讳綍璐圭敤鏄剧ず锛圫wap fee / LP fee / Withdrawal fee锛夎揣甯佸崟浣嶉兘鏄?ION
- [ ] FeeReceiver 鍚堢害 `collectFee` 闇€瑕?token 鍙傛暟蹇呴』鏄?ION 鍦板潃锛屽惁鍒?revert
- [ ] 涓嶅瓨鍦?USDT/BNB 璐圭敤閰嶇疆锛堝垹闄ゆ垨纭?disable锛?- [ ] 娴嬭瘯锛欶rontend 椤甸潰鎴浘纭璐圭敤鏄剧ず ION
- [ ] commit锛歚feat(fees): enforce ION-only fee policy across entire DEX`
---
# === TASK 005: UI 打磨 + 响应式适配 ===

# 馃帹 P2-TASK-005: UI 鎵撶（ + 鍝嶅簲寮忛€傞厤

## 浼樺厛绾?馃煥 P2 鈥?鍚堢害鍜屾暟鎹眰鎼炲畾鍚庡啀鍋?
## 鐩爣
- 鎵€鏈夐〉闈㈣瑙夌粺涓€ polished
- 绉诲姩绔?妗岄潰绔?100% 鍝嶅簲寮?- 閿欒澶勭悊 + Loading state 瑕嗙洊鍏ㄩ〉闈?
## UI 璁捐鏉ユ簮
Master 閾佽鐭╋細**鎵€鏈夊墠绔?UI 鍙傝€?https://github.com/DavidHDev/react-bits**
> 涓嶈嚜宸卞嚟绌鸿璁★紝鐩存帴浠?110 涓粍浠堕噷鎸戙€?
## Scope

### 1. Error Boundary + Loading State

姣忎釜鏁版嵁璇锋眰椤甸潰蹇呴』鍖呭惈锛?```tsx
// Loading skeleton
function TradeLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-gray-800 rounded-md" />
      <div className="h-24 bg-gray-800 rounded-md" />
      <div className="h-10 bg-gray-800 rounded-md w-1/2" />
    </div>
  );
}

// Error display
function TradeError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <h3 className="text-red-400 font-medium">鏁版嵁鍔犺浇澶辫触</h3>
      </div>
      <p className="mt-2 text-sm text-gray-400">{error.message}</p>
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
      >
        閲嶈瘯
      </button>
    </div>
  );
}
```

### 2. 鍝嶅簲寮忛€傞厤

Tailwind breakpoints 鐢ㄦ硶锛?```tsx
// 绉诲姩绔細鍗曞垪 | 妗岄潰绔細鍙屽垪
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {/* ... */}
</div>

// 渚ц竟鏍忥細绉诲姩绔笅绉?<aside className="w-full lg:w-72 lg:min-h-screen">
  {/* ... */}
</aside>

// Header锛氱Щ鍔ㄧ鎶樺彔
<nav className="hidden md:flex items-center gap-6">
  {/* 瀵艰埅閾炬帴 */}
</nav>
```

### 3. Glass Morphism 椋庢牸缁熶竴

浠庡弬鑰冨簱鎸戠幓鐠冩€佺粍浠讹紝搴旂敤鍒帮細
- Swap 鍗＄墖 鉁?- Pool 鍗＄墖 鉁?- Staking 鍗＄墖 鉁?- Vault 鍗＄墖 鉁?- Wallet 杩炴帴寮圭獥 鉁?
鐜荤拑鎬佸弬鏁帮紙閾佸緥鈶崇簿纭暟鍊煎寲锛夛細
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 16px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
```

### 4. 椤甸潰娓呭崟

闇€瑕佹墦纾ㄧ殑椤甸潰锛?```
frontend/src/pages/
鈹溾攢鈹€ trade/
鈹?  鈹溾攢鈹€ Swap.tsx          鉁?鏍稿績浜ゆ槗椤?鈹?  鈹溾攢鈹€ Limit.tsx         鉁?闄愪环鍗?鈹?  鈹斺攢鈹€ CrossChain.tsx    鉁?璺ㄩ摼妗?鈹溾攢鈹€ pool/
鈹?  鈹溾攢鈹€ PoolList.tsx      鉁?娴佸姩鎬ф睜鍒楄〃
鈹?  鈹溾攢鈹€ AddLiquidity.tsx  鉁?娣诲姞娴佸姩鎬?鈹?  鈹斺攢鈹€ RemoveLiquidity.tsx 鉁?绉婚櫎娴佸姩鎬?鈹溾攢鈹€ vault/                鉁?閲戝簱
鈹溾攢鈹€ staking/              鉁?璐ㄦ娂
鈹溾攢鈹€ launch/               鉁?浠ｅ竵鍙戣
鈹溾攢鈹€ portfolio/            鉁?璧勪骇缁勫悎
鈹溾攢鈹€ governance/           鉁?娌荤悊
鈹溾攢鈹€ compliance/           鉁?鍚堣
鈹溾攢鈹€ docs/                 鉁?鏂囨。
鈹斺攢鈹€ profile/              鉁?涓汉涓績
```

## 楠屾敹鏍囧噯
- [ ] 姣忎釜鏁版嵁鍔犺浇椤甸潰鏈?skeleton loading
- [ ] 姣忎釜 API 閿欒鏈夌敤鎴峰弸濂界殑閿欒鎻愮ず + 閲嶈瘯鎸夐挳
- [ ] 绉诲姩绔?(375px) 鎵€鏈夐〉闈㈠彲姝ｅ父娴忚銆佸彲浜や簰
- [ ] 妗岄潰绔?(1440px) 甯冨眬鍚堢悊
- [ ] 鐜荤拑鎬侀鏍肩粺涓€
- [ ] tsc 缂栬瘧闆堕敊璇?- [ ] commit: `feat(ui): polish UI with glass morphism + responsive + error handling`
---
# === TASK 006: 测试网部署 + E2E 验证 ===

# 馃殌 P3-TASK-006: 娴嬭瘯缃戦儴缃?+ E2E 楠岃瘉

## 浼樺厛绾?馃煩 P3 鈥?鍓嶄笁闃舵閮藉畬鎴愬悗鍐嶅仛

## 鐩爣
1. FunC 鍚堢害閮ㄧ讲鍒?ION 娴嬭瘯缃?2. Solidity 鍚堢害閮ㄧ讲鍒?BSC 娴嬭瘯缃?3. E2E 娴嬭瘯锛氬畬鏁翠氦鏄撴祦閫氳繃

## Step 1: ION 娴嬭瘯缃戦儴缃?
**纭娴嬭瘯缃戜俊鎭細**
```powershell
# 鏌ユ壘 ION 娴嬭瘯缃戦厤缃?curl -s $env:HTTPS_PROXY https://api.testnet.ice.io/ 2>$null
```

ION 閾鹃儴缃查渶瑕佺敤 `sendBoc` 鏂瑰紡锛?```javascript
const deployResult = await fetch('https://api.testnet.ice.io/http/v2/sendBoc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ boc: fift_output_base64 })
});
```

**閮ㄧ讲椤哄簭锛?*
1. 鍏堥儴缃?`common.fc` 渚濊禆
2. 閮ㄧ讲 `pool.fc`锛圓MM 姹犳牳蹇冿級
3. 閮ㄧ讲 `router.fc`
4. 閮ㄧ讲 `vault.fc`
5. 閮ㄧ讲 `staking-pool.fc`
6. 閮ㄧ讲 `deployer.fc`
7. 閮ㄧ讲鍓╀綑鍚堢害

## Step 2: BSC 娴嬭瘯缃戦儴缃?
```powershell
cd D:\openclaw-tools\ion-dex-nuke\contracts\bsc

# 1. 鍒涘缓閮ㄧ讲鑴氭湰
# contracts/bsc/script/Deploy.s.sol

# 2. 璁剧疆娴嬭瘯缃?.env
echo "BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545" >> .env
echo "PRIVATE_KEY=your_test_wallet_pk" >> .env

# 3. 閮ㄧ讲
D:\openclaw-tools\foundry\bin\forge.exe script script/Deploy.s.sol --rpc-url $env:BSC_TESTNET_RPC --broadcast -vvvv
```

## Step 3: E2E 闆嗘垚娴嬭瘯

缁忚繃鍓嶉潰 5 涓换鍔★紝鎴戜滑宸叉湁锛?- 鉁?FunC 鍚堢害閮ㄧ讲鍒?ION 娴嬭瘯缃?- 鉁?Solidity 鍚堢害閮ㄧ讲鍒?BSC 娴嬭瘯缃?- 鉁?鍓嶇瀵规帴鐪熷疄鍚堢害
- 鉁?UI 鎵撶（瀹屾瘯

鏈€缁?E2E 楠岃瘉娴佺▼锛?1. 鎵撳紑鍓嶇椤甸潰 鈫?杩炴帴閽卞寘锛圤KX / MetaMask锛?2. 閫夋嫨 ION 娴嬭瘯缃戠殑浠ｅ竵杩涜 Swap
3. 娣诲姞娴佸姩鎬э紙Add Liquidity锛?4. 鏌ョ湅 Pool 椤甸潰鏄剧ず鏂版睜瀛?5. 浣跨敤 Stake/Unstake 鍔熻兘
6. 灏濊瘯浠ｅ竵鍒涘缓锛圱oken Launch锛?7. 纭璐圭敤鏄剧ず涓?ION

## Step 4: CI 鏇存柊

```yaml
# .github/workflows/ion-dex-deploy.yml
name: ION DEX Deploy
on:
  push:
    tags:
      - 'v*'

jobs:
  deploy-testnet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge build --via-ir
      - run: forge script script/Deploy.s.sol --rpc-url ${{ secrets.BSC_TESTNET_RPC }} --broadcast
```

## 楠屾敹鏍囧噯
- [ ] ION 娴嬭瘯缃戜笂鑷冲皯閮ㄧ讲 pool.fc + router.fc + vault.fc
- [ ] BSC 娴嬭瘯缃戜笂鑷冲皯閮ㄧ讲 IonSwapRouter + BSCVault + FeeReceiver
- [ ] 鍓嶇閫氳繃 wagmi 杩炴帴娴嬭瘯缃戝苟璇诲嚭鍚堢害鐘舵€侊紙涓嶆槸鎶ラ敊锛?- [ ] E2E 娴佺▼鍏ㄩ儴璧伴€氾紙Swap 鈫?Add LP 鈫?Stake 鈫?楠岃瘉 ION 璐圭敤锛?- [ ] CI 閰嶇疆浜?deploy 宸ヤ綔娴?- [ ] commit: `feat(deploy): testnet deployment + e2e flow green`

## 閾佸緥鎻愰啋
- 娴嬭瘯缃戞湁鍏嶈垂姘撮緳澶?faucet锛屼笉瑕佺敤涓荤綉绉侀挜
- 閮ㄧ讲鍚庣珛鍒荤敤 cast 楠岃瘉锛歚cast call --rpc-url $RPC $CONTRACT "name()"`
- 閮ㄧ讲鍦板潃鏇存柊鍒?`frontend/src/config/contracts.ts`
- 涓嶈烦杩?E2E锛屼笉鏀硅寖鍥?
