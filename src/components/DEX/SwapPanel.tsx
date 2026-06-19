import React, { useState, useCallback } from 'react';
import { DesignTokens as T } from '../../lib/design-tokens';
import { useSwapState } from '../../hooks/useSwapState';

/** Animated swap arrow — rotates on toggle */
const SwapArrow: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
  <div className="flex justify-center -my-2 z-10">
    <button
      onClick={onClick}
      className="p-2.5 rounded-full border transition-all hover:scale-110 active:scale-95"
      style={{
        backgroundColor: T.colors.background,
        borderColor: active ? T.colors.neonCyan : T.colors.surfaceBorder,
        boxShadow: active ? T.effects.tabGlow : 'none',
        transform: active ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: `transform ${T.animation.durationNormal} ${T.animation.spring}`,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.colors.neonCyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
    </button>
  </div>
);

/** Collapsible details panel */
const SwapDetails: React.FC<{
  rate: number; impact: number; slippage: number; minReceived: string;
  networkFee: string; onSlippage: (v: number) => void;
}> = ({ rate, impact, slippage, minReceived, networkFee, onSlippage }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full py-1"
        style={{ color: T.colors.textSecondary, fontSize: T.typography.caption.fontSize }}
      >
        <span style={{ transition: `transform ${T.animation.durationFast}`, transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ▶
        </span>
        <span className="font-mono text-xs tracking-wider uppercase">Swap Details</span>
      </button>
      {open && (
        <div
          className="flex flex-col gap-2 p-3 rounded-xl"
          style={{
            backgroundColor: T.colors.blackOverlay,
            border: `${T.borders.thin} solid ${T.colors.surfaceBorder}`,
            animation: `fadeIn ${T.animation.durationNormal} ${T.animation.easeOut}`,
          }}
        >
          <Row label="Exchange Rate" value={`1 ION = $${rate.toFixed(4)}`} />
          <Row label="Price Impact" value={`${impact.toFixed(2)}%`} color={impact > 1 ? T.colors.negative : T.colors.neonCyan} />
          <Row
            label="Slippage"
            value={
              <span className="flex gap-1">
                {[0.1, 0.5, 1.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSlippage(s)}
                    className="px-1.5 rounded font-mono text-xs transition-all"
                    style={{
                      backgroundColor: slippage === s ? T.colors.cyanOverlay : 'transparent',
                      color: slippage === s ? T.colors.neonCyan : T.colors.textMuted,
                    }}
                  >
                    {s}%
                  </button>
                ))}
              </span>
            }
          />
          <Row label="Network Fee" value={`~${networkFee} BNB`} />
          <Divider />
          <Row label="Minimum Received" value={`${minReceived} USDT`} bold />
        </div>
      )}
    </>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode; color?: string; bold?: boolean }> =
  ({ label, value, color, bold }) => (
    <div className="flex justify-between items-center">
      <span style={{ fontSize: T.typography.caption.fontSize, color: T.colors.textSecondary }}>{label}</span>
      <span className="font-mono" style={{ fontSize: T.typography.caption.fontSize, color: color ?? T.colors.textPrimary, fontWeight: bold ? 700 : 400 }}>
        {value}
      </span>
    </div>
  );

const Divider: React.FC = () => (
  <div style={{ borderTop: `${T.borders.thin} solid ${T.colors.surfaceBorder}`, margin: T.dimensions.dividerMargin }} />
);

/** Token badge — icon + symbol */
const TokenBadge: React.FC<{ symbol: string; color: string }> = ({ symbol, color }) => (
  <div
    className="flex items-center gap-2 px-4 py-2 rounded-full shrink-0"
    style={{
      backgroundColor: T.colors.panelBg,
      border: `${T.borders.thin} solid ${color}55`,
    }}
  >
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center"
      style={{ backgroundColor: color }}
    >
      <span className="text-xs font-bold" style={{ color: T.colors.background }}>{symbol[0]}</span>
    </div>
    <span className="font-bold tracking-wider" style={{ fontSize: T.typography.body.fontSize, color: T.colors.textPrimary }}>
      {symbol}
    </span>
  </div>
);

/** Numeric input row with token selector + balance + MAX */
const TokenInput: React.FC<{
  label: string; balance: string; symbol: string; color: string;
  value: string; readOnly?: boolean; disabled?: boolean;
  onChange: (v: string) => void; borderGlow: boolean;
}> = ({ label, balance, symbol, color, value, readOnly, disabled, onChange, borderGlow }) => (
  <div
    className="flex flex-col gap-2 p-4 rounded-2xl transition-all"
    style={{
      backgroundColor: T.colors.background,
      border: `${T.borders.thick} solid ${borderGlow ? color : T.colors.surfaceBorder}`,
      boxShadow: borderGlow ? T.effects.inputGlowCyan : 'none',
    }}
  >
    <div className="flex justify-between items-center">
      <span style={{ fontSize: T.typography.caption.fontSize, color: T.colors.textSecondary }}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono" style={{ fontSize: T.typography.caption.fontSize, color: T.colors.textMuted }}>
          Balance: {balance}
        </span>
        {!readOnly && balance !== '—' && (
          <button
            onClick={() => onChange(balance)}
            className="px-2 py-0.5 rounded font-bold text-xs tracking-wider transition-all hover:scale-105"
            style={{ backgroundColor: T.colors.cyanOverlay, color: T.colors.neonCyan }}
          >
            MAX
          </button>
        )}
      </div>
    </div>
    <div className="flex items-center gap-3">
      <input
        type="number"
        placeholder="0.0"
        value={value}
        readOnly={readOnly}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent flex-1 focus:outline-none font-mono font-bold"
        style={{ fontSize: T.dimensions.inputValueSize, color: T.colors.textPrimary }}
      />
      <TokenBadge symbol={symbol} color={color} />
    </div>
  </div>
);

export const SwapPanel: React.FC = () => {
  const {
    fromAmount, toAmount, priceImpact, networkFee,
    isExecuting, validationError, exchangeRate,
    slippage, minReceived, poolData,
    updateFromAmount, executeSwapTransaction, setSlippage,
  } = useSwapState();

  const [flipped, setFlipped] = useState(false);

  const handleFlip = useCallback(() => setFlipped((f) => !f), []);

  const inputGlow = !!fromAmount && !validationError;
  const valid = !!fromAmount && !validationError && !isExecuting;

  return (
    <div className="col-span-12 lg:col-span-4 lg:col-start-5 md:col-span-8 md:col-start-3 px-2">
      {/* Outer glow shell */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: T.colors.background,
          boxShadow: T.effects.panelOuterGlowCyan,
        }}
      >
        {/* Glass panel */}
        <div
          className="relative z-10 flex flex-col gap-4"
          style={{
            background: T.gradients.glassPanel,
            backdropFilter: T.effects.glassBlur,
            WebkitBackdropFilter: T.effects.glassBlur,
            border: `${T.borders.thin} solid ${T.colors.panelBorder}`,
            borderRadius: T.spacing.borderRadius,
            padding: T.spacing.cardPadding,
            boxShadow: poolData ? T.effects.insetGlow : 'none',
          }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h2 style={{ fontSize: T.typography.heading.fontSize, fontWeight: T.typography.heading.fontWeight, color: T.colors.textPrimary, letterSpacing: '0.02em' }}>
                Swap
              </h2>
              <p className="mt-1" style={{ fontSize: T.typography.caption.fontSize, color: T.colors.textSecondary }}>
                PancakeSwap V3 · ION/WBNB
              </p>
            </div>
            {poolData && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: T.colors.cyanOverlay, border: `${T.borders.thin} solid ${T.colors.cyanBorder}` }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: T.colors.neonCyan }} />
                <span className="font-mono font-bold" style={{ fontSize: T.typography.caption.fontSize, color: T.colors.neonCyan }}>
                  1 ION ≈ ${poolData.ionPrice.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* ── You Pay ── */}
          <TokenInput
            label="You pay"
            balance={poolData ? `${poolData.reserveIon.toFixed(2)}` : '—'}
            symbol="ION"
            color={T.colors.neonCyan}
            value={fromAmount}
            disabled={isExecuting}
            onChange={updateFromAmount}
            borderGlow={inputGlow}
          />

          {/* ── Animated Swap Arrow ── */}
          <SwapArrow active={flipped} onClick={handleFlip} />

          {/* ── You Receive ── */}
          <TokenInput
            label="You receive"
            balance="—"
            symbol="USDT"
            color={T.colors.neonMagenta}
            value={toAmount}
            readOnly
            onChange={() => {}}
            borderGlow={!!toAmount}
          />

          {/* ── Collapsible Details ── */}
          {fromAmount && toAmount && (
            <SwapDetails
              rate={exchangeRate}
              impact={priceImpact}
              slippage={slippage}
              minReceived={minReceived}
              networkFee={networkFee}
              onSlippage={setSlippage}
            />
          )}

          {/* ── Swap Button ── */}
          <button
            disabled={!valid}
            onClick={executeSwapTransaction}
            className="relative w-full py-4 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: valid
                ? T.gradients.buttonPrimary
                : T.colors.disabledBg,
              color: valid ? T.colors.background : T.colors.disabledText,
              boxShadow: valid ? T.effects.actionShadowCyan : 'none',
              transition: `all ${T.animation.durationNormal} ${T.animation.easeOut}`,
            }}
            onMouseEnter={(e) => {
              if (valid) {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = T.effects.actionShadowCyanHover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = valid ? T.effects.actionShadowCyan : 'none';
            }}
          >
            {isExecuting ? 'Swapping...' : validationError || (!fromAmount ? 'Enter Amount' : 'Swap')}
          </button>

          {/* ── Footer badge ── */}
          {poolData && (
            <div className="text-center">
              <span className="font-mono" style={{ fontSize: T.dimensions.microTextSize, color: T.colors.textMuted }}>
                Data: PancakeSwap V3 on-chain · TVL: ${poolData.tvl.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Background radial glow */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${T.colors.neonCyan}10 0%, transparent 70%)` }}
        />
      </div>
    </div>
  );
};

export default SwapPanel;
