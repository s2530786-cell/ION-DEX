# SESSION_STATE.md — Cursor TASK 0 必读

> 每次 Cursor 启动/恢复时，TASK 0 = 读取本文件 + architecture-audit.md（全量）。
> 不是读摘要，是读完整文件。读完才进入下一步。

---

## 当前进度

- **Phase**: Phase 5 (全面审计 + 漏洞修复)
- **Step**: Step 7 → CI/CD 自动化基础设施
- **最后 commit**: 26b6613 (旺财, 2026-05-19)
- **合约编译**: 28/28 全绿 (FunC + Solidity)
- **安全测试**: 16/16 PASS

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

## 待办（按优先级）

1. 🔴🔴🔴 **UI多层玻璃重构** — Master钦定 2026-05-21，读 glass-morphism-multilayer-spec.mdc
   - 每个组件独立多层玻璃堆叠（5-7层），不能靠外层卡片罩着
   - 重构顺序: NeonButton → NeonGlassCard增强 → 新建GlassPanel → GlassInput → GlassTab
2. 🔴 **7钱包真实对接** — 参考 wallet-connect-requirements.md
3. 🔴 **前端六引擎数据层** — 参考 live-data-reference.md
4. 🔴 **BSC Solidity合约** — 4个缺失合约从零编写
5. 🟡 **Sandwich防御验证** — 合约需重写+功能测试
6. 🟡 **CI/CD Pipeline** — Phase 5 Step 7
7. 🟢 **Bridge双重签名验证** — 合约需重写+功能测试
8. 🟢 **swap.ion IPFS部署** — 等Pinata JWT

## 工作区路径

- **本地仓库**: `D:\openclaw-tools\ion-dex-nuke`
- **GitHub**: `https://github.com/s2530786-cell/ION-DEX` (gh-pages分支)
- **记忆库**: `D:\openclaw-tools\ion-dex-nuke\.memory-bank`
- **规则文件**: `.cursor/rules/` (项目规则)
