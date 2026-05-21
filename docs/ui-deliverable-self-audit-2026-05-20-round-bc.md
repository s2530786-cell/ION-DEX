# ION DEX UI 自检 — 连续轮次 B/C（玻璃统一 + 浏览器对比）

| 字段 | 内容 |
|------|------|
| 日期 | 2026-05-20 |
| 分支 | `cursor/ui-design-workflow-44c9` |
| 参考图 | `docs/ui-audit-screenshots/ref-*.png` |
| 当前截图 | `docs/ui-audit-screenshots/current-*.png` |

## 结论

- **工程**：`verify-full` 绿灯，Playwright 16/16（轮次 B 后）
- **视觉**：**仍未通过**「与设计图一模一样」— 布局/3D 图标/部分页面构图仍不同
- **进展**：全站 `NeonCard` 已统一厚霓虹玻璃 rim；壳层透光；Swap 中央 ION 标识；截图对比流水线已建立

## 浏览器对比记录

| 页面 | 参考 | 当前 | 差距 |
|------|------|------|------|
| Dashboard | ref-074a2 | current-dashboard | 功能格 rim 接近；背景仍偏暗于参考 |
| Swap | ref-074a2 | current-swap | 已加中央 logo；宽度仍窄于参考全宽 Swap |
| Trade | ref-6b487 | current-trade | 有 K 线组件；密度仍低于参考 |
| Pool | ref-fe840 | current-pool | 玻璃 rim 改善；侧栏构图不同 |

## 下一视觉轮（未停）

1. Swap/Dashboard 布局向参考图全宽三栏靠拢
2. 3D 功能图标资产替换 Lucide
3. P0 Burn/Bridge/AI 图表 API 化
4. **100-pass**：`bash scripts/verify-100.sh 100` 全绿后结束
