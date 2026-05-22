# SplashScreen 赛博朋克银河重构（3D 立体版）

**Master 指令 (2026-05-22):**
1. "最上面那个效果放进来" → 3D 星系深空粒子背景
2. "页面是平的" → **抱怨！**现在的太平了，要 3D 立体深度
3. "整体的框架别换" → Logo→标题→进度条→渐隐 结构不变
4. "赛博朋克的风格换上去" → 霓虹发光 + 暗色底 + 青紫粉配色
5. "最后的LOGO显示换上去" → ION DEX logo

---

## 改动范围

### ① 3D 深空星系背景
- Canvas 粒子系统: 2000+ 星星，**3 层深度**
  - 近层(alpha 0.4-0.6, radius 1.5-2.5px, speed 0.0004) 600 粒子
  - 中层(alpha 0.2-0.4, radius 0.8-1.5px, speed 0.0002) 800 粒子
  - 远层(alpha 0.08-0.2, radius 0.3-0.8px, speed 0.00008) 600 粒子
- 中心螺旋星云: 300 粒子沿螺旋线 3D 旋转
  - 颜色: #24f7ff(青) 50% / #8b5cf6(紫) 30% / #ec4899(粉) 20%
  - 螺旋公式: r = i * 0.5, theta = i * 0.35 + time * 0.0005
  - 3D 视差: z-depth 影响 opacity + speed
- 底色: radial-gradient(circle at 50% 40%, #0a0a2e, #020617 50%, #000 100%)

### ② 3D Logo 浮现
- Logo `<img src="/logo-circular.png">` 从深处浮出:
  - scale: 0.3→1, opacity: 0→1, 带 3D perspective
  - rotateY: 180deg→0 (3D 翻转入场)
  - transition: cubic-bezier(0.34, 1.56, 0.64, 1) 弹性
- 3 层光环 (3D 旋转圆环):
  - Ring 1: 160px, rgba(36,247,255,0.3), rotate3d(1,0.5,0,360deg) 4s infinite
  - Ring 2: 120px, rgba(139,92,246,0.25), rotate3d(0,1,0.5,360deg) 3s infinite reverse
  - Ring 3: 90px, rgba(236,72,153,0.2), rotate3d(0.5,0,1,360deg) 2.5s infinite
- Logo glow: drop-shadow(0 0 36px rgba(36,247,255,0.6)) drop-shadow(0 0 72px rgba(139,92,246,0.3))

### ③ 赛博朋克 3D 标题
- "ION DEX" 文字 3D 透视:
  - transform: perspective(800px) rotateX(5deg)
  - text-shadow: 0 0 24px rgba(36,247,255,0.5), 0 0 48px rgba(139,92,246,0.3), 0 0 80px rgba(236,72,153,0.15)
  - 从 y:+40, z:-50 浮入 (3D translateZ)
- 副标题 "Decentralized Exchange" 延迟 200ms 从下方淡入
- 进度条: from-cyan-400 via-violet-500 to-fuchsia-400, 带 pulse 发光

---

## 不改的
- ❌ 框架结构：Logo居中 → 标题 → 副标题 → 进度条 → 渐隐
- ❌ 时间：保持 2400ms
- ❌ 逻辑：useState(true) → setTimeout → opacity fade

---

## 验收
- [ ] 打开页面 → 3D 深空星系三层深度粒子旋转
- [ ] Logo 3D 翻转浮现 + 三层光环立体旋转
- [ ] 标题 perspective 3D 透视 + 霓虹 glow
- [ ] 进度条青紫粉渐变
- [ ] 2400ms 渐隐到 Dashboard，不卡死

**执行**: 读 `SplashScreen.tsx` → 改背景 3D Canvas + 3D CSS 样式 + Logo 3D 动画 → 不动结构和逻辑
