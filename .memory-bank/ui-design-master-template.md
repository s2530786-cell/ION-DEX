# ION DEX UI 设计图模板 — Master 对照与 100% 还原工作流

> **效力**：与 `.memory-bank/ui-cyber-glass-iron-law.md` 同级。凡前端 UI 开发、改稿、验收，**必须先读本文件并打开对应设计图**。  
> **资产路径**：`.memory-bank/design-refs/`（PNG + 开机动画母片 + Logo）  
> **完成定义**：色彩、风格、布局与设计图一致，不是「看起来像 Web3」。

---

## 0. 新增功能区块 — 必须延续模板（全局一致）

Master 要求：**以后新增的任何功能区块 UI，都必须按本模板与铁律统一设计，不得出现「新页面另一套风格」。**

### 0.1 设计原则

1. **先套组件，再写布局**：优先 `NeonGlassCard`、`NeonButton`、`FeatureTile`、`PageHero`；禁止裸 `div` + 随意 Tailwind 色。  
2. **先套 token，再写样式**：颜色/圆角/模糊只读 `global.css` `:root`；禁止新主色。  
3. **先找参考屏，再画界面**：新模块类型对照下表；无专属图时用最近业务弹窗 + Dashboard `04`。  
4. **先对照再合并**：PR/任务完成前填写 §5 差距表，P0=0。

### 0.2 新功能类型 → 默认参考图

| 新功能类型 | 默认对照设计图 | 代码参考页 |
|------------|----------------|------------|
| 交易/兑换类 | `04` + Swap 左栏 | `DashboardSwapPanel` / `SwapPage` |
| 流动性/质押类 | `05-modal-pool-liquidity.png` | `PoolPage` / `VaultStakePage` |
| 跨链/转账类 | `06-modal-bridge-crosschain.png` | `BridgePage` / `BatchTransferPage` |
| 数据/销毁/统计类 | `07-modal-burn-tracking.png` | `BurnPage` |
| 首页入口 tile | `04` 底栏五钮 + `02` 移动五宫格 | `FeatureTile` |
| 设置/列表/表单密集页 | `04` 右栏数据卡叠放 | `SettingPage` + `NeonCard density=compact` |
| 品牌/开机/空态 | `ion-dex-brand-logo.png` + boot MP4 | `SplashScreen` |

### 0.3 禁止清单（新功能高发问题）

- 新主色、新渐变方向（非 90deg 三色）  
- 平面灰框、白底表单、Ant Design 默认蓝  
- 新圆角体系（8/16/24 混用）  
- 关掉 `flow-border` / 极光背景「为了清晰」  
- 未进 `AppShell` 的孤立全屏页（除非 Master 明确要求）  

铁律全文：`.memory-bank/ui-cyber-glass-iron-law.md` §0。

---

## 1. 设计图资产清单（2026-05-26 Master 入库）

### 1.1 品牌

| 资产 | 路径 | 说明 |
|------|------|------|
| ION DEX Logo | `design-refs/brand/ion-dex-brand-logo.png` | 霓虹帽+水晶星+ION/DEX 立体字；开机动画与品牌区唯一标准 |
| 前端静态引用 | `frontend/public/brand/ion-dex-logo-master.png` | 同上副本 |

### 1.2 开机动画（2 条母片）

| 资产 | 路径 | 说明 |
|------|------|------|
| 横版方屏 | `design-refs/boot/boot-master-square-landscape.mp4` | 原 `ION DEX 开机动画.mp4` |
| 竖版 | `design-refs/boot/boot-master-portrait.mp4` | 原 `kaijidongION DEX.mp4` |

对照要点：深空底、三色霓虹、Logo 居中、玻璃/粒子层次；与静态 Logo 色相一致。

### 1.3 界面设计图（7 张 + 1 Logo）

见 `design-refs/README.md` 完整表。核心三张：

- **Dashboard 主图**：`screens/04-dashboard-galaxy-spiral.png`
- **玻璃边框标准**：`screens/01-glass-panel-wave-border.png`
- **移动端五宫格**：`screens/02-mobile-feature-grid-dfi-dex.png`

---

## 2. 设计图 → 代码映射（禁止跑偏）

| 设计图 | 路由/页面 | 主要组件/样式 |
|--------|-----------|----------------|
| `04-dashboard-galaxy-spiral` | `#/` | `DashboardPage`, `DashboardSwapPanel`, `MarketChart`, `FeatureTile`, `AppShell` |
| `03-dashboard-aurora-northern-lights` | `#/` 背景变体 | `AuroraGalaxyBackground` variant |
| `05-modal-pool-liquidity` | `#/pool` | `PoolPage`, `flow-border`, 青主色 CTA |
| `06-modal-bridge-crosschain` | `#/bridge` | `BridgePage`, 地球 3D 图标区、青 Transfer 钮 |
| `07-modal-burn-tracking` | `#/burn` | `BurnPage`, 双指标 + 青/粉面积图 |
| `02-mobile-feature-grid` | 375px | 底栏五钮、`FeatureTile` 专属渐变 |
| `01-glass-panel-wave-border` | 全局弹窗/卡片 | `.ion-glass-panel`, `.ion-glass-border`, `.flow-border` |
| `ion-dex-brand-logo` | 开机/顶栏 | `SplashScreen`, `AppShell` 字标（禁止大图 `ion-logo.jpg`） |

---

## 3. 100% 还原验收维度（逐项打勾）

每次 UI 改动后，按当前页面对照设计图，填写差距表（§5）。

### 3.1 色彩（铁律）

