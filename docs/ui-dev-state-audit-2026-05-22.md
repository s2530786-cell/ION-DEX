# ION DEX 前端开发状态审计（2026-05-22）

**分支**：`cursor/ui-design-workflow-44c9`（工作区可能 ahead of origin）  
**审计范围**：本地 dev 平面 UI 回归、Tailwind/CSS 管线、赛博动效接入、rim/背景加强  
**对照**：`docs/10-ui-design-route.md`、`docs/ui-gap-report-2026-05-22.md`、`docs/11-ui-visual-self-audit-gate.md`

---

## 1. 执行摘要

| 维度 | 状态 | 说明 |
|------|------|------|
| 工程编译 | 通过 | `npm run build`（tsc + vite）绿 |
| 玻璃态 CSS 管线 | 已恢复 | Tailwind **3.4.19** + `autoprefixer`；产物含 `neon-glass-card`、`backdrop-filter` |
| 本地 dev（3010/3001） | 探测通过 | `backdrop-filter: blur(18px)`、`ionFloat3d`、11× `.neon-glass-card` |
| 视觉 vs 参考图 | **未过门禁** | 结构/文案已新；rim/银河/3D 资产仍弱于 `ref-074a2.png` |
| 本次交付 | 已完成 | 接入 `cyber-animations.css`、加强 rim/背景、修复 `NeonCard` 语法 |

**一句话**：「真平面」主要是 **Tailwind v4 误配 + NeonCard 语法错误 + 双端口缓存** 导致；修复后 CSS 已生效，但相对 OKX 参考仍偏平，需继续 P1 资产与布局工作。

---

## 2. 根因时间线（为何 UI 又变平面）

### 2.1 硬技术回归（已处理）

1. **Tailwind v4 + v3 语法混用**（`9da4b70f`）  
   - v4 PostCSS 不处理 `tailwind.config.js` 与 `@layer utilities`。  
   - 结果：`backdrop-blur`、自定义 `@layer` 未进 CSS → 卡片 `backdropFilter: none`。  
   - 修复：降级 `tailwindcss@3.4.19`，`theme.css` 增加 `@tailwind components`。

2. **`NeonCard.tsx` className 未闭合**（2026-05-22）  
   - `className={[ ... ]` 缺少 `.join(" ")}` → Vite oxc `PARSE_ERROR`。  
   - Swap 区用 `NeonCard`，dev 易红屏或 HMR 半残。  
   - 修复：补上 `.join(" ")}`。

### 2.2 环境与认知（易误判为「又坏了」）

| 现象 | 原因 |
|------|------|
| 打开 3001 仍是旧观感 | PID 僵尸、多 Vite 实例、浏览器强缓存 |
| 测试绿但肉眼仍平 | Playwright 只验 testId/文案，不验像素 |
| 窄屏像「一块平板」 | 375 首屏先见行情区，Swap 需滚动 |
| 期望赛博动效不见 | `cyber-animations.css` 此前未 import；`CyberCard` 未挂页面 |

### 2.3 设计差距（CSS 正常时仍「平」）

见 `docs/ui-gap-report-2026-05-22.md`：细 rim、线框 Lucide、平面 logo、银河被壳层压暗等。

---

## 3. 本次代码变更（2026-05-22 本轮）

### 3.1 接入赛博动效

- `frontend/src/main.tsx`：在 `theme.css` 之后增加  
  `import "./styles/cyber-animations.css";`
- `theme.css` 中 `.neon-glass-card::before` 叠加动画  
  `borderPulse`（来自 `cyber-animations.css`）+ 既有 `neonGlassBorderPulse`。

### 3.2 加强霓虹 rim

**`frontend/src/styles/theme.css`**

- `--border-gradient` 扩展为青 → 紫 → 品红 → 金四色。  
- `--neon-glow-*` 双层 shadow 加强。  
- `.neon-glass-card::before`：`inset: -2px`、更高 opacity、`background-size: 280%`。  
- `.neon-glass-card__inner`：`margin: 2px`，内层外发光加强。  
- 新增 `.neon-glass-card.neon-rim-hero`（`inset: -3px` + 金色外晕）供 Swap/行情 Hero。

**组件**

- `NeonGlassCard`：新增 `rim?: "default" | "hero"`；默认 drop-shadow 加强。  
- `NeonCard`（Swap）：默认 `neon-rim-hero`。  
- `DashboardPage` 行情区、`PageHero`：`rim="hero"`。

### 3.3 加强背景可见度

**`AuroraGalaxyBackground.tsx`**

- 径向渐变透明度上调；顶部遮罩 `0.52 → 0.28`。  
- 星点层 `opacity-30 → opacity-[0.22]`。  
- Aurora 光带 alpha 提高。

**`global.css` — `.glass-shell-frame`**

- 背景 `0.38 → 0.26`（更透，露出银河）。  
- 边框与 `box-shadow` 青/品加强。  
- 新增 `::before` 外沿光晕 blur。

### 3.4 其它修复（同会话）

