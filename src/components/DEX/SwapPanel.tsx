import React, { useState } from 'react';
import { DesignTokens } from '../../lib/design-tokens';
import { NeonCard } from '../ui/NeonCard';
import { useSwapState } from '../../hooks/useSwapState';

/**
 * SwapPanel v2.0 — ION-DEX 智能路由兑换面板
 *
 * Deep Space 深空背景 + 霓虹边框发光 + Glassmorphism 卡片
 * 对接真实 PancakeSwap V3 池子数据，零 mock。
 */

export const SwapPanel: React.FC = () => {
  const {
    fromAmount,
    toAmount,
    priceImpact,
    networkFee,
    isExecuting,
    validationError,
    exchangeRate,
    slippage,
    minReceived,
    poolData,
    updateFromAmount,
    executeSwapTransaction,
    setSlippage,
  } = useSwapState();

  const [detailsOpen, setDetailsOpen] = useState(false);

  const inputBorderColor = validationError
    ? DesignTokens.colors.neonMagenta
    : fromAmount
      ? DesignTokens.colors.neonCyan
      : DesignTokens.colors.surfaceBorder;

  return (
    <div className="col-span-12 lg:col-span-4 lg:col-start-5 md:col-span-8 md:col-start-3 px-2">
      {/* Deep Space background wrapper */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: DesignTokens.colors.background,
          boxShadow: `0 0 60px ${DesignTokens.colors.cyanOverlay}, 0 0 120px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Glassmorphism panel */}
        <div
          className="relative z-10 flex flex-col gap-5"
          style={{
            backgroundColor: DesignTokens.colors.glassBase,
            backdropFilter: DesignTokens.effects.glassBlur,
            WebkitBackdropFilter: DesignTokens.effects.glassBlur,
            borderWidth: DesignTokens.borders.thin,
            borderStyle: 'solid',
            borderColor: DesignTokens.colors.panelBorder,
            borderRadius: DesignTokens.spacing.borderRadius,
            padding: DesignTokens.spacing.cardPadding,
            boxShadow: poolData
              ? `inset 0 0 40px ${DesignTokens.colors.cyanOverlay}`
              : 'none',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="font-bold tracking-wide"
                style={{
                  fontSize: DesignTokens.typography.heading.fontSize,
                  fontWeight: DesignTokens.typography.heading.fontWeight,
                  color: DesignTokens.colors.textPrimary,
                }}
              >
                Swap
              </h2>
              <p
                className="mt-1"
                style={{
                  fontSize: DesignTokens.typography.caption.fontSize,
                  color: DesignTokens.colors.textSecondary,
                }}
              >
                PancakeSwap V3 · ION/WBNB
              </p>
            </div>
            {/* Pool data badge */}
            {poolData && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: DesignTokens.colors.cyanOverlay,
                  borderWidth: DesignTokens.borders.thin,
                  borderStyle: 'solid',
                  borderColor: DesignTokens.colors.cyanBorder,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: DesignTokens.colors.neonCyan }}
                />
                <span
                  className="font-mono font-bold"
                  style={{
                    fontSize: DesignTokens.typography.caption.fontSize,
                    color: DesignTokens.colors.neonCyan,
                  }}
                >
                  1 ION ≈ ${poolData.ionPrice.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* From token input */}
          <div
            className="flex flex-col gap-2 p-4 rounded-2xl transition-all duration-300"
            style={{
              backgroundColor: DesignTokens.colors.background,
              borderWidth: DesignTokens.borders.thick,
              borderStyle: 'solid',
              borderColor: inputBorderColor,
              boxShadow: fromAmount
                ? `0 0 20px ${DesignTokens.colors.neonCyan}15`
                : 'none',
            }}
          >
            <div className="flex justify-between items-center">
              <span
                style={{
                  fontSize: DesignTokens.typography.caption.fontSize,
                  color: DesignTokens.colors.textSecondary,
                }}
              >
                You pay
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: DesignTokens.typography.caption.fontSize,
                  color: DesignTokens.colors.textMuted,
                }}
              >
                Balance: {poolData ? '—' : 'Loading...'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                disabled={isExecuting}
                onChange={(e) => updateFromAmount(e.target.value)}
                className="bg-transparent flex-1 focus:outline-none font-mono font-bold"
                style={{
                  fontSize: '28px',
                  color: DesignTokens.colors.textPrimary,
                }}
              />
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 shrink-0"
                style={{
                  backgroundColor: DesignTokens.colors.panelBg,
                  borderWidth: DesignTokens.borders.thin,
                  borderStyle: 'solid',
                  borderColor: DesignTokens.colors.cyanBorder,
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: DesignTokens.colors.neonCyan }}
                >
                  <span className="text-xs font-bold" style={{ color: DesignTokens.colors.background }}>I</span>
                </div>
                <span
                  className="font-bold tracking-wider"
                  style={{
                    fontSize: DesignTokens.typography.body.fontSize,
                    color: DesignTokens.colors.textPrimary,
                  }}
                >
                  ION
                </span>
              </button>
            </div>
          </div>

          {/* Swap direction arrow */}
          <div className="flex justify-center -my-3 z-10">
            <button
              className="p-2.5 rounded-full border transition-all duration-300 hover:rotate-180"
              style={{
                backgroundColor: DesignTokens.colors.background,
                borderColor: DesignTokens.colors.panelBorder,
                boxShadow: fromAmount
                  ? `0 0 15px ${DesignTokens.colors.neonCyan}30`
                  : 'none',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: DesignTokens.colors.neonCyan }}
              >
                <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* To token output */}
          <div
            className="flex flex-col gap-2 p-4 rounded-2xl transition-all duration-300"
            style={{
              backgroundColor: DesignTokens.colors.background,
              borderWidth: DesignTokens.borders.thin,
              borderStyle: 'solid',
              borderColor: DesignTokens.colors.panelBorder,
            }}
          >
            <div className="flex justify-between items-center">
              <span
                style={{
                  fontSize: DesignTokens.typography.caption.fontSize,
                  color: DesignTokens.colors.textSecondary,
                }}
              >
                You receive
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: DesignTokens.typography.caption.fontSize,
                  color: DesignTokens.colors.textMuted,
                }}
              >
                Estimated
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="0.0000"
                value={toAmount}
                readOnly
                className="bg-transparent flex-1 focus:outline-none font-mono font-bold cursor-default"
                style={{
                  fontSize: '28px',
                  color: DesignTokens.colors.textPrimary,
                }}
              />
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full shrink-0"
                style={{
                  backgroundColor: DesignTokens.colors.panelBg,
                  borderWidth: DesignTokens.borders.thin,
                  borderStyle: 'solid',
                  borderColor: DesignTokens.colors.surfaceBorder,
                }}
              >
                <span
                  className="font-bold tracking-wider"
                  style={{
                    fontSize: DesignTokens.typography.body.fontSize,
                    color: DesignTokens.colors.textSecondary,
                  }}
                >
                  USDT
                </span>
              </div>
            </div>
          </div>

          {/* Details collapse section */}
          {fromAmount && toAmount && (
            <>
              <button
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="flex items-center justify-between w-full py-2 transition-colors"
                style={{ color: DesignTokens.colors.textSecondary }}
              >
                <span
                  className="font-mono"
                  style={{ fontSize: DesignTokens.typography.caption.fontSize }}
                >
                  {detailsOpen ? '▼' : '▶'} Swap Details
                </span>
              </button>

              {detailsOpen && (
                <div
                  className="flex flex-col gap-2.5 p-3 rounded-xl"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderWidth: DesignTokens.borders.thin,
                    borderStyle: 'solid',
                    borderColor: DesignTokens.colors.surfaceBorder,
                  }}
                >
                  <div className="flex justify-between">
                    <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                      Exchange Rate
                    </span>
                    <span className="font-mono" style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textPrimary }}>
                      1 ION = ${exchangeRate.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                      Price Impact
                    </span>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: DesignTokens.typography.caption.fontSize,
                        color: priceImpact > 1 ? DesignTokens.colors.negative : DesignTokens.colors.neonCyan,
                      }}
                    >
                      {priceImpact.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                      Slippage Tolerance
                    </span>
                    <div className="flex gap-1">
                      {[0.1, 0.5, 1.0].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSlippage(s)}
                          className="px-1.5 rounded font-mono transition-all"
                          style={{
                            fontSize: DesignTokens.typography.caption.fontSize,
                            backgroundColor: slippage === s ? DesignTokens.colors.cyanOverlay : 'transparent',
                            color: slippage === s ? DesignTokens.colors.neonCyan : DesignTokens.colors.textMuted,
                          }}
                        >
                          {s}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                      Network Fee
                    </span>
                    <span className="font-mono" style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textPrimary }}>
                      ~{networkFee} BNB
                    </span>
                  </div>
                  <div
                    className="flex justify-between pt-2"
                    style={{ borderTopWidth: DesignTokens.borders.thin, borderTopStyle: 'solid', borderTopColor: DesignTokens.colors.surfaceBorder }}
                  >
                    <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                      Minimum Received
                    </span>
                    <span className="font-mono font-bold" style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textPrimary }}>
                      {minReceived} USDT
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Swap button with gradient hover */}
          <button
            disabled={!!validationError || !fromAmount || isExecuting}
            onClick={executeSwapTransaction}
            className="relative w-full py-4 rounded-2xl font-bold text-sm tracking-widest transition-all duration-300 overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: fromAmount && !validationError && !isExecuting
                ? `linear-gradient(135deg, ${DesignTokens.colors.neonCyan} 0%, #0088cc 100%)`
                : DesignTokens.colors.disabledBg,
              color: fromAmount && !validationError && !isExecuting
                ? DesignTokens.colors.background
                : DesignTokens.colors.disabledText,
              boxShadow: fromAmount && !validationError && !isExecuting
                ? `0 0 30px ${DesignTokens.colors.neonCyan}40, 0 4px 12px rgba(0,0,0,0.3)`
                : 'none',
              transform: fromAmount && !validationError ? 'scale(1)' : 'scale(0.98)',
            }}
            onMouseEnter={(e) => {
              if (fromAmount && !validationError) {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = `0 0 40px ${DesignTokens.colors.neonCyan}60, 0 8px 20px rgba(0,0,0,0.4)`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = fromAmount && !validationError
                ? `0 0 30px ${DesignTokens.colors.neonCyan}40, 0 4px 12px rgba(0,0,0,0.3)`
                : 'none';
            }}
          >
            {isExecuting
              ? 'Swapping...'
              : validationError
                ? validationError
                : fromAmount
                  ? 'Swap'
                  : 'Enter Amount'}
          </button>

          {/* Data source badge */}
          {poolData && (
            <div className="text-center">
              <span
                className="font-mono"
                style={{
                  fontSize: '10px',
                  color: DesignTokens.colors.textMuted,
                }}
              >
                Data: PancakeSwap V3 on-chain · TVL: ${poolData.tvl.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Background glow effect */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${DesignTokens.colors.neonCyan}10 0%, transparent 70%)`,
          }}
        />
      </div>
    </div>
  );
};

export default SwapPanel;
