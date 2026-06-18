/**
 * ION-DEX 视觉协议令牌 (Design Tokens)
 * 基于 DEX 设计图精确视觉参数：Deep Space + Neon Glow + Glassmorphism
 * 
 * 铁律：AI 禁止在代码中硬编码任何颜色值，必须从此文件引用。
 * 修改视觉风格只需改此文件，全项目 UI 瞬间同步。
 */
export const DesignTokens = {
  theme: {
    background: 'radial-gradient(circle at 50% 50%, #1e0a3c 0%, #000000 100%)',
  },
  colors: {
    neonCyan: '#00ffff',
    neonMagenta: '#ff00ff',
    glassBase: 'rgba(25, 25, 45, 0.45)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    textPrimary: '#ffffff',
    textSecondary: '#9ca3af',
  },
  effects: {
    cardGlow: '0 0 20px rgba(0, 255, 255, 0.15), inset 0 0 10px rgba(255, 255, 255, 0.05)',
    neonCyan: '0 0 15px rgba(0, 255, 255, 0.6), inset 0 0 10px rgba(0, 255, 255, 0.2)',
    neonMagenta: '0 0 15px rgba(255, 0, 255, 0.6), inset 0 0 10px rgba(255, 0, 255, 0.2)',
    backdropBlur: 'blur(20px)',
  },
  dimensions: {
    borderRadius: '28px',
    panelGap: '20px',
    panelPadding: '24px',
  },
} as const;
