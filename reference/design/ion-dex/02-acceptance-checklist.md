# 前端验收清单

## 1. 视觉验收 (Visual QA)
- [ ] 所有页面 glassmorphism 风格统一（backdrop-filter: blur + 半透明背景 + 细边框）
- [ ] 品牌色精确匹配：#24f7ff (cyan) / #ff3bd4 (magenta) / #8d4dff (violet) / #ffd166 (gold)
- [ ] 无硬编码 hex/rgba，全部引用 Design Tokens
- [ ] 3D 图标用 `<img>` 加载，无 CSS/SVG 手绘图标
- [ ] 暗色主题一致性（背景 #0a0a0f → #12121a → #1a1a2e）

## 2. 布局验收 (Layout)
- [ ] 所有页面包裹 DEXGridHarness (grid-template-columns: 350px 1fr 300px)
- [ ] 无 fixed/absolute 定位破坏栅格
- [ ] 移动端 375px 断点：栅格变单列 (1fr)
- [ ] 平板 768px 断点：栅格变双列 (250px 1fr)
- [ ] 桌面 1280px+：完整三列

## 3. 交互验收 (Interaction)
- [ ] hover 状态：所有可点击元素有 hover 过渡 (transition: all 0.2s ease)
- [ ] active 状态：按钮按下有 scale(0.97) 反馈
- [ ] focus 状态：输入框有 #24f7ff glow 边框
- [ ] loading 状态：每个数据加载区有 skeleton loading
- [ ] error 状态：每个 API 调用有友好错误提示 + 重试按钮
- [ ] empty 状态：空列表/无数据时有占位提示

## 4. 响应式验收 (Responsive)
- [ ] 375px: 所有内容可读，无横向滚动
- [ ] 768px: 侧边栏折叠为汉堡菜单
- [ ] 1280px+: 完整三列布局
- [ ] 触摸目标 ≥ 44px × 44px (移动端)
- [ ] 字体缩放：移动端 14px 基准，桌面 16px 基准

## 5. 性能验收 (Performance)
- [ ] 首屏加载 < 3s (Lighthouse)
- [ ] 每路由 bundle < 200KB (gzipped)
- [ ] 图片全部 webp 格式，有 lazy loading
- [ ] 无未使用的 import / 死代码
- [ ] Turbopack 编译无警告

## 6. 可访问性验收 (Accessibility)
- [ ] 所有交互元素有 ARIA label
- [ ] 键盘导航：Tab/Shift+Tab/Enter/Escape 可用
- [ ] 对比度 ≥ 4.5:1 (WCAG AA)
- [ ] 表单有 label 关联
- [ ] 错误提示有 aria-describedby

## 7. 国际化验收 (i18n)
- [ ] 所有用户可见文本在 i18n key 中
- [ ] 中文翻译完整无遗漏
- [ ] 英文翻译完整无遗漏
- [ ] 无硬编码中文/英文字符串
- [ ] 日期/数字格式按 locale 显示

## 8. 代码质量验收 (Code Quality)
- [ ] TypeScript 零报错 (tsc --noEmit)
- [ ] 无 `any` 类型（除非有注释说明）
- [ ] 文件 ≤ 300 行
- [ ] 无 TODO/FIXME/HACK 注释
- [ ] 无 console.log（生产构建）
- [ ] ESLint 零警告

## 9. 数据验收 (Data)
- [ ] 零 mock 数据，全部对接真实 API
- [ ] 所有合约地址为真实主网/测试网地址
- [ ] API 错误有 try-catch + 用户友好提示
- [ ] 加载状态有 spinner/skeleton
- [ ] 数据刷新有手动刷新按钮

## 10. 构建验收 (Build)
- [ ] `next build` 成功零错误
- [ ] `next start` 生产模式可用
- [ ] 所有路由 HTTP 200
- [ ] 静态资源路径正确
- [ ] 环境变量 .env 配置完整
