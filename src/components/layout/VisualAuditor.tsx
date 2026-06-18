import React from 'react';

/**
 * VisualAuditor — ION-DEX 视觉校准仪表盘 (Dev Only)
 * 
 * 浮窗显示当前页所有组件的 DesignTokens 引用值。
 * PM 不需要看代码，看这个浮窗就知道哪个 Token 不对，直接说：
 * "cardPadding 从 24px 改成 28px" — AI 改 Token 文件即可。
 * 
 * Usage: <VisualAuditor show={import.meta.env.DEV} />
 */

interface TokenSnapshot {
  label: string;
  value: string;
  tokenPath: string;
}

interface VisualAuditorProps {
  show?: boolean;
  snapshots?: TokenSnapshot[];
}

const defaultSnapshots: TokenSnapshot[] = [
  // Colors
  { label: 'Background', value: '#000000', tokenPath: 'colors.background' },
  { label: 'Panel BG', value: 'rgba(20,25,45,0.4)', tokenPath: 'colors.panelBg' },
  { label: 'Panel Border', value: 'rgba(255,255,255,0.15)', tokenPath: 'colors.panelBorder' },
  { label: 'Neon Cyan', value: '#00ffff', tokenPath: 'colors.neonCyan' },
  { label: 'Neon Magenta', value: '#ff00ff', tokenPath: 'colors.neonMagenta' },
  { label: 'Text Primary', value: '#ffffff', tokenPath: 'colors.textPrimary' },
  { label: 'Text Secondary', value: 'rgba(255,255,255,0.6)', tokenPath: 'colors.textSecondary' },
  // Spacing
  { label: 'Grid Gap', value: '20px', tokenPath: 'spacing.gridGap' },
  { label: 'Card Padding', value: '24px', tokenPath: 'spacing.cardPadding' },
  { label: 'Border Radius', value: '28px', tokenPath: 'spacing.borderRadius' },
  // Typography
  { label: 'Heading', value: '24px / 700', tokenPath: 'typography.heading' },
  { label: 'Body', value: '14px / 400', tokenPath: 'typography.body' },
  { label: 'Data Value', value: '20px / 700 mono', tokenPath: 'typography.dataValue' },
  // Grid
  { label: 'Grid Columns', value: '12', tokenPath: 'grid.columns' },
];

export const VisualAuditor: React.FC<VisualAuditorProps> = ({
  show = false,
  snapshots = defaultSnapshots,
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        width: '280px',
        maxHeight: '480px',
        overflowY: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        border: '1px solid rgba(0, 255, 255, 0.4)',
        borderRadius: '16px',
        padding: '16px',
        backdropFilter: 'blur(16px)',
        fontSize: '12px',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        color: '#ffffff',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span style={{ color: '#00ffff', fontWeight: 700, fontSize: '13px' }}>
          🎯 Visual Auditor
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
          DEV
        </span>
      </div>

      {/* Token List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Section: Colors */}
        <SectionLabel text="Colors" />
        {snapshots
          .filter(s => s.tokenPath.startsWith('colors.'))
          .map(s => (
            <TokenRow key={s.tokenPath} snapshot={s} />
          ))}

        {/* Section: Spacing */}
        <SectionLabel text="Spacing" />
        {snapshots
          .filter(s => s.tokenPath.startsWith('spacing.'))
          .map(s => (
            <TokenRow key={s.tokenPath} snapshot={s} />
          ))}

        {/* Section: Typography */}
        <SectionLabel text="Typography" />
        {snapshots
          .filter(s => s.tokenPath.startsWith('typography.'))
          .map(s => (
            <TokenRow key={s.tokenPath} snapshot={s} />
          ))}
      </div>

      {/* Footer hint */}
      <div
        style={{
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.35)',
          lineHeight: '1.4',
        }}
      >
        If value ≠ design → tell AI: "Change <code style={{color:'#00ff88'}}>tokenPath</code> from X to Y"
      </div>
    </div>
  );
};

// ── Sub-components ──

const SectionLabel: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      color: 'rgba(255, 255, 255, 0.3)',
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      marginTop: '4px',
    }}
  >
    {text}
  </div>
);

const TokenRow: React.FC<{ snapshot: TokenSnapshot }> = ({ snapshot }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '4px 8px',
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: '6px',
    }}
  >
    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
      {snapshot.label}
    </span>
    <span
      style={{
        color: '#00ffff',
        fontSize: '11px',
        fontWeight: 500,
        maxWidth: '140px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={snapshot.tokenPath}
    >
      {snapshot.value}
    </span>
  </div>
);
