# ION DEX 前端 UI 铁律 — 赛博极光玻璃拟态（Master 锁定）

> **效力**：凡修改 `frontend/` 下 UI、样式、页面布局，**必须先读本文** + `docs/10-ui-design-route.md` + `.cursor/skills/ion-web3-ui/SKILL.md`。  
> **唯一视觉标准**：用户提供的 ION DEX 设计参考图（Dashboard 三栏 + 底部五功能块 + 各业务弹窗）。禁止 Cursor/Agent 自行「赛博朋克化」改色。  
> **与代码映射**：`frontend/src/styles/global.css` 中 `:root` 与 `.ion-glass-*` / `.glass-surface` / `.flow-border`。

---

## 0. 新增功能区块 — 全局风格统一（硬规则）

**以后任何新增页面、模块、弹窗、侧栏、表单区、列表卡片，都必须按 Master 模板风格设计，与现有 Dashboard / Pool / Bridge / Burn 保持同一套视觉语言。**

| 必须 | 禁止 |
|------|------|
| 复用 `NeonGlassCard` / `NeonCard` / `NeonButton` / `FeatureTile` / `PageHero` / `AuroraGalaxyBackground` | 新建一套配色、圆角、边框或「另一种赛博风」 |
| 使用 `:root` 三色 token 与 `.ion-glass-panel` / `.flow-border` | 硬编码新 hex 主色、Material/扁平灰框 |
| 新模块对齐已有弹窗质感（对照 `design-refs/screens/05–07`） | 白底卡片、无 `backdrop-filter` 的纸片 UI |
| 底栏/入口新 tile 从五宫格色系表取专属渐变（青/紫/球体/蓝粉/粉） | 随机图标色或与 Pool/Bridge 撞色 |
| 布局嵌在 AppShell 五区锚点内，或业务页 `PageHero` + 玻璃面板栈 | 破坏顶栏 / 全屏乱排版 |
| 开新功能前先读 `ui-design-master-template.md` §0.1 自检 | 只写功能、不管视觉统一 |

### 0.1 新功能 UI 交付前自检（全部打勾才算完成）

- [ ] 色彩仅 §1 三色 + 合法 gold 点缀  
- [ ] 玻璃：`backdrop-filter` + `--glass-bg` + `--panel-radius`  
- [ ] 边框：`.flow-border` 或 `.ion-glass-border`（90deg 流光）  
- [ ] 背景：仍用极光/银河层，不换成纯色或浅色主题  
- [ ] 组件：无重复造轮子；新样式先扩展 token/CSS，不复制一套  
- [ ] 与最接近的已有页面对比（如 Bridge 类 → `06-modal-bridge-crosschain.png`）  
- [ ] `npm run verify` + 1440 截图并排设计图或同类参考屏  

**新功能没有单独设计图时**：以 `04-dashboard-galaxy-spiral.png` + 最相近业务弹窗（05/06/07）为默认模板，不得自行发明第四套主色。

---

## 1. 唯一色彩标准（禁止乱加色）

### 1.1 极光三色（主渐变，横向 90deg 唯一合法渐变）

| Token | 色值 | 用途 |
|-------|------|------|
| `--ion-cyan` | `#00FFFF` | 左缘发光、Pool、Swap 左栏强调 |
| `--ion-purple` | `#6020FF` | 中间过渡、Copy Trade、Bridge 球体 |
| `--ion-magenta` | `#FF00FF` | 右缘发光、Burn/Domain 粉紫强调 |

**渐变规则（100% 匹配设计图）**：

```css
background: linear-gradient(90deg, var(--ion-cyan), var(--ion-purple), var(--ion-magenta));
```

- 所有卡片描边、主按钮、flow-border 流光：**只用上述三色横向渐变**。  
- **禁止**自由发挥第四主色；`--ion-gold` 仅允许 Burn 进度条末端点缀（已有产品逻辑），不得作为新面板主色。  
- 边框发光方位：左青、中紫、右粉，与参考图霓虹流光一致。

### 1.2 玻璃与圆角

| Token | 值 |
|-------|-----|
| `--glass-bg` | `rgba(10, 15, 35, 0.25)` |
| `--glass-blur` | `18px` |
| `--panel-radius` | `20px` |
| `--btn-radius` | `12px` |

### 1.3 霓虹外发光（双层：内高光 + 外晕）

