# Cursor Prompt — ION DEX UI 1:1 对齐（复制到对话）

> 权威规范：`.memory-bank/ui-cyber-glass-iron-law.md`  
> 工程路线：`docs/10-ui-design-route.md`

```text
严格按照 ION DEX 设计参考图与 .memory-bank/ui-cyber-glass-iron-law.md 执行，1:1 对齐视觉：

1. 色彩唯一固定：青 #00FFFF、紫 #6020FF、洋红 #FF00FF；禁止任何额外主色。
2. 全站深空极光星空背景；所有面板必须 backdrop-filter 磨砂玻璃（--glass-blur: 18px）。
3. 卡片边框仅允许 90deg 青→紫→粉横向流光渐变霓虹发光。
4. 布局固定：顶栏 / 左 Swap / 中 K 线 / 右数据 / 底 5 功能按钮；间距比例对照参考图。
5. 保留 3D 流体玻璃、flow-border、float-3d 景深；禁止全局关闭动效。
6. 响应式 375/768/1440 结构不乱；字体与图标层级对照原图。
7. 禁止简化玻璃深度、禁止自动调色、禁止 placeholder/shell/draft 文案。

改代码前读 docs/10-ui-design-route.md；改后跑 frontend verify。
```

附加约束（粘贴在上方 Prompt 之后，如需锁死实现）：

```text
使用 frontend/src/styles/global.css 中的 CSS 变量，禁止硬编码旧色 #24f7ff #8d4dff #ff3bd4。
玻璃面板用 .ion-glass-panel 或 .glass-surface；霓虹边框用 .flow-border。
```
