# 🎨 P2-TASK-005: UI 打磨 + 响应式适配

## 优先级
🟨 P2 — 合约和数据层搞定后再做

## 目标
- 所有页面视觉统一 polished
- 移动端/桌面端 100% 响应式
- 错误处理 + Loading state 覆盖全页面

## UI 设计来源
Master 铁规矩：**所有前端 UI 参考 https://github.com/DavidHDev/react-bits**
> 不自己凭空设计，直接从 110 个组件里挑。

## Scope

### 1. Error Boundary + Loading State

每个数据请求页面必须包含：
```tsx
// Loading skeleton
function TradeLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-gray-800 rounded-md" />
      <div className="h-24 bg-gray-800 rounded-md" />
      <div className="h-10 bg-gray-800 rounded-md w-1/2" />
    </div>
  );
}

// Error display
function TradeError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <h3 className="text-red-400 font-medium">数据加载失败</h3>
      </div>
      <p className="mt-2 text-sm text-gray-400">{error.message}</p>
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
      >
        重试
      </button>
    </div>
  );
}
```

### 2. 响应式适配

Tailwind breakpoints 用法：
```tsx
// 移动端：单列 | 桌面端：双列
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {/* ... */}
</div>

// 侧边栏：移动端下移
<aside className="w-full lg:w-72 lg:min-h-screen">
  {/* ... */}
</aside>

// Header：移动端折叠
<nav className="hidden md:flex items-center gap-6">
  {/* 导航链接 */}
</nav>
```

### 3. Glass Morphism 风格统一

从参考库挑玻璃态组件，应用到：
- Swap 卡片 ✅
- Pool 卡片 ✅
- Staking 卡片 ✅
- Vault 卡片 ✅
- Wallet 连接弹窗 ✅

玻璃态参数（铁律⑳精确数值化）：
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 16px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
```

### 4. 页面清单

需要打磨的页面：
```
frontend/src/pages/
├── trade/
│   ├── Swap.tsx          ✅ 核心交易页
│   ├── Limit.tsx         ✅ 限价单
│   └── CrossChain.tsx    ✅ 跨链桥
├── pool/
│   ├── PoolList.tsx      ✅ 流动性池列表
│   ├── AddLiquidity.tsx  ✅ 添加流动性
│   └── RemoveLiquidity.tsx ✅ 移除流动性
├── vault/                ✅ 金库
├── staking/              ✅ 质押
├── launch/               ✅ 代币发行
├── portfolio/            ✅ 资产组合
├── governance/           ✅ 治理
├── compliance/           ✅ 合规
├── docs/                 ✅ 文档
└── profile/              ✅ 个人中心
```

## 验收标准
- [ ] 每个数据加载页面有 skeleton loading
- [ ] 每个 API 错误有用户友好的错误提示 + 重试按钮
- [ ] 移动端 (375px) 所有页面可正常浏览、可交互
- [ ] 桌面端 (1440px) 布局合理
- [ ] 玻璃态风格统一
- [ ] tsc 编译零错误
- [ ] commit: `feat(ui): polish UI with glass morphism + responsive + error handling`
