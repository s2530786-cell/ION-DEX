# ION DEX — 第二轮视觉对齐（开源参考 + 验收清单）

> **状态**：已立项，待按批次落地。  
> **前提**：第一轮布局（Dashboard 三栏 + 底部五宫格、钱包 Portal、sticky 顶栏）已完成；**霓虹 / 3D / flow-border / 极光动效必须保留**，仅 E2E 与 `prefers-reduced-motion` 可降级。  
> **铁律**：`.memory-bank/ui-cyber-glass-iron-law.md`（Master 三色与布局锁定）、`docs/10-ui-design-route.md`、`docs/00-engineering-standards.md`、`.cursor/skills/ion-web3-ui/SKILL.md`

---

## 1. 目标（相对你的设计参考图）

| 维度 | 设计参考（你提供的 8 张图） | 当前实现差距 | 第二轮要对齐什么 |
|------|---------------------------|--------------|----------------|
| 玻璃舞台 | 厚霓虹描边、液态波浪边、半透明景深、底部漩涡光 | 有 `flow-border` + `glass-surface`，K 线区内层偏「平」 | K 线区 **内层极光 + depth-stage**，描边层次更接近参考单图 |
| 功能瓷砖 | 左上 3D 图标、左下标题、矮卡片、五色霓虹 | 布局已对；图标仍为 Lucide 扁平矢量 | **图标区 3D 光晕 + 可选等距插画资产**（不抄 OKX 素材） |
| 全局背景 | 星系/极光/星点明显 | `AuroraGalaxyBackground` 已开 | 提高 K 线/主舞台区 **局部对比**，避免「只有页面底图在动」 |
| 交易密度 | Swap 左栏紧凑、专业术语少 | `DashboardSwapPanel` 已有 | 与 `SwapPage` 字段命名、间距 token 统一 |
| 响应式 | 大屏三栏、小屏可叠 | `lg:grid-cols-[…]` | 375 / 768 / 1440 截图留档 |

**不做的误伤**（上一轮教训）：

- 禁止全局 `data-ion-ui-stable` 关闭 `float-3d` / `flow-border` / 行情滚动。
- 禁止删除 Dashboard 霓虹与 3D；只加强，不「减负成平面」。

---

## 2. GitHub 高星开源参考（只学结构与 token，不搬品牌素材）

以下仓库用于 **布局节奏、组件拆分、图表容器、Swap 表单密度**；GPL 项目只读参考，勿直接复制 SVG/商标/文案。

### 2.1 DEX / 交易前台（结构与信息架构）