| Token | 值 |
|-------|-----|
| `--glow-cyan` | `0 0 12px 3px rgba(0, 255, 255, 0.6)` |
| `--glow-purple` | `0 0 12px 3px rgba(96, 32, 255, 0.6)` |
| `--glow-magenta` | `0 0 12px 3px rgba(255, 0, 255, 0.6)` |

### 1.4 遗留别名（勿在新代码硬编码旧 hex）

| 旧名 | 处理 |
|------|------|
| `--ion-violet` | 指向 `--ion-purple` |
| `#24f7ff` / `#8d4dff` / `#ff3bd4` | 已废弃，迁移到三色 token |

---

## 2. Dashboard 固定布局锚点（禁止乱排版）

五大区块栅格永久对齐设计图（`lg` 断点起三栏）：

```text
┌─────────────────────────────────────────────────────────────┐
│ 顶栏：品牌(4D Logo+ION DEX) │ 行情条 │ Wallet Connect      │
├──────────┬──────────────────────────────┬─────────────────┤
│ 左 Swap  │ 中 K 线主画布 (~70% 视觉宽)   │ 右 TVL/APR/Burn │
│ 窄高玻璃 │ 星空极光底 + 半透图表 + 渐变遮罩│ 竖叠三块玻璃    │
│ 左侧青发光│ flow-border 厚霓虹舞台       │ 上→下 青/紫/粉  │
├──────────┴──────────────────────────────┴─────────────────┤
│ 底栏 5 功能块（等宽等高）：Pool | Copy | Bridge | Burn | Domain │
└─────────────────────────────────────────────────────────────┘
```

| 区块 | 实现触点 | 比例/行为 |
|------|----------|-----------|
| 顶栏 | `AppShell.tsx` | sticky；磨砂玻璃 + 顶缘流光；**无巨大位图 Logo** |
| 左 Swap | `DashboardSwapPanel.tsx` | 窄列；单边青色霓虹；币对→金额→Swap |
| 中 K 线 | `DashboardPage` `MarketStage` | 主舞台；`flow-border` + `depth-stage`；内层极光 |
| 右数据 | `RightStats` + `NeonCard density=compact` | 三块独立玻璃；配色依次偏青/紫/粉 |
| 底 5 钮 | `FeatureTile` × 5 | 见 §3 |

**响应式**：375 单列堆叠；768 过渡；1440 三栏 + 五列底栏。结构不乱，只缩不放乱序。

---

## 3. 底部五功能块配色（与设计图一一对应）

| 模块 | 主色倾向 | `FeatureTile` variant / 备注 |
|------|----------|------------------------------|
| Pool | 青色 | `cyan` |
| Copy Trade | 紫色 | `magenta`（粉紫边） |
| Bridge | 蓝紫极光球 | `cyan` + 中间强调渐变球体感 |
| Burn | 蓝粉渐变 | `magenta` |
| Domain | 洋红粉 | `gold` 或专用 pink rim（标题 Domain） |

图标：立方体/星球/齿轮等 **3D 镭射质感**；Lucide 仅作占位时须加 `float-3d` + 强 `drop-shadow`，不得扁平灰图标。

---

## 4. 玻璃拟态 CSS 规范（代码类名）

### 4.1 标准面板 `.ion-glass-panel`

- `background: var(--glass-bg)`  
- `backdrop-filter: blur(var(--glass-blur))`（**必填**，否则无通透感）  
- `border-radius: var(--panel-radius)`  
- 内外双层辉光：`box-shadow: var(--glow-cyan), var(--glow-purple)`（按位调整）

### 4.2 流体霓虹边框 `.ion-glass-border` / `.flow-border`

- 伪元素 `::before`：`linear-gradient(90deg, 青, 紫, 粉)` + `filter: blur(4px)` 或项目 `ionBorderFlow` 动画  
- **现有代码**：优先使用 `.flow-border`（已接入 Dashboard）  
- 波浪不规则边框：hero 卡 / 弹窗用 `flow-border` + 更大 `border-radius`

### 4.3 与现有 primitive 映射

| 铁律类名 | 项目已有 | 说明 |
|----------|----------|------|
| `.ion-glass-panel` | `.glass-surface` | 新代码可二选一，逐步统一到 iron-law token |
| `.ion-glass-border` | `.flow-border` | 同一视觉，禁止再发明第三套边框 |
| 3D 浮动 | `.float-3d` / `.float-3d-strong` | **禁止全局关闭**（仅 E2E / `prefers-reduced-motion`） |
| 背景 | `AuroraGalaxyBackground` | 深空银河极光，全站统一 |

