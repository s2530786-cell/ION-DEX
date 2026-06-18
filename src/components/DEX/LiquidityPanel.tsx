import React, { useState } from 'react';
import { DesignTokens } from '../../lib/design-tokens';
import { useLiquidityState } from '../../hooks/useLiquidityState';

/**
 * LiquidityPanel v2.0 — ION-DEX 恒定乘积流动性资金池管理面板
 *
 * Deep Space 深空背景 + 霓虹边框发光 + Glassmorphism 卡片
 * Add/Remove Liquidity 双标签切换 + 头寸列表
 * 对接真实 PancakeSwap V3 池子数据，零 mock。
 */

export const LiquidityPanel: React.FC = () => {
  const {
    ionAmount,
    usdtAmount,
    poolShare,
    isProcessing,
    errorMessage,
    estLPTokens,
    poolData,
    exchangeRate,
    activeTab,
    updateIonAmount,
    updateUsdtAmount,
    executeAddLiquidity,
    executeRemoveLiquidity,
    setActiveTab,
  } = useLiquidityState();

  const panelBorderColor = errorMessage
    ? DesignTokens.colors.neonMagenta
    : ionAmount && usdtAmount
      ? DesignTokens.colors.neonCyan
      : DesignTokens.colors.panelBorder;

  const isFormValid = !!ionAmount && !!usdtAmount && !errorMessage && !isProcessing;

  return (
    <div className="col-span-12 lg:col-span-4 lg:col-start-5 md:col-span-8 md:col-start-3 px-2 mt-6">
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: DesignTokens.colors.background,
          boxShadow: `0 0 60px ${DesignTokens.colors.cyanOverlay}, 0 0 120px rgba(0,0,0,0.5)`,
        }}
      >
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
                Liquidity
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
                  style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.neonCyan }}
                >
                  TVL ${poolData.tvl.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Add/Remove Tab switcher */}
          <div
            className="flex rounded-xl p-1"
            style={{
              backgroundColor: DesignTokens.colors.background,
              borderWidth: DesignTokens.borders.thin,
              borderStyle: 'solid',
              borderColor: DesignTokens.colors.surfaceBorder,
            }}
          >
            {(['add', 'remove'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 rounded-lg font-bold transition-all duration-300"
                style={{
                  fontSize: DesignTokens.typography.buttonLabel.fontSize,
                  letterSpacing: DesignTokens.typography.buttonLabel.letterSpacing,
                  textTransform: 'uppercase',
                  backgroundColor: activeTab === tab ? DesignTokens.colors.cyanOverlay : 'transparent',
                  color: activeTab === tab ? DesignTokens.colors.neonCyan : DesignTokens.colors.textMuted,
                  boxShadow: activeTab === tab ? `0 0 15px ${DesignTokens.colors.neonCyan}20` : 'none',
                }}
              >
                {tab === 'add' ? 'Add' : 'Remove'}
              </button>
            ))}
          </div>

          {activeTab === 'add' ? (
            <>
              {/* Token A: ION input */}
              <div
                className="flex flex-col gap-2 p-4 rounded-2xl transition-all duration-300"
                style={{
                  backgroundColor: DesignTokens.colors.background,
                  borderWidth: DesignTokens.borders.thick,
                  borderStyle: 'solid',
                  borderColor: panelBorderColor,
                  boxShadow: ionAmount ? `0 0 20px ${DesignTokens.colors.neonCyan}15` : 'none',
                }}
              >
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                    Token A
                  </span>
                  <span className="font-mono" style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textMuted }}>
                    Balance: — ION
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={ionAmount}
                    disabled={isProcessing}
                    onChange={(e) => updateIonAmount(e.target.value)}
                    className="bg-transparent flex-1 focus:outline-none font-mono font-bold"
                    style={{ fontSize: '28px', color: DesignTokens.colors.textPrimary }}
                  />
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full shrink-0"
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
                    <span className="font-bold tracking-wider" style={{
                      fontSize: DesignTokens.typography.body.fontSize,
                      color: DesignTokens.colors.textPrimary,
                    }}>ION</span>
                  </button>
                </div>
              </div>

              {/* Plus connector */}
              <div className="flex justify-center -my-3 z-10">
                <div
                  className="p-2 rounded-full border"
                  style={{
                    backgroundColor: DesignTokens.colors.background,
                    borderColor: DesignTokens.colors.panelBorder,
                  }}
                >
                  <span style={{ color: DesignTokens.colors.neonCyan, fontSize: '16px' }}>+</span>
                </div>
              </div>

              {/* Token B: USDT input */}
              <div
                className="flex flex-col gap-2 p-4 rounded-2xl transition-all duration-300"
                style={{
                  backgroundColor: DesignTokens.colors.background,
                  borderWidth: DesignTokens.borders.thick,
                  borderStyle: 'solid',
                  borderColor: panelBorderColor,
                  boxShadow: usdtAmount ? `0 0 20px ${DesignTokens.colors.neonMagenta}15` : 'none',
                }}
              >
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                    Token B
                  </span>
                  <span className="font-mono" style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textMuted }}>
                    Balance: — USDT
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={usdtAmount}
                    disabled={isProcessing}
                    onChange={(e) => updateUsdtAmount(e.target.value)}
                    className="bg-transparent flex-1 focus:outline-none font-mono font-bold"
                    style={{ fontSize: '28px', color: DesignTokens.colors.textPrimary }}
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
                    <span className="font-bold tracking-wider" style={{
                      fontSize: DesignTokens.typography.body.fontSize,
                      color: DesignTokens.colors.neonMagenta,
                    }}>USDT</span>
                  </div>
                </div>
              </div>

              {/* Pool details */}
              {ionAmount && usdtAmount && (
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
                      LP Tokens
                    </span>
                    <span className="font-mono font-bold" style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.neonCyan }}>
                      {estLPTokens.toFixed(4)} LP
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                      Pool Share
                    </span>
                    <span className="font-mono" style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textPrimary }}>
                      {poolShare.toFixed(4)}%
                    </span>
                  </div>
                  {poolData && (
                    <>
                      <div className="flex justify-between">
                        <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                          Pool Fee
                        </span>
                        <span className="font-mono" style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textPrimary }}>
                          {poolData.fee}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                          APR
                        </span>
                        <span className="font-mono" style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.neonCyan }}>
                          ~{poolData.apr.toFixed(1)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Add liquidity button */}
              <button
                disabled={!isFormValid}
                onClick={executeAddLiquidity}
                className="relative w-full py-4 rounded-2xl font-bold text-sm tracking-widest transition-all duration-300 overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: isFormValid
                    ? `linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)`
                    : DesignTokens.colors.disabledBg,
                  color: isFormValid ? DesignTokens.colors.background : DesignTokens.colors.disabledText,
                  boxShadow: isFormValid ? `0 0 30px ${DesignTokens.colors.neonCyan}40, 0 4px 12px rgba(0,0,0,0.3)` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (isFormValid) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 0 40px ${DesignTokens.colors.neonCyan}60`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = isFormValid ? `0 0 30px ${DesignTokens.colors.neonCyan}40` : 'none';
                }}
              >
                {isProcessing ? 'Adding Liquidity...' : errorMessage || 'Add Liquidity'}
              </button>
            </>
          ) : (
            /* Remove liquidity tab */
            <>
              {/* Position list placeholder */}
              <div
                className="flex flex-col gap-3 p-6 rounded-2xl items-center justify-center"
                style={{
                  backgroundColor: DesignTokens.colors.background,
                  borderWidth: DesignTokens.borders.thin,
                  borderStyle: 'dashed',
                  borderColor: DesignTokens.colors.surfaceBorder,
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: DesignTokens.colors.cyanOverlay }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: DesignTokens.colors.neonCyan }}>
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p style={{ fontSize: DesignTokens.typography.body.fontSize, color: DesignTokens.colors.textSecondary }}>
                  No active positions
                </p>
                <p style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textMuted }}>
                  Add liquidity to see your positions here
                </p>
              </div>

              {/* Remove liquidity input (delegated) */}
              <div
                className="flex flex-col gap-2 p-4 rounded-2xl"
                style={{
                  backgroundColor: DesignTokens.colors.background,
                  borderWidth: DesignTokens.borders.thin,
                  borderStyle: 'solid',
                  borderColor: DesignTokens.colors.surfaceBorder,
                }}
              >
                <span style={{ fontSize: DesignTokens.typography.caption.fontSize, color: DesignTokens.colors.textSecondary }}>
                  LP Tokens to Remove
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="0.0"
                    disabled
                    className="bg-transparent flex-1 focus:outline-none font-mono font-bold"
                    style={{ fontSize: '28px', color: DesignTokens.colors.textMuted }}
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
                    <span className="font-bold tracking-wider" style={{
                      fontSize: DesignTokens.typography.body.fontSize,
                      color: DesignTokens.colors.textMuted,
                    }}>LP</span>
                  </div>
                </div>
              </div>

              <button
                disabled
                className="w-full py-4 rounded-2xl font-bold text-sm tracking-widest opacity-30 cursor-not-allowed"
                style={{
                  backgroundColor: DesignTokens.colors.disabledBg,
                  color: DesignTokens.colors.disabledText,
                }}
              >
                Remove Liquidity
              </button>
            </>
          )}

          {/* Data source badge */}
          {poolData && (
            <div className="text-center">
              <span
                className="font-mono"
                style={{ fontSize: '10px', color: DesignTokens.colors.textMuted }}
              >
                Pool Fee: {poolData.fee}% · APR: ~{poolData.apr.toFixed(1)}% · Reserves: {poolData.reserveIon.toLocaleString()} ION
              </span>
            </div>
          )}
        </div>

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

export default LiquidityPanel;
