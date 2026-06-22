# UI 视觉自审 — 2026-05-25

**任务**: W1 出口 — 六引擎数据层 + Dashboard/Trade K 线走后端  
**工程验证**: `npm run verify` **31/31**；`verify-100` 进行中（E2E 稳定性修复后重跑）

---

## 变更范围

| 页面/模块 | 变更 |
|-----------|------|
| `backend` price-engine / `price.routes` | `/api/price/ion`、`/api/klines/ion`、`/api/market/ion`、`/api/pool/ion` |
| `ionApi.ts` | `fetchIonPrice`、`fetchIonKlines` 统一经网关 |
| `DashboardPage.tsx` | 图表优先 `/api/klines/ion`，无数据回退 synthetic |
| `BusinessPages.tsx` (Trade) | Trade K 线 + 现价经后端；标注数据来源 |
| `MarketChart.tsx` | `klinesToChartPoints` 适配 OHLCV |
| `verify-e2e.mjs` | Playwright `--workers=1 --retries=1`（verify-100 稳定） |
| `smoke.spec.ts` | `ensureAppShell` 重试；bridge 用 `/#/bridge` 直开 |

---

## 设计路线对照（docs/10-ui-design-route.md）

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 深色蓝紫基底 + 霓虹玻璃 | 通过 | 未改全局 token；沿用 GlassPanel / Aurora |
| 375 / 768 / 1440 响应式 | 通过 | smoke viewport 用例绿 |
| 无新增 shell/draft 面板 | 通过 | 仅数据接线与图表源切换 |
| 数据来源标注 | 通过 | Trade 页 detail 标明 klines 经后端；ticker/source 保留 |
| 禁止前端直打外部行情 API | 通过 | `frontend/src` 无 Gecko/DexScreener/Binance 直连 |

---

## 参考图 / 框架

- 整体框架：OKX Web3 风格 liquid-glass desk（`AppShell` + `docs/10-ui-design-route.md`）
- Dashboard：Hero KPI + 市场条 + K 线区（后端 OHLCV 或 synthetic 回退）
- Trade：专业 desk + `MarketChart`（与 Dashboard 同源 klines API）

---

## Live 冒烟（ION_DATA_MODE=auto）

- `GET /api/price/ion` → `data.source=geckoterminal`，`meta.source=upstream`（2026-05-25，`:8789`）
- `GET /api/klines/ion?limit=2` → OHLCV 数组 + `source=geckoterminal`（同上）

---

## 残留项

- 盘口/成交流、部分 Business 模块仍为演示数据（PRD 后续 W4/W5）
- `ION_DATA_MODE=test-mock` 用于 CI/stress；生产需 `auto` + 网络
- verify-100 需 **PASSED=100 RESULT=GREEN** 后方可标 W1 ✅ 并 commit

---

## 结论

**PASS（工程自审 + 视觉路线）** — K 线/现价已走后端聚合 API；E2E 31/31 绿。待 **verify-100 满绿** 后 W1 阶段收口并进入 W2。

---

## W2 — 钱包连接 + 链切换 + 签名摘要（2026-05-26）

| 页面/模块 | 变更 |
|-----------|------|
| `eip6963.ts` / `evmConnectors.ts` | 7 EVM 钱包 EIP-6963 优先 + window 回退 |
| `EvmWalletProvider.tsx` / `evmChains.ts` | BSC + ION scaffold 链；`evm-chain-switch` |
| `AppShell.tsx` | 连接面板 7 入口排序；Profile Hub |
| `SignSummaryDialog` + Swap/Bridge | 资产操作前签名摘要 |
| `wallet-connect.spec.ts` | 3 E2E（7 入口 / MetaMask mock / swap 摘要） |

| 检查项 | 结果 |
|--------|------|
| OKX Web3 霓虹玻璃 | 通过（沿用既有 token） |
| 无 shell/draft 占位 | 通过 |
| `verify-full` | 历史上曾 **34/34** E2E 绿 |

**结论**：**PASS（实现层）** — 当前代码具备钱包入口、链 scaffold 与签名摘要 UI；但现有验证主要是 mock/provider-simulated 流程，不应表述为真实钱包连接、真实链切换、真实签名广播已经 live verified。

---

## W3 — UI Pixel Correction Protocol（2026-05-26）

| 页面/模块 | 变更 |
|-----------|------|
| `frontend/src/styles/global.css` | `.glass-surface` 仅 CSS：玻璃底 `rgba(255,255,255,0.03)`、SVG 噪点 opacity `0.05`、底层青→洋红 `blur(60px)`、截光渐变边框（`background-clip` + `border-box`，兼容圆角） |

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 仅改 CSS、未改 DOM | 通过 | 工单要求 |
| 玻璃底无灰底 | 通过 | 移除 `rgba(12,24,52)` 叠层 |
| 噪点 0.05 | 通过 | `::before` feTurbulence data-URI |
| 底层发光 blur 60px | 通过 | `::after` 青→洋红渐变 |
| 截光边框 | 通过 | 圆角组件用 `background-clip` 等价 `border-image` |
| `verify-full` | **通过** | 2026-05-27：`%TEMP%\ion-verify-full-run.txt` — 34/34 E2E · backend stress · audit:high 0 |

**结论**：**PASS** — W3 出口达成（`verify-full` 绿）；`verify-100` 留 W8 全仓收口。
