# ION DEX UI Code-Level Specification
# =====================================
# Cursor 可执行的像素级规范 —— 不描述，给代码
# 优先级：P0 > P1 > P2

## P0 🔴 Critical Visual Fixes

### P0.1 NeonGlassCard 边框太细
**当前问题**: `--ion-glass-border-width: 1px` 太细，hero卡片看起来像普通div
**精确修复**:

```css
/* theme.css 修改 */
:root {
  /* P0.1: hero卡片必须用厚边框 */
  --ion-glass-border-width: 2px !important;
  
  /* P0.2: 增强发光扩散 */
  --ion-glow-blur: 32px !important;       /* was 20px */
  --ion-glow-spread: 8px !important;      /* was 4px */
  
  /* P0.3: 玻璃透明度提升（太暗看不到效果） */
  --ion-glass-opacity: 0.20 !important;   /* was 0.15 */
  
  /* P0.4: 辉光颜色饱和度增强 */
  --ion-glow-color-start: rgba(0, 255, 255, 0.9) !important;   /* was 0.8 */
  --ion-glow-color-end: rgba(200, 0, 255, 0.9) !important;     /* was 255,0,255 */
}
```

### P0.2 Hero卡片需要额外外发光ring
```css
/* 在 global.css 添加 */
.neon-hero-card {
  position: relative;
}
.neon-hero-card::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(135deg, 
    rgba(0, 255, 255, 0.4), 
    rgba(200, 0, 255, 0.4), 
    rgba(0, 255, 255, 0.4)
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  filter: blur(3px);
  animation: neonPulse 3s ease-in-out infinite;
}
@keyframes neonPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
```

### P0.3 银河背景不够醒目
**当前问题**: AuroraGalaxyBackground 存在但视觉效果弱
**精确修复**: 星场密度x3, 极光运动加速

```typescript
// 修改 AuroraGalaxyBackground.tsx
// stars 数量: 200 → 600
// 极光 opacity: 0.3 → 0.5
// 极光动画速度: 20s → 12s
```

### P0.4 Dashboard feature cards必须用hero级样式
**当前问题**: Dashboard feature cards 用的是普通 NeonCard，不是 4D 玻璃效果
**精确修复**:

```tsx
// DashboardPage.tsx 中所有 featureCards 替换：
// <NeonCard> → <NeonGlassCard className="neon-hero-card">
```

### P0.5 删除所有占位符/假数据
**精确修复**: 以下文件必须清理

```typescript
// SwapPage.tsx - 删除这些import:
// import { useMockData } from "@/context/MockDataContext";   ← 删
// import { mockPreviewMeta } from "@/lib/MOCK_DATA";          ← 删
// import { GlassPlaceholderSkeleton } from "...";              ← 删

// BusinessPages.tsx - 删除:
// import { useMockData } from "@/context/MockDataContext";   ← 删
// import { mockPreviewMeta } from "@/lib/MOCK_DATA";          ← 删
```

## P1 🟡 Component Quality

### P1.1 NeonGlassCard 添加 4D 极光反射层
```css
/* 在 global.css 添加aurora反射效果 */
.neon-glass-card__aurora-reflection {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  background: radial-gradient(
    ellipse at 30% 20%, 
    rgba(0, 255, 255, 0.08) 0%, 
    transparent 60%
  ),
  radial-gradient(
    ellipse at 70% 80%, 
    rgba(200, 0, 255, 0.06) 0%, 
    transparent 60%
  );
  mix-blend-mode: screen;
}
```

### P1.2 Swap Page 表单区域
```tsx
// 输入框必须有霓虹聚焦ring
input:focus {
  box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.1);
  border-color: rgba(0, 255, 255, 0.5);
}
```

## P2 🟢 Responsive Polish

### P2.1 375px 移动端
- 所有 hero 卡片 padding: p-8 → p-5
- 字体缩放: text-2xl → text-xl
- 按钮全宽: w-full

## 执行顺序（Cursor 必须按此顺序）
1. 读本文件
2. 修改 theme.css（P0.1 变量）
3. 修改 global.css（P0.2 hero ring, P1.1 aurora）
4. 修改 AuroraGalaxyBackground（P0.3）
5. 修改 DashboardPage（P0.4）
6. 清理 SwapPage/BusinessPages 假数据（P0.5）
7. 跑 `npm run verify`
8. commit

## 对照检查清单（每个修复后打钩）
- [ ] 边框是否 ≥2px
- [ ] hero卡片是否有外发光ring
- [ ] 星场密度是否 ≥400
- [ ] Dashboard cards是否使用NeonGlassCard+neon-hero-card
- [ ] SwapPage是否无mock import
- [ ] `npm run verify` 全部通过
