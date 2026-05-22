# ION DEX UI 差异报告与下一步计划

**日期**：2026-05-22  
**对照物**：`docs/ui-audit-screenshots/ref-074a2.png`（主 Dashboard/Swap 参考）、`ref-6b487.png` / `ref-fe840.png` / `ref-5c073.png`（壳层与其它页）、`.memory-bank/overall-design-framework.md`、`docs/10-ui-design-route.md`  
**当前证据**：用户实机截图（约 375px 窄屏）、仓库截图 `docs/ui-audit-screenshots/current-dashboard.png`（1440×900 自动化截图）、分支 `cursor/ui-design-workflow-44c9`  
**视觉门禁结论**：**未通过**（工程 verify 可绿，不等于设计验收）

---

# 第一部分：思考过程

## A1. 任务理解

- **用户诉求**：以当前浏览器中的成品状态为基准，对照设计参考图与记忆库开发要求，输出**差异报告**并制定**下一步修改计划**。
- **成功标准**：差距可审计（有等级、有模块、有文件级落点）；计划可执行（P0/P1/P2 + 验收标准）；不混淆工程绿灯与视觉门禁。

## A2. 信息来源

| 来源 | 路径 | 要点 |
|------|------|------|
| 总体视觉/数据铁律 | `.memory-bank/overall-design-framework.md` | 5D 银河背景、厚霓虹 rim、3D 图标与 Logo、Profile Hub 非纯钱包下拉 |
| UI 路线 | `docs/10-ui-design-route.md` | Dashboard 应真实行情面 + 可控 Swap；Trade 1440 专业布局 |
| 视觉门禁 | `docs/11-ui-visual-self-audit-gate.md` | 必须分栏「工程 vs 设计」 |
| 参考图 | `ref-074a2.png` 等 | 桌面三行：Swap+统计 / 行情+盘口 / 功能格 |
| 当前 1440 截图 | `current-dashboard.png` | 结构已接近 ref，质感与图表类型仍弱 |
| 用户窄屏截图 | 附件 | 仅见「Market Galaxy + 单 TVL」，信息密度与 ref 差距大 |
| 代码 | `DashboardPage.tsx`、`AppShell.tsx`、`SwapPanel.tsx` | 桌面三行布局已落地；Dashboard 仍用 `MarketChart` 非 `IonCandleChart` |

## A3. 对照方法

1. **结构层**：参考图模块分区 vs `page-dashboard` 网格（Swap / Stats / Market / OrderBook / FeatureGrid）。
2. **视觉层**：背景强度、玻璃 rim 厚度、中央 Swap 球体、功能格 3D 图标、顶栏钱包霓虹。
3. **数据层**：ticker / K 线 / 盘口 provenance；禁止假数据红线。
4. **响应式**：375 / 768 / 1440 三断点（用户截图代表 375 现状）。

## A4. 关键判断

- **P0**：影响「像不像 OKX/参考交易台」且用户首屏可见 — Dashboard K 线类型、移动端首屏信息架构、Profile/语言顶栏缺失。
- **P1**：质感与品牌 — 银河背景、厚霓虹、3D Logo/图标、壳层玻璃统一。
- **P2**：动效、异形轮廓、录屏验收流程自动化。

## A5. 工程验证 vs 视觉门禁

| 维度 | 状态 | 说明 |
|------|------|------|
| `ui-round-verify` / Playwright 16/16 | 可通过 | 测的是 testid 与交互，不测像素 |
| `verify-100` | 分支历史有 GREEN | 压力回归，不覆盖视觉 |
| **视觉门禁** | **未通过** | 与用户截图、ref 仍有明显差距 |

---

# 第二部分：差异报告（审计交付）

## B1. 结论摘要

