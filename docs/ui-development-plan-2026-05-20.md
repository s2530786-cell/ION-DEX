# ION DEX 前端 UI 开发计划（2026-05-20）

> 依据：`.memory-bank/overall-design-framework.md`、`docs/10-ui-design-route.md`、`docs/11-ui-visual-self-audit-gate.md`、`SESSION_STATE.md`  
> 分支：`cursor/ui-design-workflow-44c9`

---

## 1. 目标与铁律

| 类别 | 要求 |
|------|------|
| 视觉 | 4D/5D 液态玻璃、厚霓虹 rim、银河/极光背景、拒绝灰条/扁表格 |
| 数据 | 无空数据、无伪代码；loading/error 仅真实请求态 |
| 工程 | `verify-full` 绿灯；大功能后 `scripts/verify-100.sh` |
| 交付 | 每轮 UI 改动必须产出 `docs/ui-deliverable-self-audit-*.md` |
| 自动流 | `node scripts/agent-workflow.mjs --tier ui --execute` 或 `bash scripts/ui-round-verify.sh` |

**工程绿灯 ≠ 视觉门禁通过。**

---

## 2. 记忆库检索清单（每轮开工前）

1. `SESSION_STATE.md`
2. `.memory-bank/overall-design-framework.md`
3. `.memory-bank/architecture-audit.md`
4. `.memory-bank/live-data-reference.md`
5. `.memory-bank/implementation-playbook.md`
6. `docs/10-ui-design-route.md`
7. `docs/11-ui-visual-self-audit-gate.md`
8. 最近自检：`docs/ui-deliverable-self-audit-2026-05-22-p0.md`

---

## 3. 分轮路线图

### 轮次 A — P1 玻璃 HUD（本轮）

| 项 | 文件 | 状态 |
|----|------|------|
| 全局玻璃 token | `frontend/src/styles/global.css`（`glass-hud-panel` / `glass-hud-strip`） | 实施中 |
| AppShell 去灰条 | `AppShell.tsx` sidebar/header/nav/ticker | 实施中 |
| ProfileHub 玻璃壳 | `ProfileHub.tsx` → `NeonGlassCard` | 实施中 |
| Dashboard FeatureGrid | `NeonCard` → `NeonGlassCard` | 实施中 |
| UI 自动验证入口 | `scripts/ui-round-verify.sh`、`agent-workflow --tier ui` | 实施中 |

### 轮次 B — P0 数据面续（下一优先）

- Burn / Bridge / AI Desk 与 gateway 完全对齐（去 CSS 假图表）
- `market-surface` 与 Trade 深度/盘口 provenance 统一
- 参考：`docs/ui-deliverable-self-audit-2026-05-22-p0.md` 整改表

### 轮次 C — P1 视觉深化

- `BusinessPages` 内残余 `NeonCard` 批量换 `NeonGlassCard` / `GlassPanel`
- 全站 `flowBorder` hero 与 3D 图标资产
- `tests/visual/baseline/` 基线截图（P2）

### 轮次 D — 100-pass 门禁

- 功能批次合并 `main` 前：`bash scripts/verify-100.sh 100`
- 目标：`PASSED=100`、`RESULT=GREEN`

---

## 4. 自动工作流（Agent 必跑）

```bash
# 1) 记忆 + preflight
node scripts/dev-preflight.mjs

# 2) UI 专轮（preflight + verify-full）
bash scripts/ui-round-verify.sh
# 或
ION_VERIFY_NONINTERACTIVE=1 node scripts/agent-workflow.mjs --tier ui --execute

# 3) 写自检报告（模板 docs/templates/ui-visual-self-audit-TEMPLATE.md）
# 4) 更新 SESSION_STATE.md、docs/99-current-progress.md
```

---

## 5. 差距自检维度（每轮报告必填）

1. 背景层（银河/极光是否为主视觉）
2. 玻璃 rim（hero/feature 是否厚霓虹边）
3. 壳层（AppShell/Profile 是否仍像灰条工程 UI）
4. 数据（指标/K 线/盘口是否有 typed source + badge）
5. 断点（375 / 768 / 1440）
6. 工程 vs 视觉（两张表分开写）

---

## 6. 参考图与证据

- 参考图路径：`docs/ui-audit-screenshots/ref-*.png`（若目录为空，报告中注明「待用户补图」）
- 当前实现：Playwright `data-testid` + 可选录屏 `scripts/record-screen`（云环境）

---

## 7. 本轮完成定义（DoD）

- [ ] 轮次 A 四项代码落地
- [ ] `verify-full` 绿灯（证据贴入自检报告）
- [ ] `docs/ui-deliverable-self-audit-2026-05-20-p1-glass.md` 已提交
- [ ] `SESSION_STATE` / `99-current-progress` 已更新
- [ ] git commit + push + PR 更新（Cloud Agent）
