// Strict UI Engineering Constants
// ION-DEX Design Token Protocol — Single Source of Truth for all visual attributes
// If UI looks wrong, fix THIS file, NOT component code.
export const DesignTokens = {
  // ── Color Palette (Deep Space + Neon Glow + Glassmorphism) ──
  colors: {
    background: '#000000',
    panelBg: 'rgba(20, 25, 45, 0.4)',
    glassBase: 'rgba(20, 25, 45, 0.4)',
    panelBorder: 'rgba(255, 255, 255, 0.15)',
    neonCyan: '#00ffff',
    neonMagenta: '#ff00ff',
    neonViolet: '#8d4dff',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textMuted: 'rgba(255, 255, 255, 0.35)',
    positive: '#00ff88',
    negative: '#ff4466',
    warning: '#ffd166',
  } as const,

  // ── Typography ──
  typography: {
    heading: { fontSize: '24px', fontWeight: '700', lineHeight: '1.3' },
    subheading: { fontSize: '18px', fontWeight: '600', lineHeight: '1.4' },
    body: { fontSize: '14px', fontWeight: '400', lineHeight: '1.5' },
    caption: { fontSize: '12px', fontWeight: '400', lineHeight: '1.5' },
    dataValue: { fontSize: '20px', fontWeight: '700', lineHeight: '1.2', fontFamily: "'JetBrains Mono', monospace" },
    dataLabel: { fontSize: '12px', fontWeight: '500', lineHeight: '1.5', letterSpacing: '0.05em' },
  } as const,

  // ── Spacing & Dimensions ──
  spacing: {
    gridGap: '20px',
    cardPadding: '24px',
    borderRadius: '28px',
    pagePadding: '40px',
    sectionGap: '32px',
    elementGap: '12px',
    iconSize: '64px',
    smallIconSize: '32px',
  } as const,

  dimensions: {
    borderRadius: '28px',
    panelGap: '20px',
    panelPadding: '24px',
    iconSize: '64px',
    buttonRadius: '12px',
    buttonHeight: '40px',
    titleSize: '24px',
    dataLabelSize: '12px',
    dataValueSize: '20px',
  } as const,

  // ── Effects ──
  effects: {
    glassBlur: 'backdrop-filter: blur(20px)',
    backdropBlur: '20px',
    cardGlow: '0 0 15px #00ffff66, inset 0 0 10px #00ffff33',
    neonCyan: '0 0 15px #00ffff66, inset 0 0 10px #00ffff33',
    neonMagenta: '0 0 15px #ff00ff66, inset 0 0 10px #ff00ff33',
    neonShadow: (color: string) => `0 0 15px ${color}66, inset 0 0 10px ${color}33`,
    neonGlow: (color: string) => `0 0 20px ${color}40, 0 0 40px ${color}20`,
    cardHover: 'transform: scale(1.01); box-shadow: 0 0 30px rgba(0,255,255,0.2)',
  } as const,

  // ── Buttons ──
  buttons: {
    primary: {
      height: '48px',
      borderRadius: '12px',
      padding: '0 24px',
      fontSize: '14px',
      fontWeight: '600',
    },
    secondary: {
      height: '40px',
      borderRadius: '12px',
      padding: '0 20px',
      fontSize: '13px',
      fontWeight: '500',
    },
    icon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
    },
  } as const,

  // ── Grid ──
  grid: {
    columns: 12,
    columnSpan: (n: number) => `span ${n}`,
  } as const,

  // ── Input Fields ──
  inputs: {
    height: '56px',
    borderRadius: '16px',
    padding: '0 20px',
    fontSize: '16px',
    bg: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.12)',
    focusBorder: '#00ffff',
  } as const,
} as const;
