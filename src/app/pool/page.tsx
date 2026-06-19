'use client';

import React, { useMemo, useState } from 'react';
import { encodeFunctionData, parseUnits } from 'viem';
import { DEXGridHarness } from '@/components/layout/DEXGridHarness';
import { NeonCard } from '@/components/DEX/NeonCard';
import { PoolCard } from '@/components/DEX/PoolCard';
import { DesignTokens as T } from '@/lib/design-tokens';

interface Token { symbol: string; address: `0x${string}`; decimals: number; logoURI: string }
interface Pool { pair: string; token0: Token; token1: Token; tvl: number; apr: number; volume24h: number }
interface Position { pool: Pool; liquidity: string; token0Amount: string; token1Amount: string }

const TOKENS: Record<string, Token> = {
  ION: { symbol: 'ION', address: '0xe1ab61f7b093435204df32f5b3a405de55445ea8', decimals: 18, logoURI: '/assets/icons/ion-token.webp' },
  WBNB: { symbol: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18, logoURI: '/assets/icons/wbnb-token.webp' },
  USDT: { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, logoURI: '/assets/icons/usdt-token.webp' },
};

const NFPM = '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364' as const;
const POOLS: Pool[] = [
  { pair: 'ION/WBNB', token0: TOKENS.ION, token1: TOKENS.WBNB, tvl: 4_820_000, apr: 18.7, volume24h: 384_000 },
  { pair: 'ION/USDT', token0: TOKENS.ION, token1: TOKENS.USDT, tvl: 2_140_000, apr: 16.2, volume24h: 251_000 },
  { pair: 'WBNB/USDT', token0: TOKENS.WBNB, token1: TOKENS.USDT, tvl: 14_900_000, apr: 9.8, volume24h: 1_840_000 },
];

const POSITIONS: Position[] = [
  { pool: POOLS[0], liquidity: '$24.6K', token0Amount: '480000 ION', token1Amount: '13.58 WBNB' },
  { pool: POOLS[1], liquidity: '$8.2K', token0Amount: '222000 ION', token1Amount: '4100 USDT' },
];

const NFPM_ABI = [
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'payable',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'token0', type: 'address' },
        { name: 'token1', type: 'address' },
        { name: 'fee', type: 'uint24' },
        { name: 'tickLower', type: 'int24' },
        { name: 'tickUpper', type: 'int24' },
        { name: 'amount0Desired', type: 'uint256' },
        { name: 'amount1Desired', type: 'uint256' },
        { name: 'amount0Min', type: 'uint256' },
        { name: 'amount1Min', type: 'uint256' },
        { name: 'recipient', type: 'address' },
        { name: 'deadline', type: 'uint256' },
      ],
    }],
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'amount0', type: 'uint256' },
      { name: 'amount1', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'decreaseLiquidity',
    stateMutability: 'payable',
    inputs: [{ name: 'params', type: 'tuple', components: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'amount0Min', type: 'uint256' },
      { name: 'amount1Min', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ] }],
    outputs: [{ name: 'amount0', type: 'uint256' }, { name: 'amount1', type: 'uint256' }],
  },
  { type: 'function', name: 'collect', stateMutability: 'payable', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ name: 'amount0', type: 'uint256' }, { name: 'amount1', type: 'uint256' }] },
] as const;

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });
const money = (value: number) => `$${compact.format(value)}`;
const caption = T.typography.caption;

function StatRow({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'warning' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: T.spacing.elementGap }}>
      <span style={{ ...caption, color: T.colors.textSecondary }}>{label}</span>
      <span style={{ ...caption, color: tone === 'positive' ? T.colors.positive : tone === 'warning' ? T.colors.warning : T.colors.textPrimary, fontFamily: T.typography.dataValue.fontFamily }}>{value}</span>
    </div>
  );
}

function PoolList({ selected, onSelect }: { selected: Pool; onSelect: (pool: Pool) => void }) {
  return (
    <NeonCard title="Pool List" subtitle="PancakeSwap V3 subgraph-ready positions" variant="cyan">
      <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(4, 1fr)', gap: T.spacing.elementGap, color: T.colors.textMuted, ...caption }}>
          <span>Pair</span><span>TVL</span><span>APR</span><span>24h Volume</span><span>My Liquidity</span>
        </div>
        {POOLS.map((pool) => (
          <button
            key={pool.pair}
            type="button"
            onClick={() => onSelect(pool)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr repeat(4, 1fr)',
              gap: T.spacing.elementGap,
              alignItems: 'center',
              minHeight: T.inputs.height,
              borderRadius: T.inputs.borderRadius,
              border: `${T.borders.thin} solid ${selected.pair === pool.pair ? T.colors.cyanBorder : T.colors.surfaceBorder}`,
              background: selected.pair === pool.pair ? T.colors.cyanOverlay : T.colors.surfaceOverlay,
              color: T.colors.textPrimary,
              padding: T.inputs.padding,
            }}
          >
            <span>{pool.pair}</span>
            <span>{money(pool.tvl)}</span>
            <span style={{ color: T.colors.positive }}>{pool.apr.toFixed(2)}%</span>
            <span>{money(pool.volume24h)}</span>
            <span>{POSITIONS.find((position) => position.pool.pair === pool.pair)?.liquidity ?? money(0)}</span>
          </button>
        ))}
      </div>
    </NeonCard>
  );
}

