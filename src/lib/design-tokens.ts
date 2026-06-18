/**
 * ION-DEX 视觉协议令牌 (Design Tokens) — v2.0
 * 基于 DEX 设计图精确视觉参数：Deep Space + Neon Glow + Glassmorphism
 * 
 * 铁律：AI 禁止在代码中硬编码任何颜色值，必须从此文件引用。
 * 修改视觉风格只需改此文件，全项目 UI 瞬间同步。
 * 
 * Grid: 12 列标准栅格，组件用 grid-column: span X 定义位置
 */
export const DesignTokens = {
  colors: {
    background: '#000000',
    panelBg: 'rgba(20, 25, 45, 0.4)',
    panelBorder: 'rgba(255, 255, 255, 0.15)',
    neonCyan: '#00ffff',
    neonMagenta: '#ff00ff',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
  },
  spacing: {
    gridGap: '20px',
    cardPadding: '24px',
    borderRadius: '28px',
    pagePadding: '40px',
  },
  effects: {
    glassBlur: 'blur(20px)',
    neonShadow: (color: string) => `0 0 15px ${color}66, inset 0 0 10px ${color}33`,
  },
  grid: {
    columns: 12,
    columnSpan: (n: number) => `span ${n}`,
  },
} as const;
