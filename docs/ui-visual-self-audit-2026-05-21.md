# ION DEX UI 视觉自检报告

> **完整交付版（含思考过程）**：`docs/ui-deliverable-self-audit-2026-05-21.md`  
> **铁律与模板**：`docs/11-ui-visual-self-audit-gate.md`、`docs/templates/ui-visual-self-audit-TEMPLATE.md`

**日期**：2026-05-21  
**分支**：`cursor/ui-design-workflow-44c9`  
**对照依据**：用户提供的成品参考截图（`/tmp/computer-use/*.webp`，已转 PNG 至 `docs/ui-audit-screenshots/ref-*.png`）、`docs/10-ui-design-route.md`、`.memory-bank/architecture-audit.md`、当前代码与本地 dev（`http://127.0.0.1:3001/`）

**结论摘要**：自动化验证（build / Playwright / audit:high）可通过，但**视觉设计门禁未通过**。当前实现处于「工程可用 + 局部玻璃化」阶段，与 OKX Web3 级 4D 液态玻璃成品仍有系统性差距。

---

## 1. 评估方法

| 维度 | 做法 |
|------|------|
| 参考标准 | 成品图：厚霓虹边框、银河主导背景、异形玻璃英雄卡、3D 功能图标、专业交易密度 |
| 当前实机 | 代码审计 + 参考图视觉对比（Dashboard / Trade / Pool / Bridge 等模块形态） |
| 工程证据 | `GlassPanel` / `flowBorder` 已落地 Dashboard、Trade；`lightweight-charts` **未接入** |
| 数据合规 | 多处 `local-seed`、硬编码盘口/深度/K 线示意 |
| 回归基线 | `tests/visual/baseline/` **不存在**（违反 `docs/00-engineering-standards.md`） |

---

## 2. 总体差距矩阵

| 类别 | 成品参考 | 当前实现 | 差距等级 |
|------|----------|----------|----------|
| 银河/极光背景 | 主导视觉层，星场+星云清晰 | `AuroraGalaxyBackground` Canvas 240 粒子 + CSS `aurora-noise` | **中** — 有动效但层次感弱于参考 |
| 4D 液态玻璃 | 不规则轮廓、强高光、厚霓虹外 rim | `glass-surface` + 可选 `flowBorder`；多为圆角矩形 | **高** |
| 厚霓虹边框 | 青/品红/紫流动光边为主视觉 | 仅部分 `flowBorder` 模块；默认 1px `border-white/10` | **高** |
| 3D 图标/卡片 | 功能卡内立体图标、悬浮景深 | Lucide 扁平图标 + 轻量 `float-3d` 仅 K 线区 | **高** |
| K 线/行情图 | 真实蜡烛图、深度分层 | `Array.from` 生成 CSS 圆角柱（Dashboard 42 根、Trade 48 根） | **严重** |
| 交易布局密度 | 1440 专业多栏（图+簿+表单+成交） | Trade 已有模块划分，盘口/成交仍为简表 | **中** |
| 数据可信度 | 带来源/时间戳/陈旧标记 | Swap 报价可走 API；深度/盘口/TVL 等多处静态 | **严重** |
| 组件语言统一 | 全站玻璃对象语言 | `GlassPanel` 与 `NeonCard` 混用 | **中** |
| Profile / 壳层 | 与主站同等级玻璃模态 | `ProfileHub` 普通 `border` 面板；顶栏灰条 pill 导航 | **中** |
| 视觉回归 | 每页×断点 baseline | 无目录、无 Playwright visual | **严重** |

---

## 3. 分模块差距

### 3.1 全局壳层（AppShell）

**现状**

- 顶栏：`rounded-full border border-white/10 bg-white/[0.04]` 水平滚动 pill — 接近「灰条分段控件」审美风险（architecture-audit 已标为设计失败模式）。
- 背景：`AuroraGalaxyBackground` 在内容下层，易被不透明面板遮挡，银河存在感弱于参考。

