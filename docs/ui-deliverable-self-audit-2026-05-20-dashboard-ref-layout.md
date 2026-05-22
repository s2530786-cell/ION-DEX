# UI 交付自检 — Dashboard 参考图布局（2026-05-20）

## 范围

- 分支：`cursor/ui-design-workflow-44c9`
- 对照：`docs/ui-audit-screenshots/ref-074a2.png`、`docs/10-ui-design-route.md`、`.memory-bank/overall-design-framework.md`

## 实现摘要

| 项 | 状态 | 说明 |
|---|---|---|
| Dashboard 首行 Swap + 右侧 TVL/APR/Burn | 已落地 | `SwapPanel`（`dashboard-swap-*`）+ `RightStats` |
| Dashboard 次行 Market 图 + Order book | 已落地 | `MarketStage` + 共享 `OrderBookPanel` |
| Dashboard 底行功能格 | 保留 | `FeatureGrid` 六卡 |
| 桌面顶栏 pill 导航常驻 | 已落地 | 移除 `lg:hidden`，与侧栏并存 |
| 侧栏 Online+ 钱包入口 | 已落地 | `sidebar-wallet-chip` |
| Swap 页复用面板 | 已落地 | `SwapPanel` + `SwapPage` 薄包装 |
| Trade 盘口复用 | 已落地 | `OrderBookPanel` 从 `BusinessPages` 抽出 |

## 工程验证

- `bash scripts/ui-round-verify.sh`：**通过**
- Playwright：**16/16 passed**
- `npm run build`：**通过**（修复 `GlassPanel` 导入路径）

## 视觉门禁（诚实结论）

- **未宣称**与 `ref-074a2.png` 像素级一致。
- 已缩小结构差距：主屏内嵌 Swap、右侧统计、行情+盘口、底栏功能格、大屏顶栏 pill。
- 仍待迭代：侧栏头像区与 ProfileHub 统一、Dashboard 与 Swap 页 hero 文案层级、K 线专业度、假数据页面（Burn/Bridge/AI）图表真实源。

## 截图

- 更新：`docs/ui-audit-screenshots/current-dashboard.png`（及 swap/trade/pool 若已跑 `capture-ui`）

## 下一轮建议

1. 1440px 下对照 ref 微调 Swap 卡宽度与 Market 区高度比例。
2. `ProfileHub` 接入侧栏/顶栏钱包，去掉重复 shell。
3. P0 数据面：Desk 假图表换 API 驱动（见 `ui-deliverable-self-audit-2026-05-22-p0.md`）。
