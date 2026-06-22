import React, { useState } from 'react';
import { DesignTokens as T } from '../../lib/design-tokens';

/** Pool list item card */
const PoolCard: React.FC<{
  pair: string; tvl: string; apr: string; volume24h: string; fee: string;
  selected: boolean; onClick: () => void;
}> = ({ pair, tvl, apr, volume24h, fee, selected, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-4 rounded-2xl transition-all hover:scale-[1.01]"
    style={{
      background: selected ? T.gradients.poolCardBgHover : T.gradients.poolCardBg,
      border: `${T.borders.thin} solid ${selected ? T.colors.cyanBorder : T.colors.surfaceBorder}`,
      boxShadow: selected ? T.effects.poolCardHover : T.effects.poolCard,
      transition: `all ${T.animation.durationNormal} ${T.animation.easeOut}`,
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: T.colors.neonCyan }}>
            <span className="text-xs font-bold" style={{ color: T.colors.background }}>I</span>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: T.colors.neonMagenta }}>
            <span className="text-xs font-bold" style={{ color: T.colors.background }}>W</span>
          </div>
        </div>
        <span className="font-bold tracking-wide" style={{ fontSize: T.typography.poolTitle.fontSize, color: T.colors.textPrimary }}>
          {pair}
        </span>
      </div>
      <span
        className="px-2 py-0.5 rounded-full font-mono text-xs"
        style={{ backgroundColor: T.colors.cyanOverlay, color: T.colors.neonCyan }}
      >
        {fee}
      </span>
    </div>
    <div className="grid grid-cols-3 gap-2">
      <div>
        <span style={{ fontSize: T.typography.poolLabel.fontSize, color: T.colors.textMuted }}>TVL</span>
        <p className="font-mono font-bold" style={{ fontSize: T.typography.poolStat.fontSize, color: T.colors.textPrimary }}>{tvl}</p>
      </div>
      <div>
        <span style={{ fontSize: T.typography.poolLabel.fontSize, color: T.colors.textMuted }}>APR</span>
        <p className="font-mono font-bold" style={{ fontSize: T.typography.poolStat.fontSize, color: T.colors.neonCyan }}>{apr}</p>
      </div>
      <div>
        <span style={{ fontSize: T.typography.poolLabel.fontSize, color: T.colors.textMuted }}>24h Vol</span>
        <p className="font-mono font-bold" style={{ fontSize: T.typography.poolStat.fontSize, color: T.colors.textPrimary }}>{volume24h}</p>
      </div>
    </div>
  </button>
);

/** Pool detail panel (shown when a pool is selected) */
const PoolDetail: React.FC<{ pair: string; tvl: string; apr: string; volume24h: string; fee: string; onClose: () => void }> =
  ({ pair, tvl, apr, volume24h, fee, onClose }) => (
    <div
      className="flex flex-col gap-4 p-5 rounded-2xl"
      style={{
        background: T.gradients.poolCardBg,
        border: `${T.borders.thin} solid ${T.colors.cyanBorder}`,
        boxShadow: T.effects.poolCardHover,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: T.colors.neonCyan }}>
              <span className="text-sm font-bold" style={{ color: T.colors.background }}>I</span>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: T.colors.neonMagenta }}>
              <span className="text-sm font-bold" style={{ color: T.colors.background }}>W</span>
            </div>
          </div>
          <span className="font-bold" style={{ fontSize: T.typography.subheading.fontSize, color: T.colors.textPrimary }}>{pair}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.colors.textSecondary} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          ['TVL', tvl, T.colors.textPrimary],
          ['APR', apr, T.colors.neonCyan],
          ['24h Volume', volume24h, T.colors.textPrimary],
          ['Pool Fee', fee, T.colors.textSecondary],
          ['Your Liquidity', '$0.00', T.colors.textMuted],
          ['Your Share', '0.00%', T.colors.textMuted],
        ].map(([label, value, color]) => (
          <div key={label} className="p-3 rounded-xl" style={{ backgroundColor: T.colors.blackOverlay }}>
            <span style={{ fontSize: T.typography.caption.fontSize, color: T.colors.textMuted }}>{label}</span>
            <p className="font-mono font-bold mt-1" style={{ fontSize: T.typography.dataValue.fontSize, color }}>{value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
          style={{
            background: T.gradients.buttonPrimary,
            color: T.colors.background,
            boxShadow: T.effects.buttonGlow,
            fontSize: T.typography.buttonLabel.fontSize,
            letterSpacing: T.typography.buttonLabel.letterSpacing,
          }}
        >
          Add Liquidity
        </button>
        <button
          className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
          style={{
            background: 'transparent',
            color: T.colors.neonMagenta,
            border: `${T.borders.thin} solid ${T.colors.neonMagenta}55`,
            fontSize: T.typography.buttonLabel.fontSize,
            letterSpacing: T.typography.buttonLabel.letterSpacing,
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );

const POOLS = [
  { pair: 'ION / WBNB', tvl: '$258K', apr: '18.7%', volume24h: '$12.5K', fee: '0.25%' },
  { pair: 'ION / USDT', tvl: '$142K', apr: '22.3%', volume24h: '$8.2K', fee: '0.05%' },
  { pair: 'ION / BUSD', tvl: '$89K', apr: '15.1%', volume24h: '$4.1K', fee: '0.25%' },
];

export const PoolPanel: React.FC = () => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="col-span-12 lg:col-span-4 lg:col-start-1 md:col-span-8 md:col-start-3 px-2 mt-6">
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: T.colors.background,
          boxShadow: T.effects.panelOuterGlowCyan,
        }}
      >
        <div
          className="relative z-10 flex flex-col gap-4"
          style={{
            background: T.gradients.glassPanel,
            backdropFilter: T.effects.glassBlur,
            WebkitBackdropFilter: T.effects.glassBlur,
            border: `${T.borders.thin} solid ${T.colors.panelBorder}`,
            borderRadius: T.spacing.borderRadius,
            padding: T.spacing.cardPadding,
          }}
        >
          <div>
            <h2 style={{ fontSize: T.typography.heading.fontSize, fontWeight: T.typography.heading.fontWeight, color: T.colors.textPrimary, letterSpacing: '0.02em' }}>
              Pools
            </h2>
            <p className="mt-1" style={{ fontSize: T.typography.caption.fontSize, color: T.colors.textSecondary }}>
              PancakeSwap V3 · ION pairs
            </p>
          </div>

          {selected !== null ? (
            <PoolDetail {...POOLS[selected]} onClose={() => setSelected(null)} />
          ) : (
            <div className="flex flex-col gap-3">
              {POOLS.map((pool, i) => (
                <PoolCard key={pool.pair} {...pool} selected={false} onClick={() => setSelected(i)} />
              ))}
            </div>
          )}
        </div>

        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${T.colors.neonCyan}10 0%, transparent 70%)` }}
        />
      </div>
    </div>
  );
};

export default PoolPanel;
