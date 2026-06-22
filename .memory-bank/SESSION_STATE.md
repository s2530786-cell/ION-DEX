# SESSION_STATE.md — Cursor TASK 0 必读

> 每次 Cursor 启动/恢复时，TASK 0 = 读取本文件 + `architecture-audit.md`（全量）+ 根目录 `SESSION_STATE.md`。
> **全自动执行队列**：`docs/cursor-autonomous-work-order-2026-05-25.md`（W0–W8，每阶段出口 verify-100 绿）。

---

## 当前进度

- **Phase**: 全自动工单 **W 系列**（记忆库缺口闭环）
- **CURRENT_PHASE**: **W1**（W0 已完成：文档同步 + verify-full 绿）
- **前端打包记忆**: `D:\openclaw-tools\ion-dex-nuke\.memory-bank\frontend-delivery-pack-2026-06-13.md`（前端已交付页面矩阵、UI 铁律、E2E 覆盖、恢复顺序）
- **已完成**: 旺财派工单 P1A–P3A + AI 订阅（2026-05-24/25）
- **合约编译**: 28/28 全绿 (FunC + Solidity)
- **CI 基线**: Playwright 31/31 · backend 43 · `verify-full` exit 0

## 关键依赖文件（TASK 0 必须全部读取）

| 优先级 | 文件 | 位置 | 说明 |
|--------|------|------|------|
| 🔴 P0 | `cursor-autonomous-work-order-2026-05-25.md` | docs/ | **当前**全自动派工单 W0–W8 |
| 🔴 P0 | `architecture-audit.md` | .memory-bank/ | 审计 + UI Pixel Protocol 未勾项 |
| 🔴 P0 | `frontend-delivery-pack-2026-06-13.md` | .memory-bank/ | 前端开发团队打包记忆：页面矩阵 / UI 铁律 / 恢复顺序 |
| 🔴 P0 | `wallet-connect-requirements.md` | .memory-bank/ | 7 钱包真实对接 |
| 🔴 P0 | `live-data-reference.md` | .memory-bank/ | 六引擎数据层 |
| 🟡 P1 | `official-source-index.md` | .memory-bank/ion-dex-nuke/ | 官方仓库索引 |
| 🟡 P1 | `security-audit-and-stress-framework.md` | .memory-bank/ | 安全/压测框架 |

## 铁律（每次工作前重温）

1. **零假代码** — mock/placeholder/TODO空壳/硬编码假链上数据 = 废品
2. **真链对接** — 不可用时 `warn not yet wired`，禁止伪造 txHash
3. **阶段出口** — 每阶段必须 `scripts/verify-100.ps1` → **RESULT=GREEN**
4. **自主执行** — 不等待人工逐步确认；仅缺密钥/歧义时暂停
5. **中文不乱码** — UTF-8 无 BOM

## 待办（已并入 W 系列 — 勿与 2026-05-24 产品页重复）

| W 阶段 | 原记忆库待办 |
|--------|----------------|
| W1 | 六引擎数据层 |
| W2 | 7 钱包真实对接 |
| W3 | UI Pixel Correction |
| W4–W5 | 链上接线 + Indexer |
| W6 | Sandwich / Bridge 功能测 |
| W7 | CI/CD Pipeline |
| W7-SKIP | swap.ion IPFS（需 Pinata JWT） |
| Phase 2+ | WalletConnect / ION Browser / Online+（预留） |

## 工作区路径

- **本地仓库**: `D:\openclaw-tools\ion-dex-nuke`
- **记忆库**: `D:\openclaw-tools\ion-dex-nuke\.memory-bank`
- **门禁**: `node scripts/autonomous-phase-gate.mjs --gate verify-full|verify-100`