当前实现在 **1440px 桌面** 上已具备参考图的三行**信息架构**（内嵌 Swap、右侧统计、行情+盘口、底栏功能格），但**视觉品质**（5D 银河、厚霓虹、3D 资产）与 **Dashboard 行情呈现**（柱状 `MarketChart` vs 参考图蜡烛图 + 宇宙球体）仍未达标；**375px 实机** 首屏仍像「单一大图 + TVL」，与参考图及记忆库要求的「密集专业交易台」不一致。

## B2. 总体差距矩阵

| 类别 | 参考图 / 记忆库要求 | 当前实现 | 等级 |
|------|---------------------|----------|------|
| 全局背景 | 5D 动态银河/极光，强景深 | `AuroraGalaxyBackground` 有，但偏暗、衬底弱 | P1 |
| 玻璃/霓虹 | 厚青紫霓虹 rim、液态高光 | `NeonGlassCard` / `glass-hud` 已有，rim 偏细、平 | P1 |
| 品牌 Logo | Swap 中央 **3D 球体/星云** | `ion-logo.jpg` 平面圆角图 | P1 |
| Dashboard 布局 | Swap 主导 + 统计 + 行情盘口 + 功能格 | 桌面已对齐；**窄屏首屏** 只见行情区（用户截图） | P0（移动）/ P1（桌面微调） |
| Dashboard 图表 | 专业 **蜡烛图** + 球体背景 | `MarketChart` 柱状；数据来自 API 但呈现类型弱于 Trade | P0 |
| Trade 图表 | 同左 | `IonCandleChart`（lightweight-charts）已接 API | 已缩小差距 |
| 盘口 | 右栏深度，红绿价量 | `OrderBookPanel` + API，结构对齐 | P2 微调样式 |
| 顶栏 | 语言 **CN/中文**、通知、**强紫霓虹钱包/头像** | 有 Globe/Bell/Wallet；**无语言切换 UI**；钱包非 Profile Hub | P0 |
| 侧栏 | **头像 + Online+** 置顶，纵导航 | Logo + `sidebar-wallet-chip` + 导航；**无头像** | P1 |
| 功能格图标 | **3D 浮动** 图标（火箭/桥/火焰等） | Lucide 线框图标 | P2 |
| Swap 主按钮 | 宽大 **紫色 SWAP** CTA | `NeonButton` 全宽，色相接近但发光层次弱 | P1 |
| 数据铁律 | 全量 typed + provenance | 行情/盘口/staking/burn 多数已接 API；Burn/Bridge/AI 页图表仍有 CSS/seed | P0 续 |
| 文案 | 无 shell/draft/TBD | 基本合规；用户图出现「PROFESSIONAL CHART」可能与本地旧构建不一致 | 待确认 |

## B3. 分模块差异

### 3.1 AppShell（壳层）

| 项 | 参考 | 当前 | 差距 |
|----|------|------|------|
| 顶栏 pill 导航 | 桌面常驻横向 | `md:flex` 已常驻 | 小：间距/发光可加强 |
| 语言切换 | 🌐 CN 中文 胶囊 | Globe 按钮无下拉/文案 | **P0** |
| 钱包/资料 | 头像 + 强紫外发光 | 文字 Wallet Connect + 下拉列表 | **P0**（接 ProfileHub） |
| Ticker | 多资产滚动胶囊 | 已实现 API/fallback | P2 |
| 侧栏头像区 | 顶栏下头像 + Online+ | 仅品牌 + wallet chip | **P1** |

### 3.2 Dashboard 首屏（与用户截图最相关）