**与成品差距**

- 参考导航/顶栏多为发光玻璃条或悬浮 HUD，而非扁平灰底 pill。
- 缺少全站统一的「厚霓虹顶栏」或品牌发光分隔。

**优先级**：P1

---

### 3.2 Dashboard（swap.ion / `DashboardPage`）

**已改进**

- `SwapPanel` / `MarketStage` / `RightStats` / 功能格使用 `GlassPanel`、`ChartFrame`、`MetricTile`。
- 功能卡部分启用 `flowBorder`。

**仍差距**

| 项 | 说明 |
|----|------|
| K 线 | `MarketStage` 内 42 根 CSS 柱，非 `lightweight-charts`（`docs/10-ui-design-route` §2 明确要求） |
| 深度数据 | `depthRows`、`orderBook` 硬编码常量，无 provenance |
| TVL/保护指标 | `$1,234,567`、`0.24%` 等静态文案 |
| 异形玻璃 | 功能卡为统一圆角矩形，无参考图中的不规则/软变形英雄轮廓 |
| 3D 图标 | `lucide-react` 线性图标，非 3D 资产 |

**优先级**：P0（K 线 + 数据）、P1（异形/3D）

---

### 3.3 Trade（`TradeDeskPage`）

**已改进**

- `PageHero`、`ChartFrame`、`GlassPanel` 覆盖限价单、盘口、成交、风控；E2E `data-testid` 齐全。

**仍差距**

| 项 | 说明 |
|----|------|
| K 线 | `tradeCandles` 本地生成高度/色调，示意柱图 |
| 盘口/成交 | 表格行为 `bg-white/[0.04]` 行，偏工程列表 |
| 响应式 | 代码有三栏布局倾向，缺 375/768/1440 像素 baseline 证据 |
| TWAP/限价 | 模块存在，交互与签名流需与钱包/API 继续对齐 |

**优先级**：P0（图表）、P1（盘口视觉密度）

---

### 3.4 Grid / Pool / Stake / Bridge / Burn / Domain / AI

**共性**

- 各 `*DeskPage` 已有 `PageHero` + 部分 `GlassPanel`。
- **仍大量嵌套 `NeonCard`**（Grid 模板、Pool 侧栏、Burn/Domain 辅助块），与 Dashboard/Trade 玻璃语言不一致。
- 标题/副标题显式 `local-seed`：如 `ION liquidity pools · local-seed`、`accuracy 71% (local-seed)`、`dns.ice.io seed`。
- Bridge 配置 metrics 含 `Status: Design` — 产品未完成信号外露。

**与成品差距**

- 参考 Pool/Bridge/Burn 为**独立发光玻璃物体**（厚边+内发光图标），当前多为标准卡片+表格。
- Burn/Bridge/AI 图表区仍为 `ChartFrame` + CSS 柱/条，非趋势 API 驱动。

**优先级**：P1（统一 Glass + 去 NeonCard 外壳）、P0（Burn/Bridge/AI 真实 API）

---

### 3.5 ProfileHub

**现状**

- 功能完整：钱包扫描、头像、ION ID、KYC、TonConnect 等。
- 视觉：`rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.06]` — **未使用** `GlassPanel` / `flowBorder` / `glass-surface`。

**与成品差距**

- 参考钱包/个人中心为全屏或侧栏玻璃模态，与主站霓虹语言一致；当前偏表单抽屉。

**优先级**：P1

---

### 3.6 共享 primitive

| Primitive | 状态 | 缺口 |
|-----------|------|------|
| `glass-surface` | 有 blur/渐变 | 缺不规则 clip-path / 多层折射模拟 |
| `flow-border` | 动画渐变 rim | 未默认用于所有 hero/feature |
| `GlassPanel` | 默认细边 | `flowBorder` 需显式开启 |
| `NeonCard` | 旧体系仍广泛使用 | 应逐步退役或合并进 Glass |
| `lightweight-charts` | 未安装/未引用 | 设计路线硬性要求 |

