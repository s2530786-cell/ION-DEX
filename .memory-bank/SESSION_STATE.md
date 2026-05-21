# SESSION_STATE.md — Cursor TASK 0 必读

> 每次 Cursor 启动/恢复时，TASK 0 = 读取本文件 + architecture-audit.md（全量）。
> 不是读摘要，是读完整文件。读完才进入下一步。

---

## 当前进度

- **Phase**: Phase 5 (全面审计 + 漏洞修复)
- **Step**: Step 7 → UI 实现 + 安全基建
- **最后 commit**: 45d7bbf4 (旺财验证, 2026-05-21 08:08)
- **合约编译**: ⚠️ 14 FunC + 5 Solidity 文件到位，待编译验证
- **安全测试**: ❌ 0/1000 — 攻击测试合约 0/16 未写

## 关键依赖文件（TASK 0 必须全部读取）

| 优先级 | 文件 | 位置 | 说明 |
|--------|------|------|------|
| 🔴 P0 | `architecture-audit.md` | .memory-bank/ | 全量审计报告，533行，所有已知漏洞和修复状态 |
| 🔴 P0 | `wallet-connect-requirements.md` | .memory-bank/ | 7钱包真实对接要求，Master钦定 |
| 🔴 P0 | `live-data-reference.md` | .memory-bank/ | 6数据引擎配置，前端不直调外部API |
| 🔴 P0 | `strategy-borrow-liquidity.md` | .memory-bank/ | 借鸡生蛋策略，BSC PancakeSwap做ION入口 |
| 🟡 P1 | `official-source-index.md` | .memory-bank/ion-dex-nuke/ | ION官方仓库参考代码索引 |
| 🟡 P1 | `tool-belt.md` | .memory-bank/ | 可用工具和库清单 |
| 🟡 P1 | `tool-belt-may20.md` | .memory-bank/ | 2026-05-20新增22个仓库 |
| 🟡 P1 | `12-factor-agents.md` | .memory-bank/ | 12-Factor Agent开发规范 |
| 🟢 P2 | `ion-whitepaper.md` | .memory-bank/ | ION白皮书摘要 |

## 铁律（每次工作前重温）

1. **零假代码** — mock/placeholder/TODO空壳/硬编码假数据 = 废品
2. **真链对接** — 每个接口对接真实链上数据
3. **安全第一** — 1000次全绿安全测试才算过
4. **自主审查** — 不需要人工确认，自己审自己修
5. **中文不乱码** — UTF-8无BOM，写入后读回验证
6. **🚨 禁止 spec-only commit** — 规范文档(.mdc)已写够，只读不写新的。每个 commit 必须包含可运行的代码变更（.tsx/.ts/.fc/.sol/.css等），不准只提交 .mdc 文档。
7. **🚨 写代码，不是写文档** — glass-morphism-multilayer-spec.mdc 和 responsive-design-spec.mdc 已经存在，读它们然后实现代码。不要再创建新的设计规范文件。

## 待办（按优先级 — 旺财 2026-05-21 08:13 重排）

### 🥇 当前 Sprint: UI 实现（只写代码，不写文档！）

1. 🔴🔴🔴 **UI多层玻璃重构** — 读 glass-morphism-multilayer-spec.mdc，**直接写组件代码**
   - 重构顺序: NeonButton.tsx → NeonGlassCard.tsx增强 → 新建GlassPanel.tsx → GlassInput.tsx → GlassTab.tsx
   - ⚠️ 规范已存在，不允许再创建 .mdc 规范文件
   - ⚠️ 每个 commit 必须有 .tsx/.css 变更，不能只有 .mdc
   - ⚠️ 做完一个组件 commit 一个，保持 commit 小而明确
   
2. 🔴🔴 **全设备响应式布局** — 读 responsive-design-spec.mdc，**直接改 CSS/TSX**
   - 修改 tailwind.config.js + global.css + AppShell.tsx + 各页面
   - 断点: 375/768/1024/1440 | Safari safe-area | 触摸优化
   - ⚠️ 规范已存在，不允许再创建响应式规范文件

### 🥈 下一 Sprint: 合约验证 + 安全基建（UI 做完立刻切）

3. 🔴 **FunC 编译验证 (14个)** — `func -PA -o contracts/ion/*.fc`
4. 🔴 **Solidity 编译验证 (5个)** — `forge build --root contracts/`
5. 🔴 **编写 16 个攻击测试合约** — contracts/test/attack/ 目录
6. 🔴 **1000 次安全测试** (10类×100次) — forge test
7. 🔴 **补充 5 个空壳页面** (Trade/Grid/Burn/Domain/AI) — 真交互，非假数据

### 🥉 长期

8. 🔴 **7钱包真实对接** — wallet-connect-requirements.md
9. 🔴 **前端六引擎数据层** — live-data-reference.md
10. 🟡 **CI/CD Pipeline**
11. 🟡 **swap.ion IPFS部署**

## 工作区路径

- **本地仓库**: `D:\openclaw-tools\ion-dex-nuke`
- **GitHub**: `https://github.com/s2530786-cell/ION-DEX` (gh-pages分支)
- **记忆库**: `D:\openclaw-tools\ion-dex-nuke\.memory-bank`
- **规则文件**: `.cursor/rules/` (项目规则)
