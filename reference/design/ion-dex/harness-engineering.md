# ION-DEX Harness 工程底座

## 后端 agent_harness.py
- IONHarnessEngine: security audit + Func compile + Blueprint test
- 安全审计: eval/exec/system/os./subprocess危险调用 > bounce检查 > gas估算
- CLI模式: stdin JSON listener

## 前端 UI Harness (三层)
1. Design Token Harness: src/lib/design-tokens.ts (13 colors + 6 typography + 3 button variants + inputs + grid)
2. 栅格底座: DEXGridHarness.tsx (gridTemplateColumns: 350px 1fr 300px)
3. 视觉审计: VisualAuditor.tsx (dev debug overlay 显示实时 Token 值)

## 工程铁律 (.cursorrules v3.1, 6章节)
- Zero-Visual-Discretion: 禁止自行决定颜色/阴影/间距
- Image-Asset-Strict: 3D图标用 <img> 加载，严禁 CSS/SVG 绘制
- Pixel-Perfection-Layout: 所有组件包裹 DEXGridHarness
- Verification Workflow: 输出代码前先输出布局意图分析

## 像素对齐五步闭环
1. Physical Asset Extraction: Figma导出 → public/assets/icons/ webp
2. Visual Constitution: Design Tokens 扩展间距/尺寸
3. Mandatory Grid Constraints: CSS Grid + grid-template-areas
4. Feedback & Iteration: Token级参数修正
5. Automated Visual Regression: Playwright 截图 → pixelmatch diff <2%
