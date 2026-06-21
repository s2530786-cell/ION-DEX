# ION DEX — Product Requirements & Status

> 语言：与用户沟通一律使用**中文**。用户对像素级设计还原极其严格(Deep Space + Neon Cyber + Glassmorphism)。

## 原始需求 (Original Problem Statement)
构建完整的去中心化交易所(DEX)Web 应用 "ION DEX",共 16 个页面。
- 用户期望技术栈:React + TypeScript + Vite + Tailwind;Solidity(BSC)+ FunC(ION 链);Foundry + Vitest + Playwright。
- 视觉系统:Deep Space + Neon Cyber + Glassmorphism,3 列响应式栅格,**禁止 CSS 画图标**(使用提供的素材),像素级对齐设计模板。
- 需要 OKX Web3 特性 + MongoDB 后端。最终目标 ZERO mock。

## 当前技术栈实现 (实际)
- 前端:React (CRA) + JavaScript + Tailwind(为保证容器环境稳定,未切换到 Vite+TS)。
- 后端:FastAPI(`server.py`),目前提供 mock 行情/池子数据。
- 合约:Solidity(`DexSwap.sol` 等)+ FunC(`pool.fc`)占位结构。

## 已完成 (Implemented)
- 16 个 React 页面路由 + 基础布局 (Swap/Pool/Stake/Bridge/Dashboard/Domains/CopyTrade/TradePro 等)
- 全局 3D 毛玻璃 + 霓虹光效样式 (`index.css`)
- 20 张全球 3D 动态风景背景 + Ken-Burns/视差 (`BackgroundFX.js` + `ThemeContext.js`)
- 视频开机动画 BootSplash(跳过/声音控制)
- 自研 `NeonCandlestickChart`(替代 TradingView,用于 Swap 页)
- **[2026-06-21] Swap 页底部 5 个水晶立方卡重做对齐设计图**:
  - 重新生成 5 个真透明背景 3D 宝石(去除烤进 PNG 的棋盘格透明占位):Pool 青色八面体水晶 / Copy 紫色立方 / Bridge 蜂窝球 / Burn 青紫齿轮 / Domain 粉色齿轮
  - `QuickTiles.js` + `index.css` 重写为竖向毛玻璃面板:底部彩色径向辉光、粗霓虹渐变光边、玻璃顶部高光、宝石悬浮光晕 + 接触投影、粗体贴底标题
  - 截图自测通过

## 待办 / Backlog (优先级)
### P0
- [ ] 将 `NeonCandlestickChart` 应用到 `TradeProPage`(目前仅 Swap 页)
- [ ] 全站 16 页 E2E 测试(testing_agent),前后端
### P1
- [ ] 完整智能合约实现:Burn.sol(动态销毁)、FeeReceiver.sol、BSCVault.sol(3/5 多签)、router.fc、BridgeInbox.fc 等
- [ ] Foundry 10 项安全测试(重入、MEV 三明治、假币等)
- [ ] 16 个前端页面接入真实后端逻辑(移除 `server.py` mock)
- [ ] OKX Web3 特性补全:DCA、组合资产追踪、最优路由聚合
### P2
- [ ] 指导用户将代码推送到 GitHub(`s2530786-cell/ION-DEX`)— 使用 "Save to Github"
- [ ] (可选)技术栈对齐用户期望 Vite + TS

## 关键文件
- `/app/frontend/src/index.css` — 全局 3D/霓虹/毛玻璃样式中枢(已较大,后续可拆分)
- `/app/frontend/src/components/QuickTiles.js` — Swap 页底部 5 水晶卡
- `/app/frontend/src/pages/SwapPage.js` — Swap 主页面
- `/app/design_guidelines.json` — 设计规范
- 设计参考图:job 资产 `photo_2026-05-16_22-05-19.jpg` 等

## 项目健康
- Mock:智能合约、后端逻辑、TVL/行情数据。
- 第三方集成运行时:暂无。