function AddRemove({ pool }: { pool: Pool }) {
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const addCalldata = useMemo(() => {
    if (!amount0 || !amount1) return null;
    return encodeFunctionData({
      abi: NFPM_ABI,
      functionName: 'mint',
      args: [{
        token0: pool.token0.address,
        token1: pool.token1.address,
        fee: 2500,
        tickLower: -887220,
        tickUpper: 887220,
        amount0Desired: parseUnits(amount0, pool.token0.decimals),
        amount1Desired: parseUnits(amount1, pool.token1.decimals),
        amount0Min: 0n,
        amount1Min: 0n,
        recipient: '0x0000000000000000000000000000000000000000',
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
      }],
    });
  }, [amount0, amount1, pool]);

  const removeCalldata = encodeFunctionData({ abi: NFPM_ABI, functionName: 'decreaseLiquidity', args: [{ tokenId: 1n, liquidity: 1n, amount0Min: 0n, amount1Min: 0n, deadline: BigInt(Math.floor(Date.now() / 1000) + 1200) }] });

  return (
    <NeonCard title="Add / Remove Liquidity" subtitle={`NFPM ${NFPM.slice(0, 8)}…${NFPM.slice(-6)}`} variant="violet">
      <div style={{ display: 'grid', gap: T.spacing.sectionGap }}>
        <Input label={`${pool.token0.symbol} Amount`} value={amount0} onChange={setAmount0} />
        <Input label={`${pool.token1.symbol} Amount`} value={amount1} onChange={setAmount1} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: T.spacing.elementGap }}>
          <ActionButton enabled={!!addCalldata} label="Approve + Add" />
          <ActionButton enabled label="Decrease + Collect" variant="magenta" />
        </div>
        <span style={{ ...caption, color: T.colors.textMuted, wordBreak: 'break-all' }}>
          {addCalldata ? `mint calldata ${addCalldata.slice(0, 42)}…` : `remove calldata ${removeCalldata.slice(0, 42)}…`}
        </span>
      </div>
    </NeonCard>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: T.spacing.elementGap }}>
      <span style={{ ...caption, color: T.colors.textSecondary }}>{label}</span>
      <input
        value={value}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        placeholder="0.0"
        style={{ height: T.inputs.height, borderRadius: T.inputs.borderRadius, padding: T.inputs.padding, fontSize: T.inputs.fontSize, background: T.inputs.bg, border: `${T.borders.thick} solid ${T.colors.cyanBorder}`, color: T.colors.textPrimary, outlineColor: T.inputs.focusBorder }}
      />
    </label>
  );
}

function ActionButton({ label, enabled, variant = 'cyan' }: { label: string; enabled: boolean; variant?: 'cyan' | 'magenta' }) {
  return (
    <button type="button" disabled={!enabled} style={{ height: T.buttons.primary.height, borderRadius: T.buttons.primary.borderRadius, padding: T.buttons.primary.padding, background: enabled ? (variant === 'cyan' ? T.gradients.buttonPrimary : T.gradients.buttonPrimaryViolet) : T.colors.disabledBg, color: enabled ? T.colors.background : T.colors.disabledText, border: variant === 'cyan' ? T.borders.glowCyan : T.borders.glowViolet, boxShadow: enabled ? T.effects.actionShadowCyan : T.effects.insetGlow, fontSize: T.typography.buttonLabel.fontSize, fontWeight: T.typography.buttonLabel.fontWeight, letterSpacing: T.typography.buttonLabel.letterSpacing, textTransform: T.typography.buttonLabel.textTransform }}>{label}</button>
  );
}

export default function PoolPage() {
  const [selected, setSelected] = useState(POOLS[0]);
  const tvl = POOLS.reduce((sum, pool) => sum + pool.tvl, 0);
  const volume = POOLS.reduce((sum, pool) => sum + pool.volume24h, 0);
  const fees = volume * 0.0025;

  return (
    <DEXGridHarness>
      <aside style={{ gridColumn: T.grid.leftColumn, display: 'grid', gap: T.spacing.gridGap }}>
        <NeonCard title="My Positions" subtitle="Position NFTs" variant="cyan">
          <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
            {POSITIONS.map((position) => <StatRow key={position.pool.pair} label={position.pool.pair} value={`${position.liquidity} · ${position.token0Amount}`} tone="positive" />)}
          </div>
        </NeonCard>
        <PoolCard tvl={money(tvl)} apr={`${selected.apr.toFixed(1)}%`} />
      </aside>
      <main style={{ gridColumn: T.grid.centerColumn, display: 'grid', gap: T.spacing.gridGap }}>
        <PoolList selected={selected} onSelect={setSelected} />
        <AddRemove pool={selected} />
      </main>
      <aside style={{ gridColumn: T.grid.rightColumn, display: 'grid', gap: T.spacing.gridGap }}>
        <NeonCard title="Stats" subtitle="TVL / Volume / Fees" variant="magenta">
          <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
            <StatRow label="TVL" value={money(tvl)} tone="positive" />
            <StatRow label="24h Volume" value={money(volume)} />
            <StatRow label="Fees" value={money(fees)} tone="warning" />
          </div>
        </NeonCard>
      </aside>
    </DEXGridHarness>
  );
}
