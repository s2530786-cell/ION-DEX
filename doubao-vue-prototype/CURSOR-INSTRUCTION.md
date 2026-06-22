# ION DEX 前端工程 — 发给 Cursor 的精装包

## 代码位置
全部文件在 `D:\openclaw-tools\ion-dex-nuke\doubao-vue-prototype\`

## 当前状态
- ✅ 依赖已装（npm install 完成）
- ✅ TypeScript 编译零错误（vue-tsc --noEmit）
- ✅ Vite build 通过（594 modules, 11.32s）
- ⚠️ 已有完整页面骨架，但视觉是平面 2D，业务逻辑是 placeholder

## Cursor 执行指令

### 你的最终输出目标
交付一版可编译、可运行的 **Vue3 + TypeScript + Tailwind CSS + ECharts** ION DEX 前端工程。部署到 `doubao-vue-prototype/` 目录下，确保 `npm run dev` 和 `npm run build` 都能过。

### 技术栈（严格保留）
- Vue 3 + Composition API (`<script setup lang="ts">`)
- TypeScript (strict mode)
- Tailwind CSS (CDN 内联 + config 扩展)
- ECharts 5
- Pinia (钱包状态管理)
- Vue Router 4
- ethers v6 (合约交互工具)
- Vite 5 构建

### 视觉风格要求（必须坚守，只强不弱）
**重点：这不是普通赛博玻璃风 dashboard。最终目标是 3D 立体空间首页。**

配色系统保持：
- `#0a0a12` 深空黑底
- `#00ffff` 青色霓虹
- `#ff00ff` 紫色霓虹
- `#00ff88` 绿色霓虹
- `#ff0088` 粉色霓虹

CSS 特性必须保留并强化：
1. `ion-glass` — 毛玻璃效果（backdrop-filter: blur(16px) + rgba(255,255,255,0.04) 背景）
2. `ion-liquid-border` — 流动渐变边框（伪元素 + 旋转渐变动画）
3. `ion-neon-*` — 霓虹光晕文字（text-shadow + 对应色）
4. `ion-hover-card` — 悬浮升高 + 阴影 glow

### 首页必须实现的 3D 空间效果（这是核心）
**不要只做背景特效。要让首页主卡片、图表区、数据面板本身有空间感。**

必须实现：
- 使用 `perspective` + `perspective-origin` 在页面容器
- 三栏布局加不同 `translateZ` 值（左面板 z=-20px, 中间面板 z=0, 右面板 z=+10px）
- 底部功能按钮做 `rotateX(8deg)` 轻微俯视倾斜
- 每个 `ion-hover-card` 悬浮时增加 `scale(1.02)` + `translateY(-6px)` + 更强的 glow box-shadow
- 背景极光用多层 blur 实现深度层次（前/中/后景 blur 值不同）
- 页面整体像漂浮在深空中的赛博控制台，不是平面贴图

### 需要修复/补齐的内容
1. **HeaderNav.vue** — `Connect Wallet` 按钮绑 `WalletSelect` 弹窗显隐（状态在 store 里已有 `walletModalVisible`）
2. **IonDexIndex.vue** — 底部 Pool/Bridge 按钮绑对应的 Modal；Copy Trade / Burn / Domain 按钮加路由跳转 `router.push('/copy-trade')` 等
3. **所有页面** — 加 `.page-container { perspective: 1200px; }` 实现 3D 空间容器
4. **global.css** — 补 `.ion-glow-cyan { box-shadow: 0 0 20px rgba(0,255,255,0.15); }` 等各色 glow 工具类
5. **ECharts 图表** — 所有图表的 `tooltip` 和 `grid` 已配好，不要改动，但要确认 `onUnmounted` dispose 完整
6. **PageMeta** — 所有页面加 `<title>` 或动态标题 (IonDexIndex → "ION DEX", CopyTrade → "Copy Trade" 等)

### 允许保留的 demo 数据
- TVL、APR、销毁量等统计数据：保留 mock 值（用真实格式，值可随意）
- 图表数据：保留 mock 折线数据（风格要对，值可随意）
- 钱包连接：**不要**接入真实 MetaMask/其他钱包 SDK，保持 UI 可交互即可
- 合约调用：**不要**接入真实链上调用，保持工具函数定义好就行
- 路由切换：保留 mock 页面切换，不需要动态数据加载

### 文件清单（供参考）
| 路径 | 内容 |
|------|------|
| `index.html` | HTML 入口，CDN tailwind |
| `tailwind.config.js` | ion 配色 + 5 组 animation |
| `vite.config.ts` | @ 别名 |
| `tsconfig.json` | TS 严格模式 |
| `src/main.ts` | 应用入口 |
| `src/App.vue` | `<router-view>` |
| `src/router.ts` | 6 条路由 |
| `src/assets/style/global.css` | 全局样式 + 工具类 |
| `src/components/BackgroundBg.vue` | 极光 + 星空背景 |
| `src/components/HeaderNav.vue` | 顶部导航栏 |
| `src/components/PoolModal.vue` | 流动性池弹窗 |
| `src/components/BridgeModal.vue` | 跨链桥弹窗 |
| `src/components/BurnPanel.vue` | 销毁数据面板 |
| `src/components/Common/EmptyData.vue` | 空数据占位 |
| `src/components/Common/LoadingSkeleton.vue` | 加载骨架屏 |
| `src/components/Common/ModalTip.vue` | 通用提示弹窗 |
| `src/components/Wallet/WalletSelect.vue` | 钱包选择弹窗 |
| `src/components/Wallet/WalletAsset.vue` | 钱包资产面板 |
| `src/components/Trade/LimitOrder.vue` | 限价交易面板 |
| `src/components/Trade/TradeHistory.vue` | 交易记录表格 |
| `src/views/IonDexIndex.vue` | 首页（核心页面） |
| `src/views/CopyTrade.vue` | 跟单交易页 |
| `src/views/DomainManage.vue` | 域名管理页 |
| `src/views/BurnDetail.vue` | 销毁详情页 |
| `src/views/LiquidityMine.vue` | 流动性挖矿页 |
| `src/views/SettingPage.vue` | 系统设置页 |
| `src/stores/wallet.ts` | Pinia 钱包状态 (chainId=997) |
| `src/utils/contract.ts` | ethers v6 工具函数 |
| `src/constants/abi.ts` | ERC20 / DEX / Burn ABI |

### 验收标准
1. `npm run dev` 能打开页面
2. `npm run build` 编译打包通过
3. 首页有三栏布局：左 Swap → 中 K线 → 右 TVL/APR/Burn 面板
4. 首页底部 5 个功能按钮点击有反应（弹窗或路由跳转）
5. 弹窗能打开、关闭，交互流畅
6. 首页有明显 3D 空间感（不是平面）
7. 所有组件保持极光谱 + 深空风格
