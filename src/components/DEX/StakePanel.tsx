import React, { useState } from 'react';
import { DesignTokens as T } from '../../lib/design-tokens';

const LOCKUP_OPTIONS = [
  { label: '7 Days', days: 7, apy: '12.5%', bonus: '' },
  { label: '30 Days', days: 30, apy: '22.8%', bonus: 'Popular' },
  { label: '90 Days', days: 90, apy: '38.2%', bonus: 'Best APY' },
  { label: '180 Days', days: 180, apy: '55.0%', bonus: 'Max Yield' },
];

/** Token input for stake amount */
const StakeInput: React.FC<{ value: string; onChange: (v: string) => void; disabled?: boolean }> =
  ({ value, onChange, disabled }) => (
    <div
      className="flex flex-col gap-2 p-4 rounded-2xl"
      style={{ backgroundColor: T.colors.background, border: `${T.borders.thick} solid ${value ? T.colors.cyanBorder : T.colors.surfaceBorder}` }}
    >
      <div className="flex justify-between items-center">
        <span style={{ fontSize: T.typography.caption.fontSize, color: T.colors.textSecondary }}>Stake Amount</span>
        <div className="flex items-center gap-2">
          <span className="font-mono" style={{ fontSize: T.typography.caption.fontSize, color: T.colors.textMuted }}>Balance: 0.00</span>
          <button
            className="px-2 py-0.5 rounded font-bold text-xs tracking-wider transition-all hover:scale-105"
            style={{ backgroundColor: T.colors.cyanOverlay, color: T.colors.neonCyan }}
          >
            MAX
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          placeholder="0.0"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent flex-1 focus:outline-none font-mono font-bold"
          style={{ fontSize: '26px', color: T.colors.textPrimary }}
        />
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full shrink-0"
          style={{ backgroundColor: T.colors.panelBg, border: `${T.borders.thin} solid ${T.colors.cyanBorder}` }}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: T.colors.neonCyan }}>
            <span className="text-xs font-bold" style={{ color: T.colors.background }}>I</span>
          </div>
          <span className="font-bold tracking-wider" style={{ fontSize: T.typography.body.fontSize, color: T.colors.textPrimary }}>ION</span>
        </div>
      </div>
    </div>
  );

