'use client';

import React, { useState } from 'react';
import { DesignTokens as dt } from '@/lib/design-tokens';
import { DEXGridHarness } from '@/components/layout/DEXGridHarness';

// Types
interface Strategy {
  id: string;
  name: string;
  type: 'grid' | 'trend' | 'arbitrage' | 'market_making';
  riskLevel: 'Low' | 'Medium' | 'High';
  returnRate: number;
  runtime: number;
  fundSize: number;
  maxDrawdown: number;
  sharpeRatio: number;
  status: 'running' | 'paused' | 'draft';
}

type RiskFilter = 'All' | 'Low' | 'Medium' | 'High';
type SortKey = 'returnRate' | 'runtime' | 'fundSize';

// Mock data — real data from backend API in production
const MOCK_STRATEGIES: Strategy[] = [
  { id: 's1', name: 'ION Grid Alpha', type: 'grid', riskLevel: 'Low', returnRate: 18.5, runtime: 1_209_600, fundSize: 50_000, maxDrawdown: 3.2, sharpeRatio: 2.1, status: 'running' },
  { id: 's2', name: 'Trend Surfer v2', type: 'trend', riskLevel: 'Medium', returnRate: 34.2, runtime: 2_592_000, fundSize: 120_000, maxDrawdown: 8.7, sharpeRatio: 1.8, status: 'running' },
  { id: 's3', name: 'Arb Hunter Pro', type: 'arbitrage', riskLevel: 'Low', returnRate: 12.1, runtime: 5_184_000, fundSize: 200_000, maxDrawdown: 1.5, sharpeRatio: 3.4, status: 'running' },
  { id: 's4', name: 'ION MM Sentinel', type: 'market_making', riskLevel: 'High', returnRate: 52.8, runtime: 864_000, fundSize: 80_000, maxDrawdown: 15.3, sharpeRatio: 1.2, status: 'running' },
  { id: 's5', name: 'Mean Reversion X', type: 'trend', riskLevel: 'Medium', returnRate: 22.7, runtime: 1_728_000, fundSize: 65_000, maxDrawdown: 6.1, sharpeRatio: 1.9, status: 'paused' },
  { id: 's6', name: 'ION Stable Yield', type: 'grid', riskLevel: 'Low', returnRate: 9.3, runtime: 3_456_000, fundSize: 150_000, maxDrawdown: 0.8, sharpeRatio: 4.2, status: 'running' },
];

const RISK_COLORS: Record<string, string> = {
  Low: dt.neonGreen,
  Medium: dt.neonYellow,
  High: dt.neonRed,
};

const TYPE_LABELS: Record<string, string> = {
  grid: 'Grid',
  trend: 'Trend',
  arbitrage: 'Arbitrage',
  market_making: 'Market Making',
};