### 4.4 组件细则

1. **主按钮**：`NeonButton` — 青→紫→粉渐变，`border-radius: var(--btn-radius)`，外霓虹晕。  
2. **弹窗**（Bridge/Burn/Pool 等）：不规则流体玻璃 + 全边框三色环绕；钱包用 Portal 遮罩（`AppShell`）。  
3. **图表**：深半透底；K 线青/紫分层；`MarketChart` 线条色 `var(--ion-cyan)`。  
4. **文字**：标题霓虹发光（`.text-glow-cyan` / `.text-glow-magenta`）；正文 `text-cyan-100/80`；数值高亮跟板块色。

---

## 5. Cursor / Agent 强制 Prompt（复制即用）

```text
严格按照 ION DEX 设计参考图与 .memory-bank/ui-cyber-glass-iron-law.md 执行，1:1 对齐视觉：

1. 色彩唯一固定：青 #00FFFF、紫 #6020FF、洋红 #FF00FF；禁止任何额外主色。
2. 全站深空极光星空背景；所有面板必须 backdrop-filter 磨砂玻璃（--glass-blur: 18px）。
3. 卡片边框仅允许 90deg 青→紫→粉横向流光渐变霓虹发光。
4. 布局固定：顶栏 / 左 Swap / 中 K 线 / 右数据 / 底 5 功能按钮；间距比例对照参考图。
5. 保留 3D 流体玻璃、flow-border、float-3d 景深；禁止全局关闭动效。
6. 响应式 375/768/1440 结构不乱；字体与图标层级对照原图。
7. 禁止简化玻璃深度、禁止自动调色、禁止 placeholder/shell/draft 文案。

改代码前读 docs/10-ui-design-route.md；改后跑 frontend verify。
```

**温度/行为**：以用户上传的设计图为唯一标准；有冲突时 **设计图 > 泛化赛博关键词**。

---

## 6. 多页面统一（Bridge / Pool / Burn / Domain / Trade）

1. 所有弹窗共用：`.flow-border` + 三色 token + `--panel-radius`。  
2. 图标色系与首页五宫格一一对应。  
3. 背景不换风格（仅 `AuroraGalaxyBackground` 变体强度可调）。  
4. 数据必须来自真实 API/seed，禁止假数据冒充产品 UI。

**Master 设计图模板（必对照）**：`.memory-bank/ui-design-master-template.md` + `.memory-bank/design-refs/screens/`（Dashboard 主验收图 `04-dashboard-galaxy-spiral.png`）。

---

## 7. 避坑清单（90% 对不上图的原因）

| ❌ 错误 | ✅ 正确 |
|--------|--------|
| 只写「赛博朋克 DEX」 | 绑定参考图 + 本文 §1 色值 |
| AI 自由渐变 | 写死 `--ion-cyan/purple/magenta` |
| 省略 `backdrop-filter` | 所有玻璃面板必须模糊 |
| 圆角混用 8/12/24/32 | 面板 20px、按钮 12px |
| 全局关动画变平面 | 仅 a11y/E2E 降级 |
| 左上角巨大 Logo 图 | `Hexagon` + 字标 `brand-title` |

---

## 8. 开源参考（辅助，不覆盖铁律）

结构可参考：Uniswap interface、Pancake frontend、dydx v4-web、Jupiter terminal。  
详见 `docs/ui-round2-visual-alignment.md`。  
**色值与布局以本文为准**，不以开源项目配色为准。

---

## 9. 验收门禁（UI 改动完成定义）

- [ ] 仅使用 §1 三色 + 合法 gold 点缀  
- [ ] Dashboard 五区块位置正确（含底 5 钮配色）  
- [ ] 玻璃 `backdrop-filter` 可见通透  
- [ ] `flow-border` / `float-3d` 在产品环境开启  
- [ ] 375 / 768 / 1440 截图或 E2E 通过  
- [ ] `npm run verify` + encoding 通过  

---

## 10. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-05-26 | Master 提供完整落地方案；写入 memory-bank；`:root` 三色锁定为 #00FFFF / #6020FF / #FF00FF |