/** Lockup period selector card */
const LockupCard: React.FC<{
  label: string; apy: string; bonus: string; selected: boolean; onClick: () => void;
}> = ({ label, apy, bonus, selected, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-between w-full p-3 rounded-xl transition-all hover:scale-[1.01]"
    style={{
      background: selected ? T.colors.cyanOverlay : 'rgba(0,0,0,0.3)',
      border: `${T.borders.thin} solid ${selected ? T.colors.cyanBorder : T.colors.surfaceBorder}`,
      boxShadow: selected ? `0 0 15px ${T.colors.neonCyan}20` : 'none',
      transition: `all ${T.animation.durationNormal} ${T.animation.easeOut}`,
    }}
  >
    <div className="flex flex-col items-start gap-0.5">
      <span className="font-bold tracking-wide" style={{ fontSize: T.typography.body.fontSize, color: T.colors.textPrimary }}>
        {label}
      </span>
      {bonus && (
        <span style={{ fontSize: T.typography.badgeLabel.fontSize, color: T.colors.neonCyan, letterSpacing: T.typography.badgeLabel.letterSpacing }}>
          {bonus}
        </span>
      )}
    </div>
    <span className="font-mono font-bold" style={{ fontSize: T.typography.dataValue.fontSize, color: T.colors.neonCyan }}>
      {apy}
    </span>
  </button>
);

/** Stat card for rewards projection */
const ProjectionCard: React.FC<{ amount: string; apy: string; days: number }> = ({ amount, apy, days }) => {
  const numericAmount = parseFloat(amount) || 0;
  const numericApy = parseFloat(apy) || 0;
  const periodYield = numericAmount * (numericApy / 100) * (days / 365);
  return (
    <div
      className="grid grid-cols-2 gap-3 p-3 rounded-xl"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: `${T.borders.thin} solid ${T.colors.surfaceBorder}` }}
    >
      <div>
        <span style={{ fontSize: T.typography.caption.fontSize, color: T.colors.textMuted }}>Est. Rewards</span>
        <p className="font-mono font-bold mt-1" style={{ fontSize: T.typography.dataValue.fontSize, color: T.colors.neonCyan }}>
          {periodYield.toFixed(4)} ION
        </p>
      </div>
      <div>
        <span style={{ fontSize: T.typography.caption.fontSize, color: T.colors.textMuted }}>Unlock Date</span>
        <p className="font-mono font-bold mt-1" style={{ fontSize: T.typography.dataValue.fontSize, color: T.colors.textPrimary }}>
          {new Date(Date.now() + days * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

export const StakePanel: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [selectedLockup, setSelectedLockup] = useState(0);

  const lp = LOCKUP_OPTIONS[selectedLockup];
  const valid = !!amount && parseFloat(amount) > 0;

  return (
    <div className="col-span-12 lg:col-span-4 lg:col-start-9 md:col-span-8 md:col-start-3 px-2 mt-6">
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: T.colors.background,
          boxShadow: `0 0 60px ${T.colors.magentaDark}, 0 0 120px rgba(0,0,0,0.5)`,
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
          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h2 style={{ fontSize: T.typography.heading.fontSize, fontWeight: T.typography.heading.fontWeight, color: T.colors.textPrimary, letterSpacing: '0.02em' }}>
                Stake
              </h2>
              <p className="mt-1" style={{ fontSize: T.typography.caption.fontSize, color: T.colors.textSecondary }}>
                Earn yield by staking ION tokens
              </p>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: T.colors.cyanOverlay, border: `${T.borders.thin} solid ${T.colors.cyanBorder}` }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: T.colors.neonCyan }} />
              <span className="font-mono font-bold" style={{ fontSize: T.typography.caption.fontSize, color: T.colors.neonCyan }}>
                APY up to 55%
              </span>
            </div>
          </div>

          {/* ── Stake Amount Input ── */}
          <StakeInput value={amount} onChange={setAmount} />

          {/* ── Lockup Period Selector ── */}
          <div>
            <span className="block mb-2 font-bold uppercase tracking-wider" style={{ fontSize: T.typography.badgeLabel.fontSize, color: T.colors.textSecondary, letterSpacing: T.typography.badgeLabel.letterSpacing }}>
              Lockup Period
            </span>
            <div className="flex flex-col gap-2">
              {LOCKUP_OPTIONS.map((opt, i) => (
                <LockupCard
                  key={opt.days}
                  {...opt}
                  selected={i === selectedLockup}
                  onClick={() => setSelectedLockup(i)}
                />
              ))}
            </div>
          </div>

          {/* ── Projection Card ── */}
          {amount && (
            <ProjectionCard amount={amount} apy={lp.apy} days={lp.days} />
          )}

          {/* ── Stake Button ── */}
          <button
            disabled={!valid}
            className="relative w-full py-4 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: valid
                ? `linear-gradient(135deg, ${T.colors.neonViolet} 0%, #6d2fff 100%)`
                : T.colors.disabledBg,
              color: valid ? T.colors.background : T.colors.disabledText,
              boxShadow: valid ? `0 0 30px ${T.colors.neonViolet}40, 0 4px 12px rgba(0,0,0,0.3)` : 'none',
              transition: `all ${T.animation.durationNormal} ${T.animation.easeOut}`,
            }}
            onMouseEnter={(e) => {
              if (valid) { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = `0 0 40px ${T.colors.neonViolet}60`; }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = valid ? `0 0 30px ${T.colors.neonViolet}40` : 'none';
            }}
          >
            {valid ? `Stake ION · ${lp.apy} APY` : 'Enter Amount'}
          </button>

          {/* ── Staked positions placeholder ── */}
          <div
            className="flex flex-col gap-2 p-4 rounded-2xl items-center justify-center"
            style={{ backgroundColor: T.colors.background, border: `${T.borders.thin} dashed ${T.colors.surfaceBorder}` }}
          >
            <span style={{ fontSize: T.typography.caption.fontSize, color: T.colors.textMuted }}>No active stakes</span>
          </div>
        </div>

        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${T.colors.neonViolet}10 0%, transparent 70%)` }}
        />
      </div>
    </div>
  );
};

export default StakePanel;
