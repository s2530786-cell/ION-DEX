# SESSION_STATE.md — Cursor TASK 0 必读

> 每次 Cursor 启动/恢复时，TASK 0 = 读取本文件 + architecture-audit.md（全量）。
> 不是读摘要，是读完整文件。读完才进入下一步。

---

## 当前进度（旺财 2026-05-21 07:58 更新）

- **Phase**: Phase 5 (编译验证 + 安全测试)
- **最后 Cursor commit**: f015109b (feat: LOGO + fix 2 TS bugs, 2026-05-21)
- **合约文件**: 14 FunC + 5 Solidity + 2 Test ✅ 磁盘验证通过
- **合约编译**: ⚠️ 未验证（FunC 编译器未运行, forge build 未执行）
- **安全测试**: 0/1000 次（16个攻击测试合约未编写）

## 🚨 Cursor 铁律 — 每天开工前背一遍

1. **零假代码** — mock/placeholder/TODO空壳/硬编码假数据 = 废品。发现即删除。
2. **不编造报告** — 任何报告数字必须有对应磁盘文件+运行日志支撑。
3. **写入即验证** — 写完文件立刻读回检查。CI 必须绿灯。
4. **安全第一** — 1000次全绿安全测试才算过。999绿+1红=FAIL。
5. **自主审查** — 自己审自己修，不等人工确认。
6. **中文不乱码** — UTF-8无BOM，写入后读回验证。

## 🔴 P0 任务队列（按顺序执行，旺财定）

| # | 任务 | 验证标准 |
|---|------|---------|
| 0.5 | 🐛 Bounty: Wormhole 智能合约审计 | 见下方 Bounty 专区 |
| 1 | Solidity 编译验证 | `forge build --contracts contracts/` exit 0 |
| 2 | 编写 16 个攻击测试合约 | 16个 .sol 文件存在，含完整攻击逻辑 |
| 3 | Foundry 测试框架搭建 | `forge test` 可运行 |
| 4 | 1000 次安全测试 (10类×100) | 每类 100 次全绿，总计 1000/1000 |
| 5 | 补充 Business 页面交互 (Trade/Grid/Burn/Domain/AI) | 每个页面有真实表单+交互，非标题壳 |
| 6 | 前端视觉纠正 | 多层玻璃态 + 响应式布局 |

## 💰 Bounty 专区 — Wormhole 审计（旺财 2026-05-21 17:00 派单）

> 详细任务书: `D:\openclaw-data\workspace\scripts\pipeline\queue\task-wormhole-001.json`

| 项目 | 值 |
|------|-----|
| 平台 | Immunefi |
| 目标 | Wormhole 跨链桥 |
| 语言 | Solidity |
| 赏金 | $2,000 - $10,000 USD |
| 仓库 | `https://github.com/wormhole-foundation/wormhole` |
| 截止 | 2026-05-28 |

### Step 1 — 克隆仓库
```powershell
cd D:\openclaw-data\workspace\repos
git clone https://github.com/wormhole-foundation/wormhole wormhole
cd wormhole
git log --oneline -20
```
**验证:** 确认 `ethereum/` 目录存在，内含 `.sol` 文件

### Step 2 — 读规则文档
必须读完并理解以下文件：
- `README.md` — 项目概述
- `SECURITY.md` — 安全政策 + out-of-scope
- `CONTRIBUTING.md` — 贡献规范
- 搜 `Immunefi` 在仓库里 — 找 Immunefi 项目页链接

输出：`CURSOR_AUDIT_LOG.md` 第一段，列出 scope / out-of-scope

### Step 3 — 建合约索引
遍历 `ethereum/` 下所有 `.sol` 文件，在 `CURSOR_AUDIT_LOG.md` 建表：
```
| 合约名 | 路径 | 行数 | 功能 | 外部调用 |
|--------|------|------|------|----------|
```
至少列出 5 个核心合约

### Step 4 — 10 类攻击面逐行审查
对每个核心合约，逐行查以下 10 类漏洞：

| # | 类型 | 搜什么 | 找到可拿 | 找不到 |
|---|------|--------|---------|--------|
| 1 | 重入 | `.call`, `.transfer`, `.send` 后改状态 | $10K+ | 标记 CLEAN |
| 2 | 闪电贷 | `getPrice`, `oracle`, `TWAP`, `reserve` | $10K+ | 标记 CLEAN |
| 3 | 签名伪造 | `ecrecover`, `signature`, `verify` | $10K+ | 标记 CLEAN |
| 4 | 权限绕过 | `onlyOwner`, `require.*msg.sender` | $5-10K | 标记 CLEAN |
| 5 | 整数溢出 | `unchecked`, `uint.*+`, `uint.*-` | $2-10K | 标记 CLEAN |
| 6 | DoS | `for.*\.\.`, `.push`, `loop` | $2-5K | 标记 CLEAN |
| 7 | 跨链重放 | `chainId`, `nonce`, `sequence`, `vaa` | $10K+ | 标记 CLEAN |
| 8 | 假币攻击 | `token.*address`, `erc20`, `IERC20` | $2-5K | 标记 CLEAN |
| 9 | 时间戳操控 | `block\.timestamp`, `block\.number` | $1-5K | 标记 CLEAN |
| 10 | 预言机操控 | `oracle`, `getPrice`, `spotPrice` | $5-10K | 标记 CLEAN |

