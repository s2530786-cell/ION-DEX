'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { DEXGridHarness } from '@/components/layout/DEXGridHarness';
import { NeonCard } from '@/components/DEX/NeonCard';
import { DesignTokens as T } from '@/lib/design-tokens';

interface MarketData { price: number; priceChange24h: number; volume24h: number; tvl: number; marketCap: number }

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens/0xe1ab61f7b093435204df32f5b3a405de55445ea8';
const FALLBACK: MarketData = { price: 0.0184, priceChange24h: 6.2, volume24h: 1_280_000, tvl: 21_860_000, marketCap: 18_400_000 };
const QUICK = [
  { label: 'Swap', href: '/swap', copy: 'PancakeSwap V3 exactInputSingle' },
  { label: 'Pool', href: '/pool', copy: 'V3 LP positions and fees' },
  { label: 'Stake', href: '/stake', copy: 'FeeDistributor rewards' },
  { label: 'Bridge', href: '/bridge', copy: 'BSC ↔ ION transfer' },
];
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });
const money = (value: number) => `$${compact.format(value)}`;
const caption = T.typography.caption;

function row(label: string, value: string, tone?: 'positive' | 'negative' | 'warning') {
  return (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: T.spacing.elementGap }}>
      <span style={{ ...caption, color: T.colors.textSecondary }}>{label}</span>
      <span style={{ ...caption, color: tone === 'positive' ? T.colors.positive : tone === 'negative' ? T.colors.negative : tone === 'warning' ? T.colors.warning : T.colors.textPrimary, fontFamily: T.typography.dataValue.fontFamily }}>{value}</span>
    </div>
  );
}

function useMarketData() {
  const [data, setData] = useState<MarketData>(FALLBACK);
  const [source, setSource] = useState('fallback');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(DEXSCREENER_API, { cache: 'no-store' });
        const payload = await response.json() as { pairs?: Array<{ priceUsd?: string; priceChange?: { h24?: number }; volume?: { h24?: number }; fdv?: number; marketCap?: number; liquidity?: { usd?: number } }> };
        const pair = payload.pairs?.[0];
        if (!pair || !active) return;
        setData({
          price: Number(pair.priceUsd ?? FALLBACK.price),
          priceChange24h: Number(pair.priceChange?.h24 ?? FALLBACK.priceChange24h),
          volume24h: Number(pair.volume?.h24 ?? FALLBACK.volume24h),
          tvl: Number(pair.liquidity?.usd ?? FALLBACK.tvl),
          marketCap: Number(pair.marketCap ?? pair.fdv ?? FALLBACK.marketCap),
        });
        setSource('DexScreener');
      } catch {
        if (active) setSource('fallback');
      }
    }
    load();
    const timer = window.setInterval(load, 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  return { data, source };
}

function PriceChart({ data, source }: { data: MarketData; source: string }) {
  const points = useMemo(() => {
    const base = data.price || FALLBACK.price;
    return Array.from({ length: 24 }, (_, index) => {
      const drift = Math.sin(index / 2) * 0.07 + index * 0.004;
      return Math.max(base * (1 + drift), 0);
    });
  }, [data.price]);
  const max = Math.max(...points);
  const min = Math.min(...points);
  const polyline = points.map((point, index) => `${(index / (points.length - 1)) * 100},${100 - ((point - min) / Math.max(max - min, 0.000001)) * 84 - 8}`).join(' ');

  return (
    <NeonCard title="PriceChart" subtitle={`DexScreener API · auto-refresh 30s · ${source}`} variant="cyan">
      <div style={{ display: 'grid', gap: T.spacing.sectionGap }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: T.spacing.elementGap }}>
          <div>
            <div style={{ ...T.typography.poolStat, color: T.colors.textPrimary }}>${data.price.toFixed(6)}</div>
            <div style={{ ...caption, color: data.priceChange24h >= 0 ? T.colors.positive : T.colors.negative }}>24h {data.priceChange24h.toFixed(2)}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>{row('Volume', money(data.volume24h))}{row('TVL', money(data.tvl), 'positive')}</div>
        </div>
        <svg viewBox="0 0 100 100" role="img" aria-label="ION price line chart" style={{ width: '100%', height: T.dimensions.starfieldSize.split(' ')[1], borderRadius: T.spacing.borderRadius, background: T.gradients.starfield, border: `${T.borders.thin} solid ${T.colors.surfaceBorder}`, boxShadow: T.effects.neonCyan }}>
          <polyline fill="none" stroke={T.colors.neonCyan} strokeWidth={T.borders.thick} points={polyline} />
          <polyline fill="none" stroke={T.colors.neonMagenta} strokeWidth={T.borders.thin} opacity="0.55" points={polyline} transform="translate(0 4)" />
        </svg>
      </div>
    </NeonCard>
  );
}

function QuickCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: T.spacing.gridGap }}>
      {QUICK.map((item) => (
        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
          <NeonCard title={item.label} subtitle={item.copy} variant={item.label === 'Bridge' ? 'magenta' : 'violet'}>
            <div style={{ minHeight: T.buttons.primary.height, display: 'grid', placeItems: 'center', borderRadius: T.inputs.borderRadius, background: T.colors.cyanOverlay, border: `${T.borders.thin} solid ${T.colors.cyanBorder}`, color: T.colors.neonCyan, fontSize: T.typography.buttonLabel.fontSize, fontWeight: T.typography.buttonLabel.fontWeight, letterSpacing: T.typography.buttonLabel.letterSpacing, textTransform: T.typography.buttonLabel.textTransform }}>
              Open {item.label}
            </div>
          </NeonCard>
        </Link>
      ))}
    </div>
  );
}

export default function HomeDashboard() {
  const { data, source } = useMarketData();
  const portfolioValue = 12_840;
  const ionHoldings = portfolioValue / Math.max(data.price, 0.000001);

  return (
    <DEXGridHarness>
      <aside style={{ gridColumn: T.grid.leftColumn, display: 'grid', gap: T.spacing.gridGap }}>
        <NeonCard title="Portfolio" subtitle="Wallet-aware dashboard" variant="cyan">
          <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
            {row('ION Balance', `${compact.format(ionHoldings)} ION`, 'positive')}
            {row('Value', money(portfolioValue), 'positive')}
            {row('Pool Share', '$32.8K')}
            {row('Stake Rewards', '355.06 ION', 'warning')}
          </div>
        </NeonCard>
      </aside>
      <main style={{ gridColumn: T.grid.centerColumn, display: 'grid', gap: T.spacing.gridGap }}>
        <PriceChart data={data} source={source} />
        <QuickCards />
      </main>
      <aside style={{ gridColumn: T.grid.rightColumn }}>
        <NeonCard title="MarketStats" subtitle="TVL / Volume / MCap" variant="magenta">
          <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
            {row('TVL', money(data.tvl), 'positive')}
            {row('24hVolume', money(data.volume24h))}
            {row('MCap', money(data.marketCap), 'warning')}
            {row('PriceChange%', `${data.priceChange24h.toFixed(2)}%`, data.priceChange24h >= 0 ? 'positive' : 'negative')}
          </div>
        </NeonCard>
      </aside>
    </DEXGridHarness>
  );
}
