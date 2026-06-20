# 全自动前端流水线

## 组件
- Next.js 16.2.9 + Turbopack → localhost:3000
- Playwright Chromium 149 + pixelmatch → 像素对齐 diff <2%
- Cursor Agent CLI → 非交互模式派发任务

## 已部署验证
- 5/5 页面 HTTP 200: index/swap/pool/stake/bridge
- 5/5 baselines 在 .visual-screenshots/
- 5/5 diff PASS: 0.00% pixel difference

## 监控指标
- 每页渲染时间 < 3s
- Visual diff < 2%
- TypeScript 零报错
- bundle size < 200KB per route
