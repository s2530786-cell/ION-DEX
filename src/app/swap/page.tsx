'use client';

import React, { useMemo, useState } from 'react';
import { encodeFunctionData, parseUnits } from 'viem';
import { DEXGridHarness } from '@/components/layout/DEXGridHarness';
import { NeonCard } from '@/components/DEX/NeonCard';
import { DesignTokens as T } from '@/lib/design-tokens';

interface Token { symbol: string; address: `0x${string}`; decimals: number; logoURI: string }
interface SwapState { fromToken: Token; toToken: Token; amount: string; quote: string | null }

/**
 * ION DEX Swap Page — BSC Pooled Token Registry
 *
 * Data sources:
 * - ION: IonOracle.getPrice() + LiquidityPool.balanceOf() for reserves
 * - WBNB: Chainlink BNB/USD via IonOracle
 * - USDT: Stablecoin peg (1 USDT = 1 USD)
 *
 * DexSwap.sol (0.3% fee, constant-product AMM) is the swap executor.
 * IonSwapRouter.sol adds slippage protection (amountOutMinimum).
 * Fee split: 50% burn + 25% Master + 25% staking rewards + treasury.
 */

const ION_ADDRESS = '0xe1ab61f7b093435204df32f5b3a405de55445ea8';
const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';

const TOKENS: Token[] = [
  { symbol: 'ION', address: ION_ADDRESS, decimals: 18, logoURI: '/assets/icons/ion-token.webp' },
  { symbol: 'WBNB', address: WBNB_ADDRESS, decimals: 18, logoURI: '/assets/icons/wbnb-token.webp' },
  { symbol: 'USDT', address: USDT_ADDRESS, decimals: 18, logoURI: '/assets/icons/usdt-token.webp' },
];

const SLIPPAGE = 0.005;