| 项 | 参考 `ref-074a2` | 当前代码/截图 | 差距 |
|----|------------------|---------------|------|
| 第一视觉焦点 | **Swap 大面板**（BNB→ION、滑点、SWAP） | 桌面：Swap 在首行；**用户 375 截图未见 Swap**（需滚动或未部署最新） | **P0 移动首屏** |
| 标题区 | 「Swad」/ Swap 品牌化 | 「Swap」+ 副标题 | P2 文案 |
| 行情区标题 | 行情 + 球体融合 | 「ION Market Galaxy」+ Open Swap/Trade | P1：应弱 hero、强数据 |
| 图表类型 | **蜡烛图**（专业） | `MarketChart` **柱状**；Trade 页才是蜡烛 | **P0** |
| 球体/星云 | 行情区大型 3D 球体 | 无；仅 Swap 中小 logo | **P1** |
| AI Signal | 图下 Bullish x% | quote 行有部分文案，无独立 AI 条 | P1 |
| 统计卡 | TVL / APR / Burn 三卡竖排 | 已实现 `RightStats` | 桌面 OK；用户图仅 1 卡可见 → **滚动/断点** |
| 盘口 | 行情右侧深度表 | 桌面第二行右侧有 | 用户窄屏未露出 → **P0 移动 Tab/折叠** |
| 功能格 | 底部 6 枚 3D 玻璃卡 | 桌面底部有；窄屏需滚动 | P1 移动密度 |

### 3.3 Swap 独立页

| 项 | 参考 | 当前 | 差距 |
|----|------|------|------|
| 中央视觉 | 宇宙球体 | 平面 `ion-logo.jpg` | P1 |
| 表单与 CTA | 宽大霓虹 SWAP | 逻辑完整，视觉层级可再加强 | P1 |

### 3.4 Trade / 其它业务页（简述）

| 页 | 参考预期 | 当前 | 等级 |
|----|----------|------|------|
| Trade | 1440 图+簿+单 | 结构已有，`IonCandleChart` | P2 密度 |
| Burn/Bridge/AI | 真实趋势图 | 部分 CSS/seed（见 P0 自检） | P0 续 |
| Profile | 完整 Profile Hub | 组件存在，**未接入壳层** | P0 |

## B4. 数据与合规红线

| 检查项 | 状态 |
|--------|------|
| Ticker / staking / burn / orderbook API | 已接，有 `DataSourceBadge` |
| Dashboard K 线数据 | API candles → 但 **呈现为柱状图**，非假数据，属 **呈现未达标** |
| K 线 model | 多为 `ticker-anchored-synthetic-ohlc`（须在 UI 明示，后续换 upstream） | 合规，需升级源 |
| Burn/Bridge/AI 图表 | 仍有非专业图表路径 | **P0 续** |
| 空数据占位 | `AsyncState` 处理 | 合规 |

## B5. 响应式差异（375 / 768 / 1440）

| 断点 | 参考预期 | 当前 | 差距 |
|------|----------|------|------|
| 1440 | 三列桌面交易台 | `current-dashboard.png` 结构接近 | P1 视觉 |
| 768 | 图优先，表单单列 | 未专项验收 | P1 需截图 |
| 375 | 品牌+ticker+**核心交易动作可达** | 用户图：汉堡菜单 + **仅 Galaxy 图 + TVL** | **P0** |

## B6. 附件索引

| 文件 | 用途 |
|------|------|
| `docs/ui-audit-screenshots/ref-074a2.png` | 主参考 |
| `docs/ui-audit-screenshots/current-dashboard.png` | 当前 1440 自动化 |
| 用户附件（窄屏） | 当前实机 375 感知 |
| `docs/ui-deliverable-self-audit-2026-05-20-dashboard-ref-layout.md` | 上轮结构自检 |
| `docs/ui-deliverable-self-audit-2026-05-22-p0.md` | P0 市场面 |

---

# 第三部分：下一步修改计划

## 阶段 0 — 确认基线（0.5 天）

- [ ] 本地 `main` / `cursor/ui-design-workflow-44c9` 拉最新，`npm run dev:local` 后 **硬刷新**，确认用户截图是否为旧构建（文案应为「Professional Trading Surface」「Open Trade」）。
- [ ] 三断点截图入库：`current-dashboard-375.png`、`768`、`1440`（扩展 `capture-ui-screenshots.mjs`）。

## 阶段 1 — P0（结构 + 首屏 + 账户，约 2–3 个迭代）

