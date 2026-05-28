# UI 差距分析 — Dashboard — Batch B — 2026-05-26

**设计图**：
- `.memory-bank/design-refs/screens/04-dashboard-galaxy-spiral.png`
- `.memory-bank/design-refs/screens/01-glass-panel-wave-border.png`

**实现截图**（流水线 `capture-ui-signoff-screenshots.mjs` 产出）：
- `docs/screenshots/ui-signoff/batch-b/dashboard-1440.png`
- `docs/screenshots/ui-signoff/batch-b/dashboard-768.png`
- `docs/screenshots/ui-signoff/batch-b/dashboard-375.png`

**对照方式**：1440 宽并排肉眼对比 + Playwright testId 功能门禁；无像素级 diff 工具。

| # | 维度 | 设计图要求 | 当前实现 | 等级 | 根因 | 修复计划 |
|---|------|------------|----------|------|------|----------|
| 1 | 玻璃舞台 | 厚霓虹波浪描边 + 内层极光雾 | `ChartStage` + `flow-border-hero` 已套 Market 区 | P1 | C | Batch A/B 已落地；1440 并排确认发光强度 |
| 2 | 色彩 | Master 青/紫/金三色 | `:root` token + Feature 五色 variant | P1 | A | 扫尾残留 hex → Batch C |
| 3 | 布局 | 三栏比例 + 底栏五钮等高 | `lg:grid-cols-[…]` + `gap-4 items-stretch auto-rows-fr` | P1 | D | 375 两列已测；tile 内 padding 可 P2 |
| 4 | 图标 | 3D/等距霓虹图标 | Lucide 扁平 + CSS 光晕 | P2 | F | 可选插画资产，不阻塞 Batch B |
| 5 | 文案 | 无工程味副标题 | 已移除「Modules」；数据源 `sr-only` | — | — | B2 完成 |
| 6 | 背景 | 星系/极光全局明显 | `AuroraGalaxyBackground` 开启 | P1 | E | K 线区内层对比已加强 |

**P0 计数**：0

**功能验收**：`scripts/verify-full-save-log.cmd --no-pause`

**压力验收**：`node scripts/stress-playwright-100.mjs --spec e2e/smoke.spec.ts --rounds 100`

**工程门禁**：`scripts/verify-100.ps1` → `PASSED=100 FAILED=0 RESULT=GREEN`

**改进计划**：
1. Batch C：Trade 图表 `ChartStage`；Swap 与 Dashboard 左栏 token 统一。
2. P2：五宫格 3D 图标资产。
3. 持续跑 `scripts/run-ui-design-phase-batch.cmd --batch B --commit-push --auto-next`。

**签收结论**：Batch B 代码可合并；视觉 1:1 迭代中（P1/P2 已登记），不声称像素级完成。