---

## 4. 数据与合规红线（与视觉并列）

依据 `.memory-bank/architecture-audit.md` 与用户铁律：

1. **禁止**用 CSS 假 K 线冒充「专业交易图」— 须在 UI 标注 seed 或接真实 feed。
2. **禁止**无 provenance 的盘口/深度/TVL — Dashboard `orderBook` / `depthRows` 当前违规。
3. **允许** reviewed local-seed，但须 UI 可见来源标签（部分页面已标，Dashboard 主舞台未标）。
4. Swap 报价 `fetchTradeQuote` 为正向范例，应扩展到 Trade ticker、Burn、Bridge。

---

## 5. 工程验证 vs 设计验证

| 检查项 | 状态 |
|--------|------|
| UTF-8 / encoding | 通过（近期 verify-full 绿） |
| `npm run verify` / Playwright 16 | 通过 |
| `audit:high` | 通过 |
| `ION_UI_STRICT=1` preflight | 需持续开启防 unfinished copy |
| 视觉 baseline `tests/visual/baseline/` | **未建立** |
| 375 / 768 / 1440 截图存档 | **无系统化存档** |
| 浏览器 walkthrough 录屏 | 有 `ion_dex_current_ui_audit.mp4`（artifacts） |

**判定**：工程 CI 绿灯 ≠ UI 设计验收通过。

---

## 6. 优先级整改路线（建议顺序）

### P0 — 阻断「成品」宣称

1. Dashboard / Trade 接入 `lightweight-charts`（或带 provenance 的 seed adapter + 明确标签）。
2. 移除或标注所有硬编码盘口/深度；接 market API 或 typed seed 层。
3. Burn / Bridge / AI 接 memory-bank 指定数据源，去掉裸露 `Design` / 无来源数值。

### P1 — 视觉语言对齐参考

4. ProfileHub 全面 `GlassPanel` + `flowBorder` 模态壳。
5. 业务页去除外层 `NeonCard`，统一 glass primitive；hero 卡启用异形轮廓（clip-path / 多层 shadow）。
6. AppShell 顶栏玻璃化，减弱灰条 pill 观感。
7. 功能卡 3D 图标资产（PNG/SVG 立体）替换关键入口 Lucide。

### P2 — 工程化验收

8. 建立 `tests/visual/baseline/` + Playwright `toHaveScreenshot`（375/768/1440 × 核心 8 页）。
9. 强化银河层 z-index/透明度，避免被面板完全盖住。
10. 100-pass verify 门禁在 P0/P1 批次完成后执行。

---

## 7. 附件索引

| 文件 | 说明 |
|------|------|
| `docs/ui-audit-screenshots/ref-074a2.png` | 参考：Dashboard / Swap 成品风格 |
| `docs/ui-audit-screenshots/ref-6b487.png` | 参考：Trade / 专业盘面 |
| `docs/ui-audit-screenshots/ref-fe840.png` | 参考：功能模块玻璃卡 |
| `docs/ui-audit-screenshots/ref-5c073.png` | 参考：补充模块构图 |
| `/opt/cursor/artifacts/ion_dex_current_ui_audit.mp4` | 当前实现浏览录屏 |

---

## 8. 签收标准（下次 UI PR 必须满足）

- [ ] 受影响页面在 375 / 768 / 1440 有 baseline 或录屏对比说明  
- [ ] 无新增硬编码行情/盘口冒充生产数据  
- [ ] Hero / feature 模块默认 `flowBorder` 或等价厚霓虹  
- [ ] 主图区域为真实 chart 库或明确 seed adapter  
- [ ] 无用户可见 `Design` / `local-seed` 裸标签（改为规范 provenance 组件）  
- [ ] `docs/99-current-progress.md` + `SESSION_STATE.md` 已更新  

---

*本报告为视觉门禁文档，不替代功能测试；功能绿灯记录见近期 `verify-full` 与 commit `b9b7c56`。*
