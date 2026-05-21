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

## 💰 BOUNTY TASK — Wormhole Audit

```js
// TASK 0.5 — 旺财派单 2026-05-21
// 直接跑这个脚本:
// node D:\openclaw-data\workspace\scripts\wormhole-audit.mjs
// 可选参数: clone | rules | index | scan | setup | report | check | done | all

const task = {
  id: "wormhole-001",
  platform: "immunefi",
  target: "Wormhole Cross-Chain Bridge",
  language: "Solidity",
  reward: "$2,000-$10,000",
  deadline: "2026-05-28",
  repo: "https://github.com/wormhole-foundation/wormhole",
  script: "D:\\openclaw-data\\workspace\\scripts\\wormhole-audit.mjs",
  queue: "D:\\openclaw-data\\workspace\\scripts\\pipeline\\queue\\task-wormhole-001.json",
  output: "D:\\openclaw-data\\workspace\\scripts\\pipeline\\reports\\wormhole\\",
  done: "D:\\openclaw-data\\workspace\\scripts\\pipeline\\queue\\done-wormhole-001.json",
  rules: [
    "NO_FAKE_CODE — 所有 PoC 真实链上验证",
    "WRITE_VERIFY — 写完立刻 forge test",
    "SECURITY_FIRST — 1000 次全绿",
    "NO_DIRECT_SUBMIT — 等我+Master审批",
  ]
};
```

`node D:\openclaw-data\workspace\scripts\wormhole-audit.mjs clone`

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