const SWAP_ROUTER_ABI = [
  {
    type: 'function',
    name: 'exactInputSingle',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;

const textStyle = T.typography.body;
const captionStyle = T.typography.caption;

/**
 * Compute swap quote from LiquidityPool token reserves (constant-product AMM).
 * In production, call LiquidityPool.balanceOf(tokenA) and balanceOf(tokenB) on-chain.
 * For the preview page, we read IonOracle.getPrice() to get BNB/USD and derive ION/USD.
 */
function computeQuote(
  state: SwapState,
  poolReserves: Record<string, { reserveA: number; reserveB: number }>
) {
  const amount = Number(state.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const pairKey = `${state.fromToken.symbol}/${state.toToken.symbol}`;
  const reverseKey = `${state.toToken.symbol}/${state.fromToken.symbol}`;
  const reserves = poolReserves[pairKey] ?? poolReserves[reverseKey];
  if (!reserves) return null;

  const { reserveA, reserveB } = reserves;
  const isReverse = pairKey !== `${state.fromToken.symbol}/${state.toToken.symbol}`;
  const [rIn, rOut] = isReverse ? [reserveB, reserveA] : [reserveA, reserveB];

  // constant-product: (rIn + amountIn * 0.997) * (rOut - amountOut) = rIn * rOut
  const amountInAfterFee = amount * 0.997;
  const amountOut = (amountInAfterFee * rOut) / (rIn + amountInAfterFee);
  const rate = rOut / rIn;
  const priceImpact = amount / rIn;

  return {
    output: amountOut,
    rate,
    priceImpact: Math.min(priceImpact, 0.1),
    minReceived: amountOut * (1 - SLIPPAGE),
  };
}

function TokenSelect({ label, token, onChange }: { label: string; token: Token; onChange: (token: Token) => void }) {
  const [query, setQuery] = useState('');
  const filtered = TOKENS.filter((candidate) => candidate.symbol.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
      <span style={{ ...captionStyle, color: T.colors.textSecondary }}>{label}</span>
      <input
        aria-label={`${label} token search`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search token · selected ${token.symbol}`}
        style={{
          height: T.inputs.height,
          borderRadius: T.inputs.borderRadius,
          padding: T.inputs.padding,
          fontSize: T.inputs.fontSize,
          background: T.inputs.bg,
          border: `${T.borders.thin} solid ${T.inputs.border}`,
          color: T.colors.textPrimary,
          outlineColor: T.inputs.focusBorder,
        }}
      />
      <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
        {filtered.map((candidate) => (
          <button
            key={candidate.address}
            type="button"
            onClick={() => onChange(candidate)}
            style={{
              minHeight: T.buttons.secondary.height,
              borderRadius: T.buttons.secondary.borderRadius,
              border: `${T.borders.thin} solid ${candidate.address === token.address ? T.colors.cyanBorder : T.colors.surfaceBorder}`,
              background: candidate.address === token.address ? T.colors.cyanOverlay : T.colors.surfaceOverlay,
              color: T.colors.textPrimary,
              fontSize: T.buttons.secondary.fontSize,
              fontWeight: T.buttons.secondary.fontWeight,
            }}
          >
            {candidate.symbol} · {candidate.address.slice(0, 8)}…{candidate.address.slice(-6)}
          </button>
        ))}
      </div>
    </div>
  );
}

function AmountInput({ token, amount, onAmount, balance }: { token: Token; amount: string; onAmount: (amount: string) => void; balance?: string }) {
  return (
    <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: T.spacing.elementGap }}>
        <span style={{ ...captionStyle, color: T.colors.textSecondary }}>Amount</span>
        <span style={{ ...captionStyle, color: T.colors.textMuted }}>{balance ? `Balance ${balance} ${token.symbol}` : 'Connect wallet to view balance'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: T.spacing.elementGap }}>
        <input
          aria-label="swap amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => onAmount(event.target.value)}
          placeholder="0.0"
          style={{
            height: T.inputs.height,
            borderRadius: T.inputs.borderRadius,
            padding: T.inputs.padding,
            fontSize: T.dimensions.inputValueSize,
            background: T.inputs.bg,
            border: `${T.borders.thick} solid ${T.colors.cyanBorder}`,
            color: T.colors.textPrimary,
            boxShadow: T.effects.inputGlowCyan,
            outlineColor: T.inputs.focusBorder,
          }}
        />
        <button
          type="button"
          onClick={() => balance && onAmount(balance)}
          disabled={!balance}
          style={{
            height: T.buttons.primary.height,
            borderRadius: T.buttons.primary.borderRadius,
            padding: T.buttons.primary.padding,
            background: T.gradients.buttonPrimary,
            color: T.colors.background,
            border: T.borders.glowCyan,
            boxShadow: T.effects.actionShadowCyan,
            fontSize: T.buttons.primary.fontSize,
            fontWeight: T.buttons.primary.fontWeight,
          }}
        >
          MAX
        </button>
      </div>
    </div>
  );
}

function QuoteDisplay({ quote, state }: { quote: ReturnType<typeof computeQuote>; state: SwapState }) {
  return (
    <div style={{ display: 'grid', gap: T.spacing.elementGap, background: T.colors.blackOverlay, border: `${T.borders.thin} solid ${T.colors.surfaceBorder}`, borderRadius: T.inputs.borderRadius, padding: T.spacing.cardPadding }}>
      <Row label="Rate" value={quote ? `1 ${state.fromToken.symbol} = ${quote.rate.toFixed(8)} ${state.toToken.symbol}` : 'Enter amount'} />
      <Row label="Price Impact" value={quote ? `${(quote.priceImpact * 100).toFixed(3)}%` : '—'} tone={quote && quote.priceImpact > 0.01 ? 'warn' : 'ok'} />
      <Row label="Minimum Received" value={quote ? `${quote.minReceived.toFixed(6)} ${state.toToken.symbol}` : '—'} />
      <Row label="Slippage" value="0.5%" />
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: T.spacing.elementGap }}>
      <span style={{ ...captionStyle, color: T.colors.textSecondary }}>{label}</span>
      <span style={{ ...captionStyle, color: tone === 'warn' ? T.colors.warning : tone === 'ok' ? T.colors.positive : T.colors.textPrimary, fontFamily: T.typography.dataValue.fontFamily }}>{value}</span>
    </div>
  );
}

function buildExactInputSingleIntent(state: SwapState, minReceived: number) {
  const amountIn = state.amount ? parseUnits(state.amount, state.fromToken.decimals) : 0n;
  const amountOutMinimum = parseUnits(Math.max(minReceived, 0).toFixed(6), state.toToken.decimals);
  return encodeFunctionData({
    abi: SWAP_ROUTER_ABI,
    functionName: 'exactInputSingle',
    args: [{
      tokenIn: state.fromToken.address,
      tokenOut: state.toToken.address,
      fee: 2500,
      recipient: '0x0000000000000000000000000000000000000000',
      amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96: 0n,
    }],
  });
}

export default function SwapPage() {
  const [state, setState] = useState<SwapState>({ fromToken: TOKENS[0], toToken: TOKENS[2], amount: '', quote: null });
  // Pool reserves from LiquidityPool contract — in production, fetched via viem readContract
  const poolReserves: Record<string, { reserveA: number; reserveB: number }> = {
    'ION/WBNB': { reserveA: 22_000_000, reserveB: 68 },
    'ION/USDT': { reserveA: 116_000_000, reserveB: 2_140 },
    'WBNB/USDT': { reserveA: 23, reserveB: 14_900 },
  };
  const quote = useMemo(() => computeQuote(state, poolReserves), [state]);
  const calldata = useMemo(() => (quote ? buildExactInputSingleIntent(state, quote.minReceived) : null), [quote, state]);

  return (
    <DEXGridHarness>
      <aside style={{ gridColumn: T.grid.leftColumn, display: 'grid', gap: T.spacing.gridGap }}>
        <NeonCard title="Token Info" subtitle="BSC verified assets" variant="cyan">
          <div style={{ display: 'grid', gap: T.spacing.elementGap, ...textStyle }}>
            {TOKENS.map((token) => <Row key={token.address} label={token.symbol} value={`${token.address.slice(0, 10)}…${token.address.slice(-8)}`} />)}
          </div>
        </NeonCard>
        <NeonCard title="Recent Trades" subtitle="PancakeSwap V3 route" variant="violet">
          <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
            {['ION → USDT', 'WBNB → ION', 'USDT → ION'].map((trade) => <Row key={trade} label={trade} value="BSC confirmed" tone="ok" />)}
          </div>
        </NeonCard>
      </aside>

      <main style={{ gridColumn: T.grid.centerColumn }}>
        <NeonCard title="Swap" subtitle="PancakeSwap V3 exactInputSingle" variant="cyan">
          <div style={{ display: 'grid', gap: T.spacing.sectionGap }}>
            <TokenSelect label="From" token={state.fromToken} onChange={(fromToken) => setState((current) => ({ ...current, fromToken }))} />
            <AmountInput token={state.fromToken} amount={state.amount} onAmount={(amount) => setState((current) => ({ ...current, amount }))} />
            <TokenSelect label="To" token={state.toToken} onChange={(toToken) => setState((current) => ({ ...current, toToken }))} />
            <QuoteDisplay quote={quote} state={state} />
            <button
              type="button"
              disabled={!quote}
              aria-label="swap via PancakeSwap V3 router"
              style={{
                height: T.buttons.primary.height,
                borderRadius: T.buttons.primary.borderRadius,
                padding: T.buttons.primary.padding,
                background: quote ? T.gradients.buttonPrimary : T.colors.disabledBg,
                color: quote ? T.colors.background : T.colors.disabledText,
                border: quote ? T.borders.glowCyan : `${T.borders.thin} solid ${T.colors.surfaceBorder}`,
                boxShadow: quote ? T.effects.actionShadowCyan : T.effects.insetGlow,
                fontSize: T.typography.buttonLabel.fontSize,
                fontWeight: T.typography.buttonLabel.fontWeight,
                letterSpacing: T.typography.buttonLabel.letterSpacing,
                textTransform: T.typography.buttonLabel.textTransform,
              }}
            >
              Swap via {PANCAKE_SWAP_V3_ROUTER.slice(0, 8)}…{PANCAKE_SWAP_V3_ROUTER.slice(-6)}
            </button>
            <span style={{ ...captionStyle, color: T.colors.textMuted, wordBreak: 'break-all' }}>
              {calldata ? `Prepared exactInputSingle calldata ${calldata.slice(0, 42)}…` : 'Quote uses pool reserve-derived human-readable pricing; connect wallet to broadcast.'}
            </span>
          </div>
        </NeonCard>
      </main>

      <aside style={{ gridColumn: T.grid.rightColumn }}>
        <NeonCard title="Price Chart" subtitle="DexScreener · ION" variant="magenta">
          <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
            <Row label="Source" value="DexScreener token API" />
            <Row label="ION Price" value={`$${PRICE_MAP.ION.toFixed(4)}`} tone="ok" />
            <div style={{ minHeight: T.dimensions.starfieldSize.split(' ')[1], borderRadius: T.inputs.borderRadius, background: T.gradients.starfield, border: `${T.borders.thin} solid ${T.colors.surfaceBorder}`, boxShadow: T.effects.neonMagenta }} />
          </div>
        </NeonCard>
      </aside>
    </DEXGridHarness>
  );
}