| 仓库 | Stars（约） | 学什么 | 映射到 ION |
|------|------------|--------|-----------|
| [Uniswap/interface](https://github.com/Uniswap/interface) | ~5.5k | `apps/web` 单页交易流、Swap 状态机、钱包门闸、Vite 分包 | `DashboardSwapPanel`、`SwapPage`、钱包摘要 |
| [pancakeswap/pancake-frontend](https://github.com/pancakeswap/pancake-frontend) | ~2.9k | Feature 分包、`packages/ui` 共享 primitive、Farm/Pool 卡片网格 | 底部 `FeatureTile` 网格、Pool/Stake 页 |
| [dydxprotocol/v4-web](https://github.com/dydxprotocol/v4-web) | ~数百～1k+ | 专业盘口：图表 + order book + 下单栏三列断点 | `TradePage` 1440/768/375 路线 |
| [jup-ag/jupiter-terminal](https://github.com/jup-ag/jupiter-terminal) | 嵌入式 Swap | 紧凑 Swap 面板、路由预览、最小收到 | Dashboard 左栏 Swap |
| [Dexscreener/dexscreener](https://github.com/dexscreener/dexscreener) | 产品站参考 | K 线 + 交易对标题 + 涨跌幅排版 | `MarketStage` 标题区 |

### 2.2 图表与数据面（实现层）

| 仓库 / 库 | 学什么 | 映射到 ION |
|-----------|--------|-----------|
| [tradingview/lightweight-charts](https://github.com/tradingview/lightweight-charts) | 已用于 `MarketChart`；学 **容器 padding、十字线、暗色主题** | `ChartFrame`、Dashboard/Trade 图表区高度 |
| [recharts/recharts](https://github.com/recharts/recharts) | 指标小图、Burn 趋势 | `BurnPage` 条形/折线（若升级） |

### 2.3 视觉 / 动效 / 玻璃拟态（token 与 CSS 模式）

| 仓库 | 学什么 | 映射到 ION（已有则强化） |
|------|--------|-------------------------|
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | Radix + Tailwind 组合方式、focus ring | 表单、对话框、钱包面板 a11y |
| [magicuidesign/magicui](https://github.com/magicuidesign/magicui) | `border-beam`、霓虹边框动画思路 | 对齐现有 `.flow-border` 参数 |
| [aceternitylabs/aceternity-ui](https://github.com/aceternitylabs/aceternity-ui) | 极光卡片、3D 卡片倾斜（**仅 hover**，勿全局晃） | `FeatureTile` 图标舞台 |
| [pmndrs/drei](https://github.com/pmndrs/drei) | 若未来要真 3D 图标 GLB | **可选** Phase 3，非必须 |

### 2.4 设计系统文档（智能体阅读用）

| 资源 | 用途 |
|------|------|
| [Material Design 3](https://m3.material.io/) | 间距、类型 scale（数字用 tabular-nums） |
| OKX Web3（产品观察，**无官方开源 UI**） | 顶栏密度、行情条、钱包入口 — 仅行为参考 |

---

## 3. 第二轮实施顺序（与 `docs/10-ui-design-route.md` 对齐）

每批 **只改 1 个页面或 1 组 primitive**，改完跑 `scripts\verify-full-save-log.cmd --no-pause`（或 `frontend` 内 `npm run verify`）。

### Batch A — 共享 primitive（优先）

| 任务 | 文件触点 | 参考来源 | 验收 |
|------|----------|----------|------|
| A1 `ChartStage` 内层极光 | 新建 `components/ui/glass/ChartStage.tsx`，Dashboard/Trade 复用 | 设计参考图 + magicui 边框思路 | K 线区可见青紫雾光，图表仍可读 |
| A2 `flow-border` 波浪边可选变体 | `global.css` `.flow-border-hero` | 设计单图波浪描边 | 仅 `MarketStage` 外圈启用 |
| A3 指标卡 `MetricTile` 统一 | 抽 `MetricTile`（TVL/APR/Burn） | Pancake metric 卡 | 右栏三卡字号/间距一致 |
| A4 Feature 图标舞台 | `FeatureTile.tsx` | aceternity 3D card（轻量 CSS） | 图标 `float-3d` + 强 `drop-shadow`，hover 微缩放保留 |

### Batch B — Dashboard 像素级

| 任务 | 验收对照设计图 |
|------|----------------|
| B1 `MarketStage` 套 `ChartStage` + `flow-border-hero` | 中间栏像「玻璃舞台」而非灰框 |
| B2 去掉工程味副标题（若仍有） | 仅保留 `Market` + `ION / USDT` + 报价 |
| B3 `FeatureGrid` 间距 `gap-3` → 设计稿比例 | 1440 下五列等高，375 下 2 列 |
| B4 截图存档 | `docs/ui-deliverable-self-audit-YYYY-MM-DD.md` 附 375/768/1440 |

### Batch C — Trade / Swap 专业面

| 任务 | 参考 |
|------|------|
| C1 Trade 三列断点 | dydx v4-web / Uniswap web |
| C2 Swap 与 Dashboard 左栏 token 一致 | jupiter-terminal |

### Batch D — 其余 PRD 页（第三轮可并行）

Pool / Stake / Burn / Bridge / Domain — 按 `docs/10` § Page Upgrade Route，每页套用 Batch A primitive。

---

## 4. 开源检索工作流（你本地也可做）

```text
1. 在 GitHub 搜索：dex dashboard react tailwind stars:>1000
2. 打开 apps/web 或 src/pages，只看：grid、card、chart wrapper、swap form
3. 记录 3 条可抄的 class 模式 → 写入本文件 §5
4. 在 ION 用现有 NeonGlassCard / flow-border 实现，不引入新 UI 框架
5. agent-verify → 更新 docs/99-current-progress.md
```

推荐搜索词：

- `web3 dashboard glassmorphism react`
- `defi swap panel tailwind`
- `lightweight-charts dark theme react`
- `neon border css animation`（对照 `.flow-border`）

---

## 5. 实施记录（第二轮落地时填写）

| 日期 | Batch | 改动摘要 | verify |
|------|-------|----------|--------|
| 2026-05-26 | B | ChartStage 舞台、去 Modules、FeatureGrid gap-4 等高；差距报告 `docs/ui-gap-analysis-batch-b-2026-05-26.md`；截图 `docs/screenshots/ui-signoff/batch-b/` | verify-full ✅ 33/33 E2E；stress×100 + verify-100 流水线中 |
| 2026-05-28 | B | verify-100 GREEN 后自动 commit+push | verify-100 GREEN (C:\Users\admin\AppData\Local\Temp\ion-verify-100-summary-20260528-114641.txt) |
| — | — | （待填） | — |

---

## 6. 与 Master 设计素材的绑定

**权威路径（已入库，勿再用 Cursor 临时 assets 长文件名）：**

| 用途 | 路径 |
|------|------|
| 索引 | `.memory-bank/design-refs/README.md` |
| 对照流程 | `.memory-bank/ui-design-master-template.md` |
| Dashboard 主验收 | `.memory-bank/design-refs/screens/04-dashboard-galaxy-spiral.png` |
| 玻璃波浪边框 | `.memory-bank/design-refs/screens/01-glass-panel-wave-border.png` |
| Pool / Bridge / Burn | `05` / `06` / `07` 同名前缀 PNG |
| 品牌 Logo | `.memory-bank/design-refs/brand/ion-dex-brand-logo.png` |
| 开机动画母片 | `.memory-bank/design-refs/boot/boot-master-*.mp4` |

**视觉自检**：每批改完 1440 宽并排对比 `04-dashboard-galaxy-spiral.png` + `01-glass-panel-wave-border.png`；填写差距表见 `ui-design-master-template.md` §5。

---

## 7. 下一步（你同意后 Agent 执行）

1. 从 **Batch A1 + B1** 开始（K 线玻璃舞台 + 内层极光），不动全局动效开关。  
2. 每批完成后：`npm run verify` + 三张断点截图说明。  
3. 需要我直接开干时，回复「按 Batch A 执行」即可。
