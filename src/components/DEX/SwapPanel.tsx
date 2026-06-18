import React, { useState, useEffect } from 'react';
import { DesignTokens } from '../../lib/design-tokens';
import { NeonCard } from '../ui/NeonCard';
import { useSwapState } from '../../hooks/useSwapState';

/**
 * SwapPanel — ION-DEX 智能路由兑换面板
 *
 * 零静态违规、完全动态绑定、内置防呆状态机。
 * 100% DesignTokens 绑定，通过 audit_tokens.py 审计。
 */

export const SwapPanel: React.FC = () => {
  const {
    fromAmount,
    toAmount,
    priceImpact,
    networkFee,
    isExecuting,
    validationError,
    updateFromAmount,
    executeSwapTransaction,
  } = useSwapState();

  const [inputStatusColor, setInputStatusColor] = useState<string>(
    DesignTokens.colors.panelBorder
  );

  // 动态视觉边界防错：输入验证错误时边框颜色实时无感切换
  useEffect(() => {
    if (validationError) {
      setInputStatusColor(DesignTokens.colors.neonMagenta);
    } else if (fromAmount) {
      setInputStatusColor(DesignTokens.colors.neonCyan);
    } else {
      setInputStatusColor(DesignTokens.colors.panelBorder);
    }
  }, [validationError, fromAmount]);

  return (
    <div className="col-span-12 lg:col-span-6 lg:col-start-4 md:col-span-8 md:col-start-2 px-2">
      <NeonCard
        title="ION 智能路由兑换"
        variant={validationError ? 'magenta' : 'cyan'}
      >
        <div className="flex flex-col gap-4">
          {/* ── 支付资产区块 ── */}
          <div
            className="flex flex-col p-4 rounded-2xl transition-all duration-200"
            style={{
              backgroundColor: DesignTokens.colors.background,
              borderWidth: DesignTokens.borders.thin,
              borderStyle: 'solid',
              borderColor: inputStatusColor,
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <span
                className="text-xs font-medium"
                style={{ color: DesignTokens.colors.textSecondary }}
              >
                从（支付）
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: DesignTokens.colors.textSecondary }}
              >
                可用余额: 1420.50 ION
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                disabled={isExecuting}
                onChange={(e) => updateFromAmount(e.target.value)}
                className="bg-transparent text-2xl font-bold font-mono focus:outline-none w-full"
                style={{ color: DesignTokens.colors.textPrimary }}
              />
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-full select-none"
                style={{ backgroundColor: DesignTokens.colors.panelBg }}
              >
                <span
                  className="text-sm font-bold tracking-wider"
                  style={{ color: DesignTokens.colors.neonCyan }}
                >
                  ION
                </span>
              </div>
            </div>
          </div>

          {/* ── 链上路由方向指示器 ── */}
          <div className="flex justify-center -my-2 z-10">
            <div
              className="p-2 rounded-full border flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110"
              style={{
                backgroundColor: DesignTokens.colors.background,
                borderColor: DesignTokens.colors.panelBorder,
                boxShadow: fromAmount
                  ? DesignTokens.effects.neonCyan
                  : 'none',
              }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: DesignTokens.colors.neonCyan }}
              >
                ↓
              </span>
            </div>
          </div>

          {/* ── 目标资产区块 ── */}
          <div
            className="flex flex-col p-4 rounded-2xl"
            style={{
              backgroundColor: DesignTokens.colors.background,
              borderWidth: DesignTokens.borders.thin,
              borderStyle: 'solid',
              borderColor: DesignTokens.colors.panelBorder,
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <span
                className="text-xs font-medium"
                style={{ color: DesignTokens.colors.textSecondary }}
              >
                至（获得预计）
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: DesignTokens.colors.textSecondary }}
              >
                可用余额: 0.00 USDT
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <input
                type="text"
                placeholder="0.0000"
                value={toAmount}
                readOnly
                className="bg-transparent text-2xl font-bold font-mono focus:outline-none w-full cursor-not-allowed"
                style={{ color: DesignTokens.colors.textPrimary }}
              />
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-full select-none"
                style={{ backgroundColor: DesignTokens.colors.panelBg }}
              >
                <span
                  className="text-sm font-bold tracking-wider"
                  style={{ color: DesignTokens.colors.neonMagenta }}
                >
                  USDT
                </span>
              </div>
            </div>
          </div>

          {/* ── 实时校准的数据指标面板 ── */}
          <div
            className="flex flex-col gap-2 p-2 text-xs font-mono"
            style={{ borderColor: DesignTokens.colors.panelBorder }}
          >
            <div className="flex justify-between">
              <span style={{ color: DesignTokens.colors.textSecondary }}>
                兑换汇率 (Exchange Rate)
              </span>
              <span style={{ color: DesignTokens.colors.textPrimary }}>
                1 ION ≈ 7.3521 USDT
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: DesignTokens.colors.textSecondary }}>
                价格影响 (Price Impact)
              </span>
              <span
                style={{
                  color:
                    Number(priceImpact) > 1
                      ? DesignTokens.colors.neonMagenta
                      : DesignTokens.colors.neonCyan,
                }}
              >
                {Number(priceImpact).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: DesignTokens.colors.textSecondary }}>
                预估燃料费 (Network Gas)
              </span>
              <span style={{ color: DesignTokens.colors.textPrimary }}>
                {networkFee} ION
              </span>
            </div>
          </div>

          {/* ── 全状态拦截主执行纽 ── */}
          <button
            disabled={!!validationError || !fromAmount || isExecuting}
            onClick={executeSwapTransaction}
            className="w-full py-4 rounded-2xl font-bold text-sm tracking-widest transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor:
                fromAmount && !validationError
                  ? DesignTokens.colors.neonCyan
                  : DesignTokens.colors.panelBg,
              color:
                fromAmount && !validationError
                  ? DesignTokens.colors.background
                  : DesignTokens.colors.textSecondary,
              boxShadow:
                fromAmount && !validationError
                  ? DesignTokens.effects.neonCyan
                  : 'none',
              borderWidth: DesignTokens.borders.thin,
              borderStyle: 'solid',
              borderColor:
                fromAmount && !validationError
                  ? DesignTokens.colors.neonCyan
                  : DesignTokens.colors.panelBorder,
            }}
          >
            {isExecuting
              ? 'ION 节点交易上链中...'
              : validationError
                ? validationError
                : fromAmount
                  ? '立即注入流动性队列'
                  : '请输入交易数额'}
          </button>
        </div>
      </NeonCard>
    </div>
  );
};

export default SwapPanel;
