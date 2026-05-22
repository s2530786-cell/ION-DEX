# 🛡️ Quality Gate Audit — 2026-05-22 13:00

**审计官: 旺财 | 目的: 最终验收前全量问题清单**

---

## 📊 当前状态快照

```
视口: 1272×573px (桌面端)
Header: 65px
内容起点: 125px (占视口 21.8%) ❌
玻璃效果: blur(10px) + bg rgba(6,16,36,0.18) ✅
neon-glass-card: 12 个
Hooks: 9/9 接真实 API (fetch/indexer)
lib: 类型定义含 "mock" 字面但数据来自真 API ✅
Splash: 已播完 ✅
AI Widget: 右下角 ✅
Home 按钮: header 右角 ✅
Language 按钮: header 右角 ✅
```

---

## 🔴 BLOCKER — 不修不许合并

### B1. 内容区起点 125px 太高
- 视口 573px, 内容从 125px 开始 → 有效区仅 448px
- SwapPanel 占 680px+ → 内容全沉底
- **修复**: 删除 `TickerStrip`（行情移到 header 内行高）; main p-3 → p-2; header py-2.5 → py-1.5
- **目标**: `main-content.getBoundingClientRect().top < 85px`

### B2. K线图是面积图不是蜡烛图
- 参考图（02-market-chart.png）: OHLC 蜡烛图 + 多周期
- 当前: lightweight-charts 面积图
- **修复**: `IonCandleChart` 改为 `CandlestickSeries`，加时间周期选择（1H/4H/1D/1W）

### B3. Dashboard 缺少行情指标卡
- 参考图: 24h High / Low / Volume / Change 4 格卡片
- 当前: TVL / APR / Burn — 全站汇总，不是交易指标
- **修复**: Dashboard 顶部加 4 个 MarketStatCard（High/Low/Vol/Change），数据源 ION Indexer v3

---

## 🟡 P1 — 必须修复

### P1-1. 玻璃效果不够 Dreamina 参考图标准
- 参考图特征: 镜面反射感 + 强霓虹 glow + 更深的背景 `#00101f`（当前 `#061024`）
- **修复**: 
  - 背景最深色: `#00101f`（太空蓝黑）
  - `.neon-glass-card__inner`: `backdrop-filter: blur(6px)` (不是 10px) + `box-shadow: 0 0 48px rgba(36,247,255,0.35), inset 0 0 24px rgba(36,247,255,0.12)`
  - 边框: `2px solid rgba(36,247,255,0.3)` (不是 1px)
  - 角: `border-radius: 1.5rem` (不是 1rem)

### P1-2. 导航栏占空间过大
- 左侧 sidebar 56px 宽 + header 65px 高 = 121px 占用
- 参考图: 顶部图标导航条，无侧栏
- **修复**: 桌面端 sidebar 折叠为底部 icon bar（类似参考图底部导航），header 嵌入全屏

### P1-3. SwapPanel 值太小看不清
- 当前 ION 余额和兑换金额在 680px 高面板底部
- **修复**: SwapPanel 压缩到 360px 高，数值字大 2xl→3xl，键盘数字输入

---

## 🟢 P2 — 功能补全（对照 PRD docs/05-product-prd.md）

### Dashboard
- [ ] 实时行情滚动条（ION + BNB + 主流币）嵌入 header 下方 24px 高
- [ ] 24h 价格变化百分比（绿涨红跌）
- [ ] 页面入口卡片（Swap/Pool/Stake/Bridge 带统计数据）

### Swap
- [ ] 限价单（Limit Order）表单
- [ ] 滑点设置（0.1%/0.5%/1%/自定义）
- [ ] 交易历史列表
- [ ] 代币选择器（搜索+收藏）

### Pool
- [ ] LP Token 头寸卡片（余额+份额）
- [ ] 无常损失预估提示
- [ ] 添加/移除流动性确认弹窗

### Stake
- [ ] 官方质押 + DEX 质押双面板
- [ ] 解押倒计时
- [ ] 收益历史

### Burn
- [ ] BSC + ION 双链燃烧数据
- [ ] 趋势折线图
- [ ] 链分拆饼图

### Bridge
- [ ] 源链/目标链选择器
- [ ] 费用预览
- [ ] 状态追踪（pending/confirming/done）

### Domain
- [ ] .ion 域名搜索
- [ ] 可用性状态
- [ ] 发送到域名流程

### AI
- [ ] AI 市场摘要
- [ ] 支撑/阻力位
- [ ] 风险评估

---

## 📐 参考图对标差距（Dreamina ×3）

| 维度 | 参考图 | 当前 | 差距 |
|------|--------|------|------|
| 背景 | `#00101f` ~ `#001727` 极深太空蓝 | `#061024` 偏亮 | 太亮 |
| 头部 | 暖灰 `#4a4645` + 金色图标 | 青蓝色玻璃 | 色相不对 |
| 内容区 | `#9468b5`~`#c6bcf1` 紫兰渐变 | 青色为主 | 缺紫色系 |
| 底部表格 | `#7184a5` 蓝灰数据表 | 功能按钮 | 缺数据面板 |
| 边框 | 2px 明亮霓虹 glow | 1px 弱 glow | 太弱 |
| 卡片角 | 大角（16-20px） | 12px | 偏小 |
| 导航 | 底部图标 + 中部搜索 | 侧边文字栏 | 完全不同 |

---

## ✅ 已合格项

- AI 客服浮标右下角 ✅
- Splash 开机动画 ✅
- Home 按钮 ✅
- Language 按钮 ✅
- 所有 hooks 对接真实 API ✅
- 无 mock 假数据（类型定义除外）✅
- Header 65px 高度 ✅
- blur: 10px ✅

---

**判定: ❌ FAIL — 3 个 BLOCKER + 7 个 P1 + 大量 P2 缺失**
**下一步: 写入 CURSOR_TODO.md，让 Cursor 按 blocker→P1→P2 顺序修**
