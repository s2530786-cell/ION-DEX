# Cursor 整合指令：豆包 Vue 模板 → 现有 React 工程

## 任务目标
将豆包生成的 ION DEX Vue3+TS+Tailwind 前端 UI 模板的分析结果，整合到现有 **React + TypeScript + Vite** 主工程中。

## 现有工程信息
- **项目根**: `D:\openclaw-tools\ion-dex-nuke\`
- **前端目录**: `frontend/`
- **技术栈**: React + TypeScript + Vite + Tailwind CSS
- **现有组件目录**: `frontend/src/components/` (包含 background, charts, data, ion, layout, ui, wallet)
- **现有页面**: `frontend/src/pages/` (BridgePage, BusinessPages, DashboardPage, PoolPage, StakePage, SwapPage)
- **样式**: Tailwind CSS + 自定义 CSS 变量

## 现有视觉体系（保留！不要改！）
```
colors: {
  ion: {
    cyan: "#24f7ff",
    blue: "#2563ff",
    violet: "#8d4dff",
    magenta: "#ff3bd4",
    gold: "#ffd166",
    ink: "#061024",
  },
}
```
不要替换成豆包生成的那套配色（#00ffff / #ff00ff / #00ff88 / #ff0088）。

## 核心理念（设计哲学）
豆包模板的核心价值在于：
1. **毛玻璃（Glassmorphism）** — backdrop-blur + 半透明背景 + 边框光效
2. **霓虹文字/边框** — text-shadow / box-shadow 发光效果
3. **流光动画边框** — @keyframes gradientFlow
4. **极光星空背景** — 多层渐变 + 浮动动画
5. **ECharts 图表** — K线、销毁趋势、面积图
6. **组件化思路** — 弹窗、钱包选择、交易组件、通用骨架/空状态

## 🔴 硬性约束（必须遵守）

### 1. 保留 FunC 合约架构
ION 链基于 TON 技术栈，不是 EVM。所有合约工具类、ABI、RPC 调用必须保留现有的 FunC/TON 架构：
- 不要引入 ethers.js
- 不要写 EVM 风格的合约调用（approve/allowance/swapExactTokensForTokens）
- 保留现有的 sendBoc / JSON-RPC 调用方式

### 2. 不要迁移技术栈
- 不要把 React 项目改成 Vue
- 不要新开 Vue 项目
- 所有整合必须在现有 `frontend/` 目录下进行

### 3. 不要替换现有视觉体系
- 保留现有的 `#24f7ff` 青 / `#2563ff` 蓝 / `#8d4dff` 紫 / `#ff3bd4` 品红 / `#ffd166` 金
- 可以从豆包模板吸收：毛玻璃、流光边框、霓虹效果、星空背景的实现思路
- 但不要替换 tailwind.config.js 中的 colors 定义

### 4. 豆包模板中不可直接复用的部分
- ❌ `contract.ts`（ethers.js + JsonRpcProvider）— ION 链不用
- ❌ `DEX_ROUTER_ABI`（Uniswap V2 风格）— ION 链不同
- ❌ `ERC20_ABI` — TON 链 Jetton 标准不同
- ❌ `wallet.ts` Pinia store — 我们已有 React Context / hooks
- ❌ ION chainId 写死 `12345` — 需要确认实际值

## 具体要求

### 第一阶段：分析并输出差异报告
1. 读取豆包模板的关键文件（tailwind.config.js, global.css, 所有 .vue 组件）
2. 与现有 `frontend/` 工程做对比分析
3. 输出一份差异报告，说明哪些可以吸收、哪些不可用、哪些需要改造

### 第二阶段：视觉提升（在现有 React 工程中实现）
汲取豆包模板中的视觉优点，应用到现有 React 页面：
1. **毛玻璃效果** — 给主要卡片、面板添加 backdrop-blur + 半透明背景
2. **霓虹发光效果** — 使用现有配色实现 text-shadow / box-shadow glow
3. **流光边框** — 实现 gradient border animation（用现有的 ion 配色）
4. **加载骨架屏** — 实现 LoadingSkeleton 组件
5. **空状态占位** — 实现 EmptyData 组件
6. **通用提示弹窗** — 实现 ModalTip 组件

### 第三阶段：业务页面完善
1. 检查当前页面是否缺少豆包模板中有的功能模块（限价单、跟单、域名管理、销毁详情、流动性挖矿、设置页等）
2. 对缺少的模块，在现有 React 工程中按 React 风格实现

### 第四阶段：手续费模型落地
- 总 Swap 手续费：0.3%
- LP 65% / 开发者 25% / 国库 10%
- 质押 0%（已砍掉）
- 只收 ION 作为手续费
- 合约层写死，不可改

## 与 Cursor 交流的注意事项
- 不要问"要不要保留 Vue 代码" — 答案是不保留，只吸收设计思路
- 不要问"要不要用 ethers.js" — 答案是不用
- 不要问"要不要用 Pinia" — 答案是不用
- 现有工程中的 AGENTS.md / rules / memory-bank 等文件是工程规范，不要删除

## 输出要求
- 直接在 `frontend/` 目录下修改现有文件
- 新增组件放在 `frontend/src/components/` 下对应子目录
- 保证编译通过（`npm run build` 无报错）
- 输出完成后写一份变更摘要