- `NeonCard.tsx`：`className` 数组 `.join(" ")`（消除 PARSE_ERROR）。

---

## 4. 本地开发状态（操作指引）

| 项 | 推荐值 |
|----|--------|
| Dev URL | `http://127.0.0.1:3010/`（`npm run dev:local`，`--strictPort`） |
| 勿依赖 | 3001 僵尸进程（`restart-ion-dev-local.ps1` 常 WARN） |
| 硬刷新 | `Ctrl+Shift+R` |
| 自检脚本 | `node frontend/scripts/probe-glass-styles.mjs` |
| Dashboard 文案 | 应有 `Professional Trading Surface`、`Open Trade`（非 `Open Swap`） |

**依赖检查**

```powershell
cd frontend
npm install
npm ls tailwindcss   # 应为 3.4.x，无 @tailwindcss/postcss
npm run build
```

---

## 5. 验证记录

| 检查 | 命令 / 工具 | 结果（审计时） |
|------|-------------|----------------|
| TypeScript | `npx tsc --noEmit` | 通过 |
| 生产构建 | `npm run build` | 通过 |
| 玻璃态探测 | `scripts/probe-glass-styles.mjs` @ 3010/3001 | `blur(18px)` + `ionFloat3d` |
| Dashboard 结构 | `scripts/check-dashboard-ui.mjs` | `Open Trade` OK |
| 全量 verify | `scripts/verify-full-save-log.cmd --no-pause` | 因 `frontend/.env` 带 BOM 编码检查失败（非本轮 CSS 变更） |
| 前端 E2E | `npm run build` + `verify-e2e.mjs` | build 绿；E2E 部分用例失败（需单独排查 smoke） |

---

## 6. 未接入 / 待办（仍会导致「不够炫」）

| 项 | 状态 | 建议 |
|----|------|------|
| `CyberCard.tsx` / `GlitchText` / `ScanlineOverlay` | 文件存在，**无页面引用** | P2：Dashboard Hero 或 Shell 试点 |
| 3D Swap 球体 / 功能格 3D 图标 | 仍 `ion-logo.jpg` + Lucide | P1：资产替换 |
| ProfileHub / 语言切换 | 组件在库，壳层未全接 | P0（见 gap-report） |
| 375 首屏 Swap 可达 | 未做 Tab/折叠 | P0 |
| 视觉门禁报告 | 需另写 `ui-deliverable-self-audit-2026-05-22-*.md` | 三断点截图后补 |

---

## 7. 差距矩阵（审计后预期）

| 类别 | 审计前 | 本轮后 | 参考图 |
|------|--------|--------|--------|
| CSS 玻璃/模糊 | 可能缺失（v4）或 dev 报错 | 稳定 | — |
| Rim 厚度 | 细 | **加粗 + 脉冲** | 仍略细于 ref |
| 银河背景 | 偏暗 | **更亮、壳更透** | 仍待 P1-1 |
| Swap Hero rim | 默认 | **hero** | 改善 |
| 3D 资产 | 无 | 无 | P1 |

**视觉门禁**：**未通过**（工程可绿；像素级未对齐 ref）。

---

## 8. 建议下一步（按优先级）

1. **P0**：跑通 `verify-full-save-log`；375 首屏 Swap Tab；`ProfileHub` + 语言 UI 接入 `AppShell`。  
2. **P1**：三断点截图 + `ui-deliverable-self-audit-2026-05-22-rim-background.md`。  
3. **P1**：Swap 3D 球体资产；行情区背景球体层。  
4. **P2**：试点 `ScanlineOverlay` 于 Shell；`CyberCard` 替换部分 `NeonGlassCard`。

---

## 9. 变更文件清单

| 文件 | 变更类型 |
|------|----------|
| `frontend/src/main.tsx` | import cyber-animations |
| `frontend/src/styles/theme.css` | rim tokens + hero modifier |
| `frontend/src/styles/global.css` | shell frame 透光 + glow |
| `frontend/src/components/background/AuroraGalaxyBackground.tsx` | 背景提亮 |
| `frontend/src/components/ui/NeonGlassCard.tsx` | `rim` prop |
| `frontend/src/components/ui/NeonCard.tsx` | hero rim + join fix |
| `frontend/src/pages/DashboardPage.tsx` | market `rim="hero"` |
| `frontend/src/components/ui/glass/PageHero.tsx` | `rim="hero"` |
| `docs/ui-dev-state-audit-2026-05-22.md` | 本审计 |

---

## 10. 签核

| 角色 | 结论 |
|------|------|
| 工程管线 | Tailwind 3.4 + 玻璃 CSS 已恢复；赛博动效已接入 |
| 视觉门禁 | 未通过；本轮为 P1 质感增量，非终验收 |
| 建议发布 dev | 仅内部预览；对外演示前完成 P0 壳层与 375 首屏 |

*本文件可提交至仓库，供 Master / 后续 Agent 接续 `SESSION_STATE.md` 与 `docs/99-current-progress.md`。*
