# CURSOR TODO — Quality Gate Fixes (旺财验收 2026-05-22 13:00)

**Branch:** cursor/ui-design-workflow-44c9
**Audit:** docs/QUALITY-GATE-AUDIT.md
**判定:** ❌ FAIL — 3 BLOCKER + 7 P1

---

## 🔴 BLOCKER — 先修这三个，不修不许 v1

### B1. 内容区下移 125px → 目标 <85px
当前 `main-content.getBoundingClientRect().top = 125px` (视口 573px, 占 22%)
- [ ] `AppShell.tsx`: TickerStrip 删掉或移到 header 内部 1行高
- [ ] `AppShell.tsx`: main `p-3` → `p-2`
- [ ] `AppShell.tsx`: header `py-2.5` → `py-1.5`
- [ ] 验证: `document.querySelector('[data-testid=main-content]').getBoundingClientRect().top < 85`

### B2. K线是面积图 → 蜡烛图
- [ ] `IonCandleChart.tsx`: `AreaSeries` → `CandlestickSeries`
- [ ] 加时间周期选择按钮: 1H | 4H | 1D | 1W
- [ ] 数据源: ION Indexer v3 `/indexer/v3/ohlc`

### B3. Dashboard 缺行情指标卡
- [ ] 新建 `MarketStatCard.tsx`: 24h High / Low / Volume / Change
- [ ] Dashboard 顶部 4 格 grid (sm:2col lg:4col)
- [ ] 数据源: DexScreener or GeckoTerminal API

---

## 🟡 P1 — Blockers 修完接着修

### P1-1. 玻璃对标 Dreamina 参考图
- [ ] `theme.css` 根背景: `#00101f` (从 `#061024`)
- [ ] `.neon-glass-card__inner`: `backdrop-filter: blur(6px)` + `box-shadow: 0 0 48px rgba(36,247,255,0.35), inset 0 0 24px rgba(36,247,255,0.12)`
- [ ] 边框: `2px solid rgba(36,247,255,0.3)`
- [ ] 角: `border-radius: 1.5rem`

### P1-2. 导航栏布局对标
- [ ] 桌面端 sidebar 收缩为底部 icon bar (5 个必备: Swap/Chart/Pool/Stake/More)
- [ ] Header 中嵌入搜索框 + 页面标题

### P1-3. SwapPanel 紧凑化
- [ ] 高度: 680px → 360px
- [ ] 数值字号: `text-2xl` → `text-3xl`
- [ ] 去除非必要文字说明

---

## 🟢 P2 — 功能补全 (对照 PRD docs/05-product-prd.md)

### Swap 页
- [ ] 限价单 (Limit Order) 表单
- [ ] 滑点设置 0.1%/0.5%/1%/自定义
- [ ] 代币搜索选择器

### Pool 页
- [ ] LP Token 头寸卡片
- [ ] 无常损失预估
- [ ] 添加/移除流动性弹窗

### Stake 页
- [ ] 官方质押面板 (stake.ice.io 数据)
- [ ] DEX 质押面板
- [ ] 收益历史列表

### Burn 页
- [ ] BSC + ION 双链燃烧双面板
- [ ] 趋势折线图
- [ ] 链分拆饼图

---

**执行顺序: B1 → B2 → B3 → P1-1 → P1-2 → P1-3 → P2 (从左到右)**

---

## 🟡 P1-4: AI 客服交互对话 (12:36 Master 要求)

**当前:** 6 条硬编码 Q&A
**要求:** 用户自定义输入问题 → 后端 AI 回答

- [ ] 输入框 + 发送按钮
- [ ] 对话历史 (气泡样式，用户/助手分左右)
- [ ] 后端 `/api/ai/chat` 端点 → 调用 OpenAI-compatible API
- [ ] 流式响应 (SSE typing indicator)
- [ ] 上下文：读取 Dashboard 当前数据 (TVL/APR/价格) 作为 system prompt
- [ ] 打字动画 + 自动滚动到底部
- [ ] 清除对话按钮
