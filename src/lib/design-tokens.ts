// Strict UI Engineering Constants
// ION-DEX Design Token Protocol — Single Source of Truth for all visual attributes
// If UI looks wrong, fix THIS file, NOT component code.
// Design System v3.0 — 新 token 已合并，现有 token 完整保留。
export const DesignTokens = {
  // ── Color Palette (Deep Space + Neon Glow + Glassmorphism) ──
  colors: {
    // 现有基础色值
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
    // 交互层透明叠加（用于选中态/悬停态）
    cyanOverlay: 'rgba(0, 255, 255, 0.15)',
    cyanBorder: 'rgba(0, 255, 255, 0.3)',
    surfaceOverlay: 'rgba(255, 255, 255, 0.05)',
    surfaceBorder: 'rgba(255, 255, 255, 0.1)',
    // v3.0 追加色值
    cyanDark: '#003344',
    magentaDark: '#330033',
    violetDark: '#1a0033',
    disabledBg: 'rgba(255,255,255,0.03)',
    disabledText: 'rgba(255,255,255,0.2)',
    hoverBg: 'rgba(255,255,255,0.08)',
    blackOverlay: 'rgba(0,0,0,0.3)',
    transparent: 'transparent',
  } as const,

  // ── Borders ──
  borders: {
    // 现有基础描边
    thin: '1px',
    thick: '2px',
    // v3.0 追加霓虹发光描边
    glowCyan: '1px solid #00ffff',
    glowMagenta: '1px solid #ff00ff',
    glowViolet: '1px solid #8d4dff',
    cardBorder: '1px solid rgba(255,255,255,0.08)',
  } as const,

  // ── Typography ──
  typography: {
    // 现有 6 级基础排版
    heading: { fontSize: '24px', fontWeight: '700', lineHeight: '1.3' },
    subheading: { fontSize: '18px', fontWeight: '600', lineHeight: '1.4' },
    body: { fontSize: '14px', fontWeight: '400', lineHeight: '1.5' },
    caption: { fontSize: '12px', fontWeight: '400', lineHeight: '1.5' },
    dataValue: { fontSize: '20px', fontWeight: '700', lineHeight: '1.2', fontFamily: "'JetBrains Mono', monospace" },
    dataLabel: { fontSize: '12px', fontWeight: '500', lineHeight: '1.5', letterSpacing: '0.05em' },
    // v3.0 追加流动性精算排版
    poolTitle: { fontSize: '14px', fontWeight: '600', lineHeight: '1.4', letterSpacing: '0.05em' },
    poolStat: { fontSize: '28px', fontWeight: '700', lineHeight: '1.2', fontFamily: "'JetBrains Mono', monospace" },
    poolLabel: { fontSize: '11px', fontWeight: '500', lineHeight: '1.4', letterSpacing: '0.08em', textTransform: 'uppercase' as const },
    buttonLabel: { fontSize: '13px', fontWeight: '600', lineHeight: '1.2', letterSpacing: '0.1em', textTransform: 'uppercase' as const },
    badgeLabel: { fontSize: '10px', fontWeight: '600', lineHeight: '1.3', letterSpacing: '0.12em', textTransform: 'uppercase' as const },
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
    inputValueSize: '26px',
    poolInputValueSize: '28px',
    connectorSize: '16px',
    microTextSize: '10px',
    dividerMargin: '2px 0',
    starfieldSize: '1400px 300px',
  } as const,

  // ── Effects ──
  effects: {
    // 现有基础特效
    glassBlur: 'blur(20px)',
    backdropBlur: 'blur(20px)',
    cardGlow: '0 0 15px rgba(0, 255, 255, 0.4), inset 0 0 10px rgba(0, 255, 255, 0.2)',
    neonCyan: '0 0 15px rgba(0, 255, 255, 0.4), inset 0 0 10px rgba(0, 255, 255, 0.2)',
    neonShadowCyan: '0 0 15px rgba(0, 255, 255, 0.4), inset 0 0 10px rgba(0, 255, 255, 0.2)',
    neonShadowMagenta: '0 0 15px rgba(255, 0, 255, 0.4), inset 0 0 10px rgba(255, 0, 255, 0.2)',
    neonMagenta: '0 0 15px rgba(255, 0, 255, 0.4), inset 0 0 10px rgba(255, 0, 255, 0.2)',
    neonShadow: (color: string) => `0 0 15px ${color}66, inset 0 0 10px ${color}33`,
    neonGlow: (color: string) => `0 0 20px ${color}40, 0 0 40px ${color}20`,
    cardHover: 'transform: scale(1.01); box-shadow: 0 0 30px rgba(0,255,255,0.2)',
    // v3.0 追加复合阴影及滤镜
    poolCard: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,255,0.15)',
    poolCardHover: '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,255,255,0.35)',
    panelOuterGlowCyan: '0 0 60px rgba(0,255,255,0.15), 0 0 120px rgba(0,0,0,0.5)',
    panelOuterGlowMagenta: '0 0 60px #330033, 0 0 120px rgba(0,0,0,0.5)',
    tabGlow: '0 0 15px rgba(0,255,255,0.2)',
    tabGlowSoft: '0 0 12px rgba(0,255,255,0.2)',
    inputGlowCyan: '0 0 20px rgba(0,255,255,0.15)',
    inputGlowMagenta: '0 0 20px rgba(255,0,255,0.15)',
    actionShadowCyan: '0 0 30px rgba(0,255,255,0.4), 0 4px 12px rgba(0,0,0,0.3)',
    actionShadowCyanHover: '0 0 40px rgba(0,255,255,0.6), 0 8px 20px rgba(0,0,0,0.4)',
    actionShadowViolet: '0 0 30px rgba(141,77,255,0.4), 0 4px 12px rgba(0,0,0,0.3)',
    actionShadowVioletHover: '0 0 40px rgba(141,77,255,0.6)',
    walletButtonCyan: '0 0 20px rgba(0,255,255,0.4)',
    walletButtonMagenta: '0 0 20px rgba(255,0,255,0.4)',
    buttonGlow: '0 0 20px rgba(0,255,255,0.3)',
    insetGlow: 'inset 0 0 40px rgba(0,255,255,0.05)',
  } as const,

  // ── Gradients (v3.0 全新模块) ──
  gradients: {
    poolCardBg: 'linear-gradient(180deg, rgba(0,255,255,0.05) 0%, rgba(0,0,0,0.3) 100%)',
    poolCardBgHover: 'linear-gradient(180deg, rgba(0,255,255,0.1) 0%, rgba(0,0,0,0.5) 100%)',
    buttonPrimary: 'linear-gradient(180deg, #00ffff 0%, #00bcd4 100%)',
    buttonPrimaryCyan: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
    buttonPrimaryViolet: 'linear-gradient(135deg, #8d4dff 0%, #6d2fff 100%)',
    walletPrimary: 'linear-gradient(135deg, #00ffff 0%, #0088cc 100%)',
    navFade: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 80%, transparent 100%)',
    starfield: `
          radial-gradient(2px 2px at 20px 30px, rgba(0,255,255,0.33), transparent),
          radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.2), transparent),
          radial-gradient(1px 1px at 90px 40px, rgba(0,255,255,0.27), transparent),
          radial-gradient(2px 2px at 160px 120px, rgba(255,0,255,0.27), transparent),
          radial-gradient(1px 1px at 230px 50px, rgba(255,255,255,0.13), transparent),
          radial-gradient(2px 2px at 300px 90px, rgba(0,255,255,0.2), transparent),
          radial-gradient(1px 1px at 380px 20px, rgba(255,255,255,0.2), transparent),
          radial-gradient(2px 2px at 450px 110px, rgba(141,77,255,0.27), transparent),
          radial-gradient(1px 1px at 520px 60px, rgba(0,255,255,0.27), transparent),
          radial-gradient(2px 2px at 600px 30px, rgba(255,255,255,0.13), transparent),
          radial-gradient(2px 2px at 690px 100px, rgba(255,0,255,0.2), transparent),
          radial-gradient(1px 1px at 760px 40px, rgba(0,255,255,0.33), transparent),
          radial-gradient(2px 2px at 840px 80px, rgba(255,255,255,0.2), transparent),
          radial-gradient(1px 1px at 920px 20px, rgba(141,77,255,0.27), transparent),
          radial-gradient(2px 2px at 1020px 70px, rgba(0,255,255,0.2), transparent),
          radial-gradient(1px 1px at 1100px 50px, rgba(255,255,255,0.13), transparent),
          radial-gradient(2px 2px at 1190px 90px, rgba(255,0,255,0.27), transparent),
          radial-gradient(1px 1px at 1280px 30px, rgba(0,255,255,0.33), transparent),
          radial-gradient(2px 2px at 70px 180px, rgba(255,255,255,0.2), transparent),
          radial-gradient(1px 1px at 150px 220px, rgba(0,255,255,0.27), transparent),
          radial-gradient(2px 2px at 280px 170px, rgba(141,77,255,0.2), transparent),
          radial-gradient(1px 1px at 400px 240px, rgba(255,255,255,0.13), transparent)
        `,
    dividerGlow: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
    glassPanel: 'linear-gradient(135deg, rgba(20,25,45,0.6) 0%, rgba(20,25,45,0.2) 100%)',
  } as const,

  // ── Animation Curves (v3.0 全新模块) ──
  animation: {
    durationFast: '150ms',
    durationNormal: '300ms',
    durationSlow: '500ms',
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
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
    pageColumns: '350px 1fr 300px',
    pageRows: 'auto',
    leftColumn: '1',
    centerColumn: '2',
    rightColumn: '3',
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
