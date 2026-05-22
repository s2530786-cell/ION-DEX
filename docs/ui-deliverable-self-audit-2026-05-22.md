# ION DEX UI 交付自检报告 — P0 首页 3D / 头像收口 / 实时数据 / AI

> 铁律见 `docs/11-ui-visual-self-audit-gate.md`。

---

## 元信息

| 字段 | 内容 |
|------|------|
| 日期 | 2026-05-22 |
| 分支 / PR | 工作区未提交（用户未要求 commit） |
| 任务范围 | React 主工程：Dashboard P0 3D 主视觉、Profile/头像收口、实时 API 数据、AI 板块、375 移动端 E2E |
| 执行人 | Agent |
| 参考图路径 | Vue 参考仅视觉方向；`docs/10-ui-design-route.md` |
| 当前实机 | `npm run verify` 预览随机端口；本地 `npm run dev` → `:3000` |
| 对照框架 | `docs/10-ui-design-route.md`、`.memory-bank/overall-design-framework.md` |

---

# 第一部分：思考过程（工作记录）

## A1. 任务理解

- 用户原始诉求：禁止迁 Vue；首页最上方霓虹球效果融入主卡/图表/数据区（前中后景 + z-depth）；头像区按既定 ProfileHub 方案收口；禁止假数据；AI 按昨日方案；验证不过不算完成。
- 隐含成功标准：工程 `verify-full` 全绿 + 视觉方向与 OKX Web3 霓虹玻璃一致 + blocker 明示。
- in-scope：Dashboard、`AppShell`、AI desk、`AIMarketPanel`、E2E 375px。out-of-scope：Bridge/Stake 等 desk 的 mock 语义清理（preflight WARN 仍在）。

## A2. 信息收集

| 来源 | 要点 |
|------|------|
| `docs/10-ui-design-route.md` | 深蓝紫底、霓虹 rim、玻璃 HUD、银河动效 |
| `frontend/src/pages/DashboardPage.tsx` | `DepthScene` + `NeonOrbHero` + 悬浮 stat/book 面板 |
| `frontend/src/components/layout/AppShell.tsx` | `HeaderProfileChip`、`SidebarIdentityRow`、`ProfileHub` |
| `frontend/src/pages/BusinessPages.tsx` | `useAiDeskData`、`DataBlockerBanner` |
| `backend` API | tickers、swap-stats、candles、quote、staking/burn 等 |
| 验证 | `scripts/verify-full-save-log.cmd --no-pause` → ERRORLEVEL=0 |

## A3. 对照与推理步骤

1. 将 Vue 参考的「顶部光球」落为 `NeonOrbHero`（CSS 多层 orb + ring），置于 `DepthScene` 后景，前景为 swap/图表卡。
2. 统计卡、盘口、AI pulse 使用 `dashboard-stat-float` / `dashboard-float-panel` 做 translateZ 悬浮。
3. 顶栏钱包下拉改为 `HeaderProfileChip` → `ProfileHub`；侧栏 `SidebarIdentityRow`。
4. Dashboard/AI 接 `fetchMarketTickers`、`useSwapDeskData`、`useAiDeskData`；无 `/api/ai` 推理时展示 `DataBlockerBanner`。
5. 375 E2E：根因为 `mobile-brand-strip` 的 `min-w-0` 在 flex 中被压成 0 宽 → 改为 `shrink-0`；测试用独立 375 context。

## A4. 关键判断

- **P0**：首页分层 3D、头像收口、实时 ticker/swap、AI blocker 明示 — 已做。
- **P1**：Trade K 线全 live 图、Bridge/Stake mock 文案清零 — 未在本批完成（preflight WARN）。
- **P2**：参考图像素级对齐、Playwright 视觉回归截图 — 缺参考 PNG 附件。

## A5. 纠偏与工具局限

| 现象 | 处理 |
|------|------|
| 375 测试 `mobile-brand-strip` hidden | UI `shrink-0` + E2E `browser.newContext({ viewport: 375 })` |
| `npm audit` EOVERRIDE | `tailwindcss` devDependency 钉死 `3.4.19` 与 overrides 一致 |
| Playwright 默认 1536 viewport | 仅影响未改 context 的用例；375 用例已隔离 |

