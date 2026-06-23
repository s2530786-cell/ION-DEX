'use client';

import React, { useState } from 'react';
import { DesignTokens as dt } from '@/lib/design-tokens';

interface StrategyConfig {
  name: string;
  type: 'grid' | 'trend' | 'arbitrage' | 'market_making';
  fundAmount: number;
  stopLoss: number;
  takeProfit: number;
  maxSlippage: number;
}

interface Props {
  onSubmit: (config: StrategyConfig) => void;
  initial?: Partial<StrategyConfig>;
}

export default function AiStrategyConfig({ onSubmit, initial }: Props) {
  const [name, setName] = useState(initial?.name || '');
  const [type, setType] = useState<StrategyConfig['type']>(initial?.type || 'grid');
  const [fundAmount, setFundAmount] = useState(initial?.fundAmount?.toString() || '');
  const [stopLoss, setStopLoss] = useState(initial?.stopLoss?.toString() || '');
  const [takeProfit, setTakeProfit] = useState(initial?.takeProfit?.toString() || '');
  const [maxSlippage, setMaxSlippage] = useState(initial?.maxSlippage?.toString() || '');
  const [errors, setErrors] = useState<string[]>([]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('Strategy name is required');
    const fa = parseFloat(fundAmount);
    if (!fa || fa <= 0) errs.push('Fund amount must be positive');
    const sl = parseFloat(stopLoss);
    if (!sl || sl <= 0) errs.push('Stop loss must be positive');
    const tp = parseFloat(takeProfit);
    if (!tp || tp <= 0) errs.push('Take profit must be positive');
    if (sl && tp && sl >= tp) errs.push('Stop loss must be less than take profit');
    const ms = parseFloat(maxSlippage);
    if (!ms || ms <= 0) errs.push('Max slippage must be positive');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      type,
      fundAmount: parseFloat(fundAmount),
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      maxSlippage: parseFloat(maxSlippage),
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${dt.spacing.sm} ${dt.spacing.md}`,
    borderRadius: dt.borderRadius.md,
    border: `1px solid ${dt.colors.surfaceBorder}`,
    background: dt.colors.inputBg,
    color: dt.colors.textPrimary,
    fontSize: dt.typography.body.fontSize,
    outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    color: dt.colors.textSecondary,
    fontSize: dt.typography.caption.fontSize,
    marginBottom: 4,
    display: 'block',
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      <h3 style={{
        color: dt.colors.textPrimary,
        fontSize: dt.typography.subheading.fontSize,
        marginBottom: dt.spacing.cardPadding,
        fontWeight: 600,
      }}>
        Configure Strategy
      </h3>

      {errors.length > 0 && (
        <div
          style={{
            background: dt.colors.errorBg,
            border: `1px solid ${dt.colors.errorBorder}`,
            borderRadius: dt.borderRadius.md,
            padding: dt.spacing.sm,
            marginBottom: dt.spacing.md,
          }}
        >
          {errors.map((e, i) => (
            <div key={i} style={{
              color: dt.colors.negative,
              fontSize: dt.typography.caption.fontSize,
              marginBottom: 2,
            }}>
              • {e}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: dt.spacing.md }}>
        <label style={labelStyle}>Strategy Name</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My Grid Bot"
        />
      </div>

      <div style={{ marginBottom: dt.spacing.md }}>
        <label style={labelStyle}>Strategy Type</label>
        <select
          style={selectStyle}
          value={type}
          onChange={(e) => setType(e.target.value as StrategyConfig['type'])}
        >
          <option value="grid">Grid Trading</option>
          <option value="trend">Trend Following</option>
          <option value="arbitrage">Arbitrage</option>
          <option value="market_making">Market Making</option>
        </select>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: dt.spacing.md,
        marginBottom: dt.spacing.md,
      }}>
        <div>
          <label style={labelStyle}>Fund Amount (USDT)</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            step="1"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
            placeholder="1000"
          />
        </div>
        <div>
          <label style={labelStyle}>Max Slippage (%)</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            step="0.1"
            value={maxSlippage}
            onChange={(e) => setMaxSlippage(e.target.value)}
            placeholder="0.5"
          />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: dt.spacing.md,
        marginBottom: dt.spacing.lg,
      }}>
        <div>
          <label style={labelStyle}>Stop Loss (%)</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            step="0.1"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="5"
          />
        </div>
        <div>
          <label style={labelStyle}>Take Profit (%)</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            step="0.1"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="20"
          />
        </div>
      </div>

      <button
        type="submit"
        style={{
          width: '100%',
          padding: `${dt.spacing.sm} ${dt.spacing.xl}`,
          borderRadius: dt.borderRadius.button,
          border: 'none',
          background: dt.colors.neonCyan,
          color: dt.colors.background,
          fontSize: dt.typography.body.fontSize,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
      >
        Create Strategy
      </button>
    </form>
  );
}
