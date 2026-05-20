# ION-DEX swap.ion UI 视觉差距清单

基准：设计标准（#03050f + 粒子、4D liquid-glass 厚霓虹边、3D 浮图标、禁灰底/平直边/压缩小字、Pool/Bridge/Burn/Domain premium glowing glass）  
截图目录：`.cursor/logs/screenshots/ui-*-1440.png`（R1 后即为 after；`ui-pool-after-r1.png` 为对照副本）  
视口：1440×900  
日期：2026-05-21

## 总览

| 维度 | 当前状态（before） | 目标 | 优先级 |
|------|-------------------|------|--------|
| 背景 #03050f + 粒子 | 底色正确，粒子偏弱、被外壳遮挡感强 | 粒子与 aurora 清晰可见 | P1 |
| 4D liquid-glass + 厚霓虹边 | 约 1px 细白边，偏 flat | 3–4px 渐变霓虹 rim + 内高光 | P0 |
| 3D 图标浮于卡片内 | Lucide 平面图标，小方盒灰底 | 浮起、透视、外发光 | P0 |
| 禁灰底/平直/小字 | 大量 `bg-white/[0.04~0.07]`、细 divider、0.22em 小标签 | 深蓝紫玻璃底、发光分隔、可读标签 | P0 |
| Pool/Bridge/Burn/Domain | 与 Stake/Grid 同模板，灰 metric 条 | premium hero + 发光 metric 瓦片 | P0 |

## 分页面差距

### Swap（`ui-swap-1440.png`）

1. **外壳**：单线 `border-white/10`，缺少厚霓虹流动 rim。
2. **导航 pill**：灰底条 `bg-white/[0.04]`，激活态不够 glow。
3. **Swap 列**：输入区 glass 偏薄；quote 区灰青底条。
4. **Galaxy 圆盘**：有渐变但缺 liquid 厚度与外圈霓虹。
5. **Feature 条（Pool/Grid/Bridge…）**：六卡灰紫底、细边、平面图标 — **未达 premium glass**。
6. **Order book 行**：`bg-white/[0.04]` 平直灰条。

### Trade（`ui-trade-1440.png`）

1. 子面板 `glass-surface` 堆叠仍偏 flat。
2. 图表区边框过细，缺 trading surface 霓虹框。

### Grid / Stake

1. 与通用 Business 模板相同：metric 三格灰底 `bg-white/[0.045]`。
2. 右侧 checklist 灰块 `bg-white/[0.05]`。

### Pool（`ui-pool-1440.png`）— **重点**

1. Hero 区无独立 premium glow；标题旁图标 16×16 灰盒。
2. TVL / Pool fee / Positions 三 metric：**灰平卡片 + 压缩 uppercase 小字**。
3. Deposit / Slippage 表单：**水平细线分割**（flat table 感）。
4. 「Add Liquidity」条：半透明紫条，非 glowing CTA glass。
5. Product Modules 列表：灰底序号块，无 liquid 层次。

### Bridge / Burn / Domain — **重点**

1. 同 Pool：灰 metric 瓦片 + 细边主卡。
2. Burn/Domain 金色 accent 未做成 glowing gold glass。
3. 无页面级 hero 光晕区分（应各有 cyan/magenta/gold 氛围）。

### AI

1. 同 Business 模板；信号区若存在灰条需统一 glass 覆盖。

## CSS 修复项（仅 `global.css`，不改 DOM）

| ID | 修复内容 | 选择器/工具类 |
|----|----------|----------------|
| CSS-1 | 加厚 `neon-border-mask` / `flow-border` 渐变 rim + 外发光 | `.neon-border-mask`, `.flow-border` |
| CSS-2 | 强化 `glass-surface` liquid 多层渐变、2px 高光边 | `.glass-surface` |
| CSS-3 | 提升粒子 canvas 可见度 | `.pointer-events-none.fixed canvas` |
| CSS-4 | 外壳与 header 霓虹 rim | `.glass-surface.max-w-7xl`, `header` |
| CSS-5 | 导航/灰底 pill 改 glass+ glow | `nav[aria-label="Primary"]`, `nav button` |
| CSS-6 | 页面 hero 图标 3D 浮起 | `[data-testid^="page-"] .rounded-3xl` 图标容器 |
| CSS-7 | Pool/Bridge/Burn/Domain premium 页 | `[data-testid="page-pool"]` 等 + metric 子选择器 |
| CSS-8 | Feature 卡（feature-*）premium glass + 图标浮起 | `[data-testid^="feature-"]` |
| CSS-9 | 覆盖 Tailwind 灰底 `bg-white/[0.04~0.07]` 为 glass | `[data-testid="main-content"] [class*="bg-white"]` |
| CSS-10 | 放大压缩 label（uppercase tracking 过小） | `[data-testid^="page-"] .text-xs` 等 |
| CSS-11 | 主内容区 depth 透视 | `[data-testid="main-content"]` |

## 验收标准（after 截图对比）

- [x] 任意 NeonCard 外缘可见 **≥3px** 渐变霓虹光晕（`neon-border-mask` / `flow-border` R1）
- [x] Pool/Bridge/Burn/Domain 主卡与 metric 明显亮于 Stake/Grid（页级 glow + metric 瓦片）
- [x] Feature 条六卡具 floating 图标阴影与厚边（`float-3d` + feature 渐变）
- [x] 无明显灰条表单区（`bg-white/*` glass 覆盖 + metric 选择器）
- [x] 背景粒子在卡片间隙可见（canvas opacity/saturate 提升）
- [x] `npm run verify` 全绿（14 E2E，2026-05-21）
- [ ] `verify-full-save-log` 全绿（backend `@types/node` 环境问题，与 UI 无关）

## 修复记录

| 轮次 | 提交 | 截图 | 结果 |
|------|------|------|------|
| R1 | `style(ui): premium liquid-glass neon CSS-only` | `ui-*-1440.png` | 通过 `npm run verify`；仅改 `global.css` + 截图脚本 |
