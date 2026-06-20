/**
 * ION-DEX Design Token Protocol — Frontend Single Source of Truth
 * All visual values derive from CSS custom properties defined in global.css.
 * Components reference this file; never hardcode colors/spacing/fonts.
 */

const cssVar = (name: string, fallback: string) =>
  `var(${name}, ${fallback})`;

export const DesignTokens = {
  colors: {
    background: cssVar('--ion-ink', '#010104'),
    panelBg: cssVar('--glass-bg', 'rgba(2,4,10,0.72)'),
    panelBgHero: cssVar('--glass-bg-hero', 'rgba(4,6,14,0.82)'),
    neonCyan: cssVar('--ion-cyan', '#00ffff'),
    neonPurple: cssVar('--ion-purple', '#6020ff'),
    neonMagenta: cssVar('--ion-magenta', '#ff00ff'),
    neonViolet: cssVar('--ion-violet', '#6020ff'),
    neonGold: cssVar('--ion-gold', '#ffd166'),
    neonGreen: cssVar('--ion-green', '#00ff88'),
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.6)',
    textMuted: 'rgba(255,255,255,0.35)',
    textCyan: 'rgba(0,255,255,0.7)',
    positive: '#00ff88',
    negative: '#ff4466',
    warning: '#ffd166',
    cyanOverlay: 'rgba(0,255,255,0.08)',
    cyanOverlayStrong: 'rgba(0,255,255,0.15)',
    magentaOverlay: 'rgba(255,0,255,0.08)',
    surfaceBorder: 'rgba(255,255,255,0.1)',
    surfaceBorderStrong: 'rgba(255,255,255,0.15)',
    inputBg: 'rgba(255,255,255,0.06)',
    inputBorder: 'rgba(255,255,255,0.1)',
    inputFocusBorder: cssVar('--ion-cyan', '#00ffff'),
    disabledBg: 'rgba(255,255,255,0.03)',
    disabledText: 'rgba(255,255,255,0.2)',
    errorBg: 'rgba(255,68,102,0.08)',
    errorBorder: 'rgba(255,68,102,0.2)',
    successBg: 'rgba(0,255,136,0.08)',
    successBorder: 'rgba(0,255,136,0.25)',
    warningBg: 'rgba(255,209,102,0.06)',
    warningBorder: 'rgba(255,209,102,0.25)',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
    panelPadding: '20px',
    cardPadding: '24px',
    elementGap: '12px',
    sectionGap: '20px',
    iconSize: '40px',
    smallIconSize: '28px',
  },

  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    panel: cssVar('--panel-radius', '20px'),
    button: cssVar('--btn-radius', '12px'),
    full: '9999px',
  },

  layout: {
    marketColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
    twoColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
    detailColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
  },

  borders: {
    thin: '1px',
    thick: '2px',
    panel: '1px solid rgba(255,255,255,0.1)',
    panelCyan: `1px solid rgba(0,255,255,0.35)`,
    panelMagenta: `1px solid rgba(255,0,255,0.3)`,
    input: '1px solid rgba(255,255,255,0.1)',
    inputFocus: `1px solid ${cssVar('--ion-cyan', '#00ffff')}`,
  },

  typography: {
    heading: { fontSize: '24px', fontWeight: '700', lineHeight: '1.3' },
    subheading: { fontSize: '18px', fontWeight: '600', lineHeight: '1.4' },
    body: { fontSize: '14px', fontWeight: '400', lineHeight: '1.5' },
    caption: { fontSize: '12px', fontWeight: '400', lineHeight: '1.5' },
    label: { fontSize: '11px', fontWeight: '600', lineHeight: '1.4', letterSpacing: '0.08em', textTransform: 'uppercase' as const },
    buttonLabel: { fontSize: '14px', fontWeight: '700', lineHeight: '1.2', letterSpacing: '0.05em' },
    monoValue: { fontSize: '20px', fontWeight: '700', lineHeight: '1.2', fontFamily: "'JetBrains Mono', monospace" },
    monoLarge: { fontSize: '28px', fontWeight: '700', lineHeight: '1.2', fontFamily: "'JetBrains Mono', monospace" },
  },

  effects: {
    glassBlur: cssVar('--glass-blur', '20px'),
    glowCyan: cssVar('--glow-cyan', '0 0 14px 4px rgba(0,255,255,0.55)'),
    glowMagenta: cssVar('--glow-magenta', '0 0 14px 4px rgba(255,0,255,0.5)'),
    glowPurple: cssVar('--glow-purple', '0 0 14px 4px rgba(96,32,255,0.5)'),
    glowCyber: cssVar('--glow-cyber-intense', '0 0 24px rgba(0,255,255,0.35), 0 0 48px rgba(96,32,255,0.22), 0 0 72px rgba(255,0,255,0.14)'),
    neonCyan: '0 0 28px rgba(0,255,255,0.55)',
    neonMagenta: '0 0 28px rgba(255,0,255,0.48)',
    neonPanel: '0 0 40px rgba(0,255,255,0.16), 0 0 80px rgba(0,255,255,0.08), 0 0 120px rgba(96,32,255,0.06)',
    insetGlow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
    buttonHover: '0 0 30px rgba(0,255,255,0.35), 0 0 60px rgba(96,32,255,0.2)',
  },

  gradients: {
    aurora: cssVar('--ion-gradient-aurora', 'linear-gradient(90deg, #00ffff, #6020ff, #ff00ff)'),
    buttonPrimary: 'linear-gradient(90deg, var(--ion-cyan), var(--ion-purple), var(--ion-magenta))',
    panelBg: 'linear-gradient(145deg, rgba(4,6,14,0.94), rgba(2,4,10,0.88) 48%, rgba(12,4,18,0.9))',
    inputBg: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
  },

  animation: {
    durationFast: '150ms',
    durationNormal: '300ms',
    durationSlow: '500ms',
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  buttons: {
    height: '48px',
    heightSm: '36px',
    borderRadius: cssVar('--btn-radius', '12px'),
    padding: '0 24px',
    paddingSm: '0 16px',
  },

  inputs: {
    height: '56px',
    borderRadius: '16px',
    padding: '0 20px',
    fontSize: '16px',
  },
} as const;