- [ ] 主渐变仅 `#00FFFF` → `#6020FF` → `#FF00FF`（90deg）
- [ ] 无额外主色（紫粉青以外的大面积色块）
- [ ] 发光 `box-shadow` 与边框色相一致（左青、中紫、右粉）

### 3.2 玻璃拟态

- [ ] `backdrop-filter: blur(18px)` 可见通透
- [ ] `--glass-bg: rgba(10, 15, 35, 0.25)` 量级
- [ ] 双层景深：内高光 + 外霓虹晕（非单层 `border: 1px`）

### 3.3 边框形态

- [ ] 主卡片使用流体/波浪感（`.flow-border` 或 SVG mask），非死矩形细线
- [ ] 圆角：面板 20px、按钮 12px

### 3.4 布局（Dashboard 以 `04` 为准）

- [ ] 顶栏：左标识 / 中 Wallet Connect / 右连接钮
- [ ] 中栏三列：Swap 窄 | K 线 ~70% | TVL/APR/Burn 栈
- [ ] 底栏五钮等宽：Pool 青 / Copy 紫 / Bridge 球体 / Burn 蓝粉 / Domain 粉

### 3.5 动效（产品环境）

- [ ] `flow-border` 流光、`float-3d` 悬浮、极光背景运行
- [ ] 仅 E2E / `prefers-reduced-motion` 可降级

### 3.6 开机

- [ ] 视频内容与 `boot-master-*.mp4` 一致（霓虹 Logo 叙事）
- [ ] 轮播读 `frontend/public/boot/boot-ion-*.mp4`

---

## 4. 标准差距分析流程（Agent 必须执行）

```text
输入：本次改动的页面/组件列表
  ↓
Step 1 — 打开设计图
  从 design-refs/screens/ 取对应 PNG；Dashboard 必开 04 + 01
  ↓
Step 2 — 抓取实现态
  1440×900 浏览器截图（或 Playwright）；375 / 768 若触达响应式
  ↓
Step 3 — 逐项对比（§3 六维）
  记录：元素 | 设计图 | 当前实现 | 差距等级 P0/P1/P2
  ↓
Step 4 — 根因归类
  A 色值/token  B 缺 blur/玻璃  C 边框形态  D 布局比例  E 动效被关  F 错误素材
  ↓
Step 5 — 修复计划
  文件路径 + 具体 CSS/class + 预估批次（A/B/C 见 ui-round2）
  ↓
Step 6 — 实现 → verify → 更新差距表直到 P0=0
```

### 4.1 根因 → 修复策略

| 根因 | 典型现象 | 修复方向 |
|------|----------|----------|
| A 色值 | 偏青绿/偏粉/发灰 | 改 `global.css` `:root`，禁止硬编码旧 hex |
| B 玻璃 | 纸片感、背景不透 | 加 `backdrop-filter` + `--glass-bg` + 内阴影 |
| C 边框 | 细灰框、无波浪 | `.flow-border` / `.ion-glass-border::before` |
| D 布局 | 列宽错、五钮不齐 | `DashboardPage` grid、`FeatureTile` 栅格 |
| E 动效 | 死板无霓虹 | 勿开全局 stable；查 `data-ion-ui-stable` |
| F 素材 | 错 Logo/背景 | 换 `ion-dex-logo-master.png`、极光层 |

### 4.2 差距等级

- **P0**：色值错误、布局区块错位、无玻璃模糊、错误品牌图 — 阻塞验收  
- **P1**：边框不够流体、发光弱、五钮渐变未分色、K 线区缺内层极光 — 本轮必须修  
- **P2**：3D 图标占位、微间距、字体字重 — 排期下一批  

---

## 5. 差距记录表（模板，复制到 PR/SESSION）

```markdown
## UI 差距分析 — [页面名] — [日期]

**设计图**：`design-refs/screens/xx-....png`  
**实现截图**：`docs/screenshots/....png`（或附路径）

| # | 维度 | 设计图要求 | 当前实现 | 等级 | 根因 | 修复文件 |
|---|------|------------|----------|------|------|----------|
| 1 | 色彩 | 青 #00FFFF 主 CTA | 偏 #24f7ff | P0 | A | global.css |
| 2 | 玻璃 | 18px blur 通透 | 无 blur | P0 | B | NeonCard.tsx |
| ... | | | | | | |

**修复批次**：Batch A1 / B1（见 docs/ui-round2-visual-alignment.md）  
**验证**：npm run verify · 1440 并排截图对比 04-dashboard
```

---

## 6. Cursor 对话约束（与设计图绑定）

开发 UI 时在 Cursor 中：

1. **@ 引用** 本目录对应 PNG（或粘贴 `docs/cursor-prompt-ion-ui-1to1.md` 全文）  
2. 写明：「以 `design-refs/screens/04-...` 为唯一标准，执行 §4 差距流程」  
3. 禁止：「做一个赛博 DEX」「好看一点」等无图指令  

---

## 7. 与第二轮视觉批次的关系

工程排期见 `docs/ui-round2-visual-alignment.md`：

- **Batch A**：K 线玻璃舞台、Chart 内层极光（对照 `04` 中栏）  
- **Batch B**：五宫格专属渐变 + Bridge 球体（对照 `04` 底栏 + `02`）  
- **Batch C**：Pool/Bridge/Burn 弹窗波浪框（对照 `05`/`06`/`07`）  

**铁律优先**：色值与布局以 `ui-cyber-glass-iron-law.md` 为准；形态细节以本目录 PNG 为准。

---

## 8. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-05-26 | Master 提供 8 张设计图 + 2 条开机动画 + Logo；归档至 `.memory-bank/design-refs/`；建立本对照工作流 |
