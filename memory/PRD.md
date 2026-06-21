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

- **[2026-06-21] 代码评审修复**:
  - 🔴 修复 6 处 React Hook 缺失依赖(useCallback 包裹 load/loadPos/loadOrders + chart useMemo 让 `tf` 成为真实依赖)— eslint react-hooks 现 0 警告
  - 🟡 索引 key 替换为稳定 key:DashboardPage(`h.day`)、BatchTransferPage(行 `id`,已验证增删/输入状态正确)、TradeProPage 订单簿(按 price)
  - 🟢 backend `server.py` 全部函数补充返回类型注解(无 def 缺注解);console 语句:src 内本就为 0
  - 未做:🟡 拆分 17 个长函数 / 降低 6 个函数复杂度 —— 多为内聚的工作函数(如 canvas 绘图、seed 数据),盲目拆分对设计敏感的可用应用有回归风险,留待用户按需指定

- **[2026-06-21] 全站赛博霓虹换肤(按 Master 设计规范,作用于 16 页)**:
  - 设计令牌化:`index.css :root` 替换为规范色值 — bg `#050811→#0B1220` 渐变、cyan `#00F5FF`、purple `#9D4EDD`/deep `#7B2CBF`、magenta `#FF007A`、blue `#3A86FF`、主文 `#FFFFFF`、副文 `#8A99AD`;新增 `--shadow-glass-cyan/magenta`、`--neon-glow` 玻璃阴影令牌
  - 字体:引入 Orbitron,仅用于 Logo/导航/标题(`--font-display`),正文 Sora、数字 JetBrains Mono(可读性优先)
  - 背景层(bgfx 极光/网格/霓虹叠加)、滚动条、选区、面板内发光统一到新霓虹色
  - K 线 `NeonCandlestickChart`:涨 `#00F5FF` / 跌 `#7B2CBF`,MA25 `#9D4EDD`
  - 截图验证 Swap/Dashboard/Stake/BatchTransfer 多版式渲染正常;5 张水晶卡保持竖版不倾斜(用户确认)
  - 备注:SkinSwitcher 备用皮肤(aurora/nebula 等)保留;默认 deepspace 即新规范

- **[2026-06-21] 霓虹模态弹窗(按规范)**:
  - 新增可复用 `Modal.jsx`(玻璃拟态 + cyan→purple→magenta 渐变光边 + 背景模糊 + ESC/点遮罩关闭 + portal)
  - `NeonAreaChart.jsx`:SVG 面积图,青→品红垂直渐变填充 + 发光描边 + 数据点 + 日期轴
  - `BurnTrackerModal.jsx`(760):总销毁/今日销毁大字 mono、市场阶段/动态销毁率徽章、7 日面积图、今日 vs 目标进度条、跳转 /dashboard
  - `QuickBridgeModal.jsx`(640):源⇄目标链选择+翻转、代币、金额、实时费率(费=量*0.1%+0.5,已验证)、Transfer、跳转 /bridge
  - 触发:底部 5 卡的 **Burn → Burn Tracker**、**Bridge → Quick Bridge**(Pool/Copy/Domain 仍跳转);截图交互验证通过
  - `NeonGauge` 渐变同步到新霓虹色

- **[2026-06-21] 模态"一键分享/截图"自传播功能**:
  - 依赖:`html-to-image`(toPng,`skipFonts` 静默跨域字体告警);`lib/share.js`(下载/原生分享/X/Telegram/复制)
  - `ShareableBurnCard.jsx`:620×360 霓虹分享卡(ION DEX 品牌 + 总销毁大字 + 今日/价格/动态销毁率 + sparkline + iondex.app)
  - `ShareableBridgeCard.jsx`:跨链宣传卡(ION→BSC→ETH + 低费/MEV/非托管卖点)
  - `ShareMenu.jsx`:lucide 图标按钮(原生分享带图[移动端]/保存图片/X/Telegram/复制文案),sonner toast 反馈
  - 接入 Burn / Bridge 模态(分享视图 + 返回);截图验证 PNG 下载成功、控制台无报错
  - 注:导出 PNG 因 Google Fonts CORS 用系统回退字体(屏显卡片仍为 Orbitron/Mono);如需导出字体完全一致,后续可自托管字体

- **[2026-06-21] 推荐返佣系统(自传播增长闭环)**:
  - 后端:`POST /api/referral/bind`(幂等绑定 referrer→referee)、`GET /api/referral/stats`(邀请数/累计返佣/邀请记录/上级)、`do_swap` 中按手续费 10% 给上级自动返佣;`referrals` 集合;curl 实测返佣计算正确
  - 前端:`WalletContext` 捕获 URL `?ref=`(localStorage 持久化)→ 连接钱包后自动 `referralBind`;`lib/api.referralLink(address)`
  - 分享卡(Burn/Bridge)新增 `QrBlock`:专属邀请二维码(qrcode.react)+ 邀请码(地址后 6 位),分享文案/链接带 `?ref=钱包地址`
  - `DashboardPage` 新增"邀请返佣 · Referral Rewards"面板:邀请链接+复制、二维码、邀请人数、累计返佣、邀请记录
  - 依赖:`qrcode.react`;验证:后端 curl 闭环 ✓、分享卡 QR+邀请码截图 ✓、钱包绑定 ✓、面板渲染 ✓
  - 注:已连接态 Dashboard 面板因无头浏览器下拉导航限制未截图,复用同套已验证组件

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