## A6. 工程验证 vs 视觉门禁

- **工程验证**：通过 — `verify-full-save-log.cmd`（encoding、backend、frontend build、16/16 E2E、audit:high 0 vuln）。
- **视觉门禁**：有条件通过 — 结构与分层达标；无用户提供的最新参考 PNG 做像素级 diff。
- **能否宣称「UI 完成」**：P0 本批可交付；全站视觉 parity 与 ION_UI_STRICT 债务清零另开任务。

---

# 第二部分：自检结论（审计交付）

## B1. 结论摘要

React 主工程已完成 P0 首页 3D 主视觉融入、Profile/头像收口、Dashboard/AI 实时 API 接线及 blocker 横幅；工程验证全绿（含 375px E2E）。

## B2. 总体差距矩阵

| 类别 | 成品/框架要求 | 当前实现 | 差距等级 |
|------|---------------|----------|----------|
| 银河/极光背景 | 有 | `AuroraGalaxyBackground` | 低 |
| 4D 液态玻璃 | 有 | `glass-hud-*`、`neon-glass-card` | 低 |
| 厚霓虹边框 | 有 | swap/卡片 rim | 低 |
| 3D 主视觉 | 球体融入主舞台 | `NeonOrbHero` + `DepthScene` | 中（CSS 3D，非 WebGL） |
| K 线/行情图 | live | Dashboard candles API + provenance | 中（Trade 页另查） |
| 数据 provenance | 必须 | ticker/swap-stats 带来源；AI blocker | 低 |
| 组件语言统一 | Profile 新范式 | HeaderProfileChip / ProfileHub | 低 |
| 视觉回归基线 | 建议 | 无自动截图 diff | 高 |

## B3. 分模块差距

### B3.1 AppShell

- 现状：`HeaderProfileChip`、`SidebarIdentityRow`、`ProfileHub`；`wallet-connect` testId 保留。
- 差距：侧栏仍含 `AppShell` 命名与部分 legacy 未删代码（如未引用 `WalletConnectPanel`）。
- 优先级：P2 清理。

### B3.2 Dashboard（P0）

- 已改进：`dashboard-swap-stage`、`dashboard-market-stage`、`dashboard-hero-orb`、`dashboard-ai-pulse`；移动端 Tab Swap 首屏。
- 仍差距：与 Vue 参考的 WebGL 级球体质感可能有差距；xl 断点布局需实机肉眼复核 1440。
- 优先级：P1 视觉微调（有参考图时）。

### B3.3 AI

- 已改进：`AIMarketPanel` + `useAiDeskData`；`ai-market-service` blocker；E2E「AI Sentinel brief ready」保留。
- 仍差距：无流式 LLM `/api/ai` — 已 blocker，非静默假数据。
- 优先级：P1 后端推理 API。

## B4. 数据与合规红线

- [x] Dashboard ticker/swap-stats/candles 来自 API（失败时 UI 状态/error，非硬编码价）
- [x] AI 无假 confidence%；blocker 明示
- [ ] Bridge/Stake/Domain 等 desk 仍有 mock/draft 语义（preflight WARN，本批未改）
- [x] 无新增用户可见 shell/draft 面板（本批触摸面）

## B5. 工程验证 vs 设计验证

| 检查项 | 状态 |
|--------|------|
| encoding | OK |
| backend verify | OK |
| frontend verify (build + 16 E2E) | OK |
| audit:high | OK（0 vulnerabilities） |
| 375 / 768 / 1440 证据 | 375、768、1440 E2E 通过 |
| verify-full-save-log | OK（`%TEMP%\ion-verify-full.txt`） |

## B6. 后续建议（非阻塞）

1. 提供最新参考截图跑 `capture-ui` 做视觉 diff。
2. `ION_UI_STRICT=1` 分批清理 bridge/stake mock 文案。
3. 实现 `/api/ai` 后移除 `ai-market-service` blocker。

---

**签署**：工程验证通过；视觉门禁有条件通过（缺参考图像素对比）。