**每类必须写在 CURSOR_AUDIT_LOG.md 里，就算没发现也要写 "CLEAN"。**

### Step 5 — 搭测试环境
```powershell
# 确保 Foundry 可用
$env:PATH += ";D:\openclaw-tools\foundry\bin"
forge --version

# 启动 BSC Fork
$env:HTTP_PROXY="http://127.0.0.1:7890"
$env:HTTPS_PROXY="http://127.0.0.1:7890"
anvil --fork-url https://bsc-dataseed.binance.org/ --port 8545 &

# 创建测试目录
mkdir -p D:\openclaw-data\workspace\repos\wormhole\test\audit

# 写 Foundry 测试
# 文件命名: test/audit/{合约名}_{攻击类型}Exploit.t.sol
# 每个测试文件跑 100 次循环
```

### Step 6 — 写 PoC（找到漏洞时）
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "forge-std/Test.sol";
import "../path/to/TargetContract.sol";

contract TargetReentrancyExploit is Test {
    TargetContract target;
    
    function setUp() public {
        // Fork BSC Mainnet
        vm.createSelectFork("bsc");
        target = TargetContract(0x...); // 真实地址
    }
    
    function testReentrancy() public {
        vm.startPrank(address(this));
        // 攻击逻辑
        vm.stopPrank();
    }
    
    // 100 次验证
    function testReentrancy100Times() public {
        for (uint i = 0; i < 100; i++) {
            testReentrancy();
        }
    }
}
```

**验证:** `forge test --match-path test/audit/ -vvv` 必须 100/100 全绿

### Step 7 — 写报告
每发现一个漏洞 → 一个报告文件

报告格式：
```markdown
# [漏洞类型] - [模块名] - [后果]

## 描述
（3-5句说明漏洞原理）

## 根因
合约 `Xxx.sol` 第 N 行：
`代码片段`
导致...

## 影响
- 损失: $X USD
- 合约: 0x...
- 链: BSC / Base / Ethereum

## PoC
（完整可运行代码）

## 修复建议
`diff - 原代码 + 修复后代码`
```

**输出目录:** `D:\openclaw-data\workspace\scripts\pipeline\reports\wormhole\`

### Step 8 — 最终检查
- [ ] 所有 PoC 100/100 全绿
- [ ] Forked Mainnet 真实数据，0 mock
- [ ] 报告含完整 PoC + 影响量化
- [ ] 未触 out-of-scope
- [ ] 没编造漏洞
- [ ] 没抄别人公开报告

### Step 9 — 通知我验收
创建 `D:\openclaw-data\workspace\scripts\pipeline\queue\done-wormhole-001.json`
内容: `{"id":"wormhole-001","completed":"ISO时间","findings":N,"reports":["文件路径"]}`

---
**⚠️ 禁止：**
- 编造漏洞（没找到就说没找到，诚实！）
- 写空 PoC（必须能跑）
- 直接提交 Immunefi（必须我 + Master 审批）
- 用 mock 数据替代真实链上数据

## 🟡 P1 任务队列

| # | 任务 |
|---|------|
| 7 | 7钱包真实连接器对接 |
| 8 | 前端六引擎数据层 |
| 9 | CI/CD Pipeline |
| 10 | Bridge 双重签名验证 |

## 关键依赖文件（TASK 0 必须全部读取）

| 优先级 | 文件 | 位置 | 说明 |
|--------|------|------|------|
| 🔴 P0 | `architecture-audit.md` | .memory-bank/ | **必读！** 旺财逐文件验证的审计报告 |
| 🔴 P0 | `wallet-connect-requirements.md` | .memory-bank/ | 7钱包真实对接要求 |
| 🔴 P0 | `live-data-reference.md` | .memory-bank/ | 6数据引擎配置 |
| 🟡 P1 | `glass-morphism-multilayer-spec.mdc` | .cursor/rules/ | 多层玻璃设计规范 |
| 🟡 P1 | `responsive-design-spec.mdc` | .cursor/rules/ | 响应式布局规范 |

## 工作区路径

- **本地仓库**: `D:\openclaw-tools\ion-dex-nuke`
- **GitHub**: `https://github.com/s2530786-cell/ION-DEX`
- **记忆库**: `D:\openclaw-tools\ion-dex-nuke\.memory-bank`
- **规则文件**: `.cursor/rules/` (项目规则)

---

_本文件于 2026-05-21 07:58 由旺财（管理者）更新。_
_旧版的 "28/28 全绿" "16/16 PASS" 均为 Cursor 编造数据，已清除。_
_当前所有进度数据均基于磁盘文件验证。_