| 序号 | 任务 | 落点 | 验收标准 |
|------|------|------|----------|
| P0-1 | Dashboard 行情改用 **`IonCandleChart`**，与 Trade 同源 | `DashboardPage.tsx`、`useDashboardMarket.ts` | 1440 与 ref 同为蜡烛；E2E `dashboard-market-chart` 带 `data-chart-ready` |
| P0-2 | **375 首屏**：Swap 折叠为顶栏下第一块，或 Tabs（Swap / Market / Book） | `DashboardPage.tsx` + 样式 | 375 无需滚动即可见 Swap 或 Tab 入口；Playwright 375 用例 |
| P0-3 | 顶栏接 **`ProfileHub`**：头像、语言、隐私模式入口 | `AppShell.tsx`、`ProfileHub.tsx` | 取代纯 Wallet 下拉；满足 memory「右上 Profile Hub」 |
| P0-4 | 顶栏 **语言切换** UI（CN/EN 至少切换 i18n 键） | `AppShell` + i18n 常量 | 可见「🌐 CN 中文」级控件 |
| P0-5 | Burn / Bridge / AI **图表接 API**（续 P0 市场面） | `BusinessPages.tsx`、backend routes | provenance 徽章；去掉纯 CSS 假趋势 |

**阶段 1 完成门禁**：`bash scripts/ui-round-verify.sh` 绿 + 新自检 `docs/ui-deliverable-self-audit-YYYY-MM-DD-p0-dashboard.md` + 三断点截图对比 ref。

## 阶段 2 — P1（视觉质感，约 2 个迭代）

| 序号 | 任务 | 落点 | 验收标准 |
|------|------|------|----------|
| P1-1 | 加强 **银河背景** 可见度与层次 | `AuroraGalaxyBackground`、token | 与 ref 对比不再「发黑糊」 |
| P1-2 | **厚霓虹 rim** 全站默认（hero + feature） | `NeonGlassCard`、`global.css` | Feature 格与 Swap 卡 rim 宽度接近 ref |
| P1-3 | Swap 中央 **3D 球体** 资产（WebGL/视频/分层 PNG） | `SwapPanel` | 替换平面 logo |
| P1-4 | 行情区 **背景球体** 层（与 ref 右侧星云一致） | `MarketStage` | 图表层级不挡交互 |
| P1-5 | 顶栏钱包按钮 **紫粉外发光** | `AppShell` header | 与用户截图紫边一致 |
| P1-6 | 侧栏 **头像 + Online+** 行 | `AppShell` sidebar | 对齐 ref 左上身份区 |
| P1-7 | Dashboard 弱化「Galaxy」营销标题，强化 **BNB/ION 行情** | copy + 排版 | 更接近专业盘而非落地页 |

## 阶段 3 — P2（打磨）

- 功能格 **3D 图标** 资源替换 Lucide（Pool/Grid/Bridge…）。
- 异形玻璃轮廓（不规则 clip）仅 hero 卡试点。
- `capture-ui` CI 附件 + 可选 Visual Review。
- CMC/Indexer **真实 OHLC** 替换 synthetic（provenance 升级）。

## 建议执行顺序（单线程）

```text
P0-1 → P0-2 → P0-3/P0-4（可并行）→ P0-5
→ P1-1 + P1-2（视觉底座）
→ P1-3 + P1-4 + P1-5 + P1-6
→ 全量 ui-round-verify → 视情况 verify-100
→ 更新 ui-deliverable-self-audit + 本报告「已关闭」列
```

## 签收 checklist（下一 PR 必须满足）

- [ ] 375 / 768 / 1440 截图已更新并与 ref 并排审查
- [ ] Dashboard 蜡烛图 + 移动首屏 Swap 可达
- [ ] ProfileHub + 语言切换上线
- [ ] 视觉自检报告结论仍为「未通过」或明确「通过」项列表
- [ ] 未宣称「与设计图一模一样」除非逐项勾选 B2 矩阵

---

**报告维护**：关闭某项差距后，在 B2 矩阵更新「当前实现」列并注明提交 hash。
