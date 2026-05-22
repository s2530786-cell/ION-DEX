# ION DEX UI 铁律执行计划（2026-05-22）

**依据**：`.memory-bank/overall-design-framework.md`、`docs/10-ui-design-route.md`、`docs/11-ui-visual-self-audit-gate.md`、`docs/ui-gap-report-2026-05-22.md`  
**模式**：读记忆 → preflight → 单范围实现 → 工程验证 → 视觉自检报告 → 更新 `SESSION_STATE.md`

---

## 铁律检查清单（每次 UI 迭代前）

| # | 铁律 | 动作 |
|---|------|------|
| 1 | 读 `docs/00-engineering-standards.md` + memory-bank 五件套 | `node scripts/dev-preflight.mjs` |
| 2 | 视觉：OKX Web3 / 液态玻璃 / 厚霓虹 / 银河背景 / 3D 品牌 | 对照 `ref-074a2.png` |
| 3 | 数据：无空数据、无伪代码、provenance | `DataSourceBadge` / API hooks |
| 4 | 禁 shell/draft/TBD/Build Checklist 用户可见 | preflight `ION_UI_STRICT=1` 可选 |
| 5 | 响应式 375 / 768 / 1440 | Playwright + 截图 |
| 6 | 工程验证 | `npm run build` → `ui-round-verify` |
| 7 | 视觉门禁报告 | `docs/ui-deliverable-self-audit-YYYY-MM-DD-*.md` |

**本地 dev 端口**：`http://127.0.0.1:3010/`（`restart-ion-dev-local.ps1`）。勿用 `:3001` 旧实例验收。

---

## 阶段 0 — 基线（本批已做）

- [x] `node scripts/dev-preflight.mjs` 通过
- [ ] 三断点截图入库 `docs/ui-audit-screenshots/current-*-375.png` 等（后续 capture 脚本）

---

## 阶段 1 — P0（本批执行）

| ID | 任务 | 文件 | 验收 |
|----|------|------|------|
| P0-1 | Dashboard 蜡烛图 | 已完成（`IonCandleChart`） | E2E `dashboard-market-chart` |
| P0-2 | **375 首屏 Swap 可达** | `DashboardPage.tsx` | `dashboard-mobile-tabs` 默认 Swap；375 无滚动见 Swap |
| P0-3 | **ProfileHub 接壳层** | `AppShell.tsx` | `profile-hub` + `wallet-panel`；E2E 钱包流 |
| P0-4 | **语言切换 UI** | `AppShell.tsx` | `lang-toggle` CN/EN |
| P0-5 | Burn/Bridge/AI API 图表 | 后续迭代 | 本批不阻塞 |

---

## 阶段 2 — P1（本批部分）

| ID | 任务 | 文件 | 验收 |
|----|------|------|------|
| P1-1 | 银河/背景已加强 | `AuroraGalaxyBackground` | 实机对比 |
| P1-2 | 厚霓虹 rim | `theme.css` / `NeonGlassCard` | hero rim |
| P1-3 | Swap **紧凑** 3D 品牌 | `IonDexBrandEmblem` + `SwapPanel` | logo 与 flip 分离 |
| P1-4 | 行情区球体层 | 后续 `MarketStage` | — |
| P1-5 | 顶栏钱包紫粉发光 | `AppShell` header | — |
| P1-6 | 侧栏头像行 | 后续 | — |

---

## 阶段 3 — P2

- 功能格 3D 图标资产
- Trade 375 Tab 细化
- `capture-ui-screenshots.mjs` 自动化对比 ref

---

## 本批交付物

1. 代码：Dashboard 移动 Tab、AppShell ProfileHub+语言、Swap 品牌区  
2. 工程：`npm run build` + `bash scripts/ui-round-verify.sh`（或 Windows 等价）  
3. 文档：`docs/ui-deliverable-self-audit-2026-05-22-iron-law-execution.md`  
4. 进度：`SESSION_STATE.md` / `docs/99-current-progress.md`

---

## 路由对照（避免看错页）

| URL hash | 页面 | Swap 品牌修复可见？ |
|----------|------|---------------------|
| `#/` | Dashboard | 是（移动 Tab「Swap」） |
| `#/swap` | Swap | 是 |
| `#/trade` | 专业交易台 | 否（无 Swap 中央区） |
