# UI 交付自检 — P0 市场面（lightweight-charts + API）

**日期**：2026-05-22  
**范围**：P0 第一步 — Dashboard / Trade 真实 K 线、盘口/深度/流动性 API、provenance  
**分支**：`cursor/ui-design-workflow-44c9`  
**工程验证**：`ION_VERIFY_NONINTERACTIVE=1 bash scripts/verify-full.sh` — **通过**（backend 15 tests、frontend 16 Playwright、audit high 0）

---

# 第一部分：思考过程

## A1. 任务理解

用户要求从 **P0** 开始，做完后必须对照设计图自检、列差距、制定改进计划并逐步推进。本轮聚焦审计报告 P0 前三项中的 **市场面**：

1. 接入 `lightweight-charts`（替代 CSS 假 K 线）
2. 去掉前端硬编码盘口/深度/TVL，改走后端 typed API + provenance
3. Burn/Bridge/AI 真实 API — **留待 P0 第二步**（本轮未改业务页图表数据源）

## A2. 实施策略

| 决策 | 理由 |
|------|------|
| 后端新增 `market-surface` 服务 | 单一真相源；meta + `provenance` 字段满足数据铁律 |
| 种子数据锚定 `getMarketTickers()` | 与 ticker strip 同源，避免前端各自编造 |
| 前端 `IonCandleChart` + hooks | 复用 Dashboard/Trade，E2E 用 `data-chart-ready` |
| 保留 `local-seed` 但 UI 明示 | `DataProvenanceBadge` 显示 model，不再裸硬编码 |

## A3. 对照参考图（仍存在的视觉差距）

参考图仍在 `docs/ui-audit-screenshots/ref-*.png`。本轮 **数据与图表类型** 对齐工程路线，**厚霓虹/异形玻璃/3D 图标** 仍未达成品。

## A4. 工程 vs 视觉

| 维度 | 结论 |
|------|------|
| 工程验证 | **通过** |
| P0 市场面子项 | **基本完成**（图表库 + API 边界） |
| 整体视觉门禁 | **仍未通过**（见 B2） |

---

# 第二部分：自检结论

## B1. 结论摘要

P0 市场面已落地：`lightweight-charts` 蜡烛图、四套 market API、全页 provenance 徽章；**视觉成品门禁仍失败**，下一步 P1 玻璃统一 + P0 续 Burn/Bridge/AI API。

## B2. 本轮已关闭的差距

| 原差距 | 现状态 |
|--------|--------|
| CSS 42/48 根假柱 | `IonCandleChart` + `/api/markets/candles` |
| Dashboard 硬编码 `depthRows` / `orderBook` | `useMarketDepth` / `useMarketOrderBook` |
| 静态 TVL / price impact | `useSwapMarketStats` |
| Trade 硬编码 `tradeCandles` / `tradeOrderBook` / `tradeStats` | 同上 hooks |
| 无数据来源展示 | `DataProvenanceBadge` |

## B3. 仍与设计图的差距（按优先级）

### P0 续（下一迭代）

| 项 | 说明 |
|----|------|
| Burn/Bridge/AI 图表与指标 | 仍为 CSS 柱或 local-seed 标题，需接 indexer/API |
| CMC/indexer 真实 OHLC | 当前 `ticker-anchored-synthetic-ohlc`，须在 provenance 升级到 upstream |

### P1（视觉）

| 项 | 说明 |
|----|------|
| 厚霓虹 / 异形 hero | `flowBorder` 未全站默认 |
| ProfileHub 玻璃化 | 未改 |
| NeonCard 外壳 | Grid/Pool/Burn 等仍混用 |
| 3D 功能图标 | 仍为 Lucide |
| 顶栏灰条 pill | AppShell 未玻璃化 |

### P2

| 项 | 说明 |
|----|------|
| `tests/visual/baseline/` | 未建 |
| `lightweight-charts` 路由级 code-split | bundle >500k 警告 |

## B4. 改进计划（逐步推进）

```text
Step 1 ✅ P0 市场面：charts API + Dashboard/Trade 接线（本 commit）
Step 2 ⏳ P0 续：Burn / Bridge / AI 后端 feed + 去 CSS 图表
Step 3 ⏳ P1：ProfileHub 玻璃 + 退役 NeonCard + hero flowBorder 默认
Step 4 ⏳ P1：顶栏 HUD 玻璃 + 3D 图标资产
Step 5 ⏳ P2：visual baseline 375/768/1440 + chart lazy-load
Step 6 ⏳ 100-pass verify 门禁（P0 续 + P1 批次后）
```

## B5. 附件与代码锚点

| 类型 | 路径 |
|------|------|
| 后端 | `backend/src/services/market-surface.ts` |
| 路由 | `/api/markets/candles|depth|orderbook|swap-stats` |
| 图表组件 | `frontend/src/components/charts/IonCandleChart.tsx` |
| Hooks | `frontend/src/hooks/useMarketSurface.ts` |
| 参考图 | `docs/ui-audit-screenshots/ref-*.png` |

## B6. 签收（下轮 PR）

- [x] Dashboard/Trade 使用 lightweight-charts
- [x] 无前端硬编码盘口/深度/TVL（Swap/Trade 主路径）
- [x] provenance UI 可见
- [ ] Burn/Bridge/AI 真实 API
- [ ] 视觉 baseline 目录
- [ ] 视觉门禁通过（厚霓虹/异形/3D）

---

*铁律模板：`docs/templates/ui-visual-self-audit-TEMPLATE.md`*