export default function AiMarketPage() {
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('All');
  const [sortBy, setSortBy] = useState<SortKey>('returnRate');
  const [selected, setSelected] = useState<Strategy | null>(null);

  const filtered = MOCK_STRATEGIES
    .filter((s) => riskFilter === 'All' || s.riskLevel === riskFilter)
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <DEXGridHarness>
      {/* Filters */}
      <div style={{ marginBottom: dt.spacingLg }}>
        <div style={{ display: 'flex', gap: dt.spacingMd, marginBottom: dt.spacingMd, flexWrap: 'wrap' }}>
          {(['All', 'Low', 'Medium', 'High'] as RiskFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              style={{
                padding: `${dt.spacingSm} ${dt.spacingMd}`,
                borderRadius: dt.borderRadius,
                border: `1px solid ${riskFilter === r ? dt.neonCyan : dt.glassBorder}`,
                background: riskFilter === r ? dt.glassBgHover : dt.glassBg,
                color: riskFilter === r ? dt.neonCyan : dt.textSecondary,
                fontSize: dt.fontSizeSm,
                fontWeight: riskFilter === r ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {r === 'All' ? 'All Risks' : r}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            style={{
              padding: `${dt.spacingSm} ${dt.spacingMd}`,
              borderRadius: dt.borderRadius,
              border: `1px solid ${dt.glassBorder}`,
              background: dt.glassBg,
              color: dt.textPrimary,
              fontSize: dt.fontSizeSm,
              marginLeft: 'auto',
            }}
          >
            <option value="returnRate">Sort by Return</option>
            <option value="runtime">Sort by Runtime</option>
            <option value="fundSize">Sort by Fund Size</option>
          </select>
        </div>
      </div>

      {/* Strategy Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: dt.spacingMd,
        }}
      >
        {filtered.map((s) => (
          <div
            key={s.id}
            onClick={() => setSelected(s)}
            style={{
              background: dt.glassBg,
              border: `1px solid ${dt.glassBorder}`,
              borderRadius: dt.borderRadius,
              padding: dt.spacingMd,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: dt.spacingSm }}>
              <span style={{ color: dt.textPrimary, fontWeight: 600, fontSize: dt.fontSizeMd }}>{s.name}</span>
              <span
                style={{
                  background: `${RISK_COLORS[s.riskLevel]}20`,
                  color: RISK_COLORS[s.riskLevel],
                  padding: `2px ${dt.spacingSm}`,
                  borderRadius: dt.borderRadius,
                  fontSize: dt.fontSizeXs,
                  fontWeight: 600,
                }}
              >
                {s.riskLevel}
              </span>
            </div>
            <div style={{ color: dt.textSecondary, fontSize: dt.fontSizeSm, marginBottom: dt.spacingSm }}>
              {TYPE_LABELS[s.type]} • {Math.floor(s.runtime / 86400)}d runtime
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: dt.neonCyan, fontSize: dt.fontSizeLg, fontWeight: 700 }}>
                  +{s.returnRate}%
                </div>
                <div style={{ color: dt.textTertiary, fontSize: dt.fontSizeXs }}>Return</div>
              </div>
              <div>
                <div style={{ color: dt.textPrimary, fontSize: dt.fontSizeLg, fontWeight: 700 }}>
                  ${(s.fundSize / 1000).toFixed(0)}K
                </div>
                <div style={{ color: dt.textTertiary, fontSize: dt.fontSizeXs }}>Fund Size</div>
              </div>
              <div>
                <div
                  style={{
                    color: s.status === 'running' ? dt.neonGreen : dt.neonYellow,
                    fontSize: dt.fontSizeSm,
                    fontWeight: 600,
                    padding: `2px ${dt.spacingSm}`,
                    border: `1px solid ${s.status === 'running' ? dt.neonGreen : dt.neonYellow}40`,
                    borderRadius: dt.borderRadius,
                    background: `${s.status === 'running' ? dt.neonGreen : dt.neonYellow}10`,
                  }}
                >
                  {s.status}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: dt.deepSpaceBg,
              border: `1px solid ${dt.glassBorder}`,
              borderRadius: dt.borderRadius,
              padding: dt.spacingLg,
              maxWidth: 480,
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: dt.spacingMd }}>
              <h2 style={{ color: dt.textPrimary, fontSize: dt.fontSizeXl, margin: 0 }}>{selected.name}</h2>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: dt.textSecondary,
                  fontSize: dt.fontSizeLg,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: dt.spacingMd, marginBottom: dt.spacingMd }}>
              <Stat label="Type" value={TYPE_LABELS[selected.type]} />
              <Stat label="Risk" value={selected.riskLevel} valueColor={RISK_COLORS[selected.riskLevel]} />
              <Stat label="Return" value={`+${selected.returnRate}%`} valueColor={dt.neonCyan} />
              <Stat label="Max Drawdown" value={`-${selected.maxDrawdown}%`} valueColor={dt.neonRed} />
              <Stat label="Sharpe Ratio" value={selected.sharpeRatio.toFixed(2)} />
              <Stat label="Runtime" value={`${Math.floor(selected.runtime / 86400)} days`} />
              <Stat label="Fund Size" value={`$${(selected.fundSize / 1000).toFixed(0)}K`} />
              <Stat label="Status" value={selected.status} valueColor={selected.status === 'running' ? dt.neonGreen : dt.neonYellow} />
            </div>
            {/* Backtest placeholder */}
            <div
              style={{
                height: 120,
                background: dt.glassBg,
                border: `1px solid ${dt.glassBorder}`,
                borderRadius: dt.borderRadius,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: dt.textTertiary,
                fontSize: dt.fontSizeSm,
              }}
            >
              Backtest chart — data from API
            </div>
          </div>
        </div>
      )}
    </DEXGridHarness>
  );
}

function Stat({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div>
      <div style={{ color: dt.textTertiary, fontSize: dt.fontSizeXs, marginBottom: 2 }}>{label}</div>
      <div style={{ color: valueColor || dt.textPrimary, fontSize: dt.fontSizeMd, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
