// Strict UI Engineering Constants
// ION-DEX Design Token Protocol — Single Source of Truth for all visual attributes
export const DesignTokens = {
  colors: {
    background: '#000000',
    panelBg: 'rgba(20, 25, 45, 0.4)',
    panelBorder: 'rgba(255, 255, 255, 0.15)',
    neonCyan: '#00ffff',
    neonMagenta: '#ff00ff',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
  } as const,
  spacing: {
    gridGap: '20px',
    cardPadding: '24px',
    borderRadius: '28px',
  } as const,
  effects: {
    glassBlur: 'backdrop-filter: blur(20px)',
    neonShadow: (color: string) => `0 0 15px ${color}66, inset 0 0 10px ${color}33`,
  } as const,
} as const;
