'use client';

import React, { useMemo, useState } from 'react';
import { encodeFunctionData, parseUnits } from 'viem';
import { DEXGridHarness } from '@/components/layout/DEXGridHarness';
import { NeonCard } from '@/components/DEX/NeonCard';
import { DesignTokens as T } from '@/lib/design-tokens';

interface Token { symbol: string; address: `0x${string}`; decimals: number; logoURI: string }
interface BridgeState { fromChain: 'BSC' | 'ION'; toChain: 'BSC' | 'ION'; token: Token; amount: string; status: BridgeStatus }
type BridgeStatus = 'idle' | 'approving' | 'locking' | 'confirming' | 'minting' | 'complete' | 'failed'

const TOKENS: Token[] = [
  { symbol: 'ION', address: '0xe1ab61f7b093435204df32f5b3a405de55445ea8', decimals: 18, logoURI: '/assets/icons/ion-token.webp' },
  { symbol: 'wION', address: '0x0000000000000000000000000000000000000a10', decimals: 18, logoURI: '/assets/icons/wion-token.webp' },
];
const BRIDGE_CONTRACT = '0x000000000000000000000000000000000000b0b1' as const;
const FEE_RATE = 0.001;
const BRIDGE_ABI = [
  { type: 'function', name: 'lock', stateMutability: 'nonpayable', inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'destinationChainId', type: 'uint256' }], outputs: [] },
] as const;
const HISTORY = [
  { route: 'BSC → ION', token: 'ION', amount: '1250.00', status: 'Complete', hash: '0x91b7…a440' },
  { route: 'ION → BSC', token: 'wION', amount: '430.00', status: 'Minting', hash: '0x28cb…7fe0' },
];
const caption = T.typography.caption;

function stat(label: string, value: string, tone?: 'positive' | 'warning' | 'negative') {
  return (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: T.spacing.elementGap }}>
      <span style={{ ...caption, color: T.colors.textSecondary }}>{label}</span>
      <span style={{ ...caption, color: tone === 'positive' ? T.colors.positive : tone === 'warning' ? T.colors.warning : tone === 'negative' ? T.colors.negative : T.colors.textPrimary, fontFamily: T.typography.dataValue.fontFamily }}>{value}</span>
    </div>
  );
}

function ChainButton({ label, active, onClick }: { label: 'BSC' | 'ION'; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ minHeight: T.inputs.height, borderRadius: T.inputs.borderRadius, border: `${T.borders.thick} solid ${active ? T.colors.cyanBorder : T.colors.surfaceBorder}`, background: active ? T.colors.cyanOverlay : T.colors.surfaceOverlay, color: T.colors.textPrimary, boxShadow: active ? T.effects.tabGlow : T.effects.insetGlow, fontSize: T.typography.subheading.fontSize, fontWeight: T.typography.subheading.fontWeight }}>
      {label === 'BSC' ? 'BNB Smart Chain' : 'ION Chain'}
    </button>
  );
}

function StatusRail({ status }: { status: BridgeStatus }) {
  const flow: BridgeStatus[] = ['locking', 'confirming', 'minting', 'complete'];
  const activeIndex = flow.indexOf(status);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: T.spacing.elementGap }}>
      {flow.map((item, index) => {
        const active = activeIndex >= index || status === 'complete';
        return <div key={item} style={{ minHeight: T.buttons.secondary.height, borderRadius: T.buttons.secondary.borderRadius, display: 'grid', placeItems: 'center', border: `${T.borders.thin} solid ${active ? T.colors.cyanBorder : T.colors.surfaceBorder}`, background: active ? T.colors.cyanOverlay : T.colors.disabledBg, color: active ? T.colors.neonCyan : T.colors.textMuted, fontSize: T.typography.badgeLabel.fontSize, letterSpacing: T.typography.badgeLabel.letterSpacing, textTransform: T.typography.badgeLabel.textTransform }}>{item}</div>;
      })}
    </div>
  );
}

function BridgeForm() {
  const [state, setState] = useState<BridgeState>({ fromChain: 'BSC', toChain: 'ION', token: TOKENS[0], amount: '', status: 'idle' });
  const amount = Number(state.amount) || 0;
  const fee = amount * FEE_RATE;
  const receive = Math.max(0, amount - fee);
  const calldata = useMemo(() => {
    if (!amount) return null;
    return encodeFunctionData({ abi: BRIDGE_ABI, functionName: 'lock', args: [state.token.address, parseUnits(state.amount, state.token.decimals), state.toChain === 'ION' ? 777n : 56n] });
  }, [amount, state]);

  const flip = () => setState((current) => ({ ...current, fromChain: current.toChain, toChain: current.fromChain, status: 'idle' }));
  const start = () => setState((current) => ({ ...current, status: current.status === 'idle' ? 'locking' : current.status === 'locking' ? 'confirming' : current.status === 'confirming' ? 'minting' : 'complete' }));

  return (
    <NeonCard title="BridgeForm" subtitle={`Lock(sourceChain) → Confirm · ${BRIDGE_CONTRACT.slice(0, 8)}…${BRIDGE_CONTRACT.slice(-6)}`} variant="cyan">
      <div style={{ display: 'grid', gap: T.spacing.sectionGap }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: T.spacing.elementGap, alignItems: 'center' }}>
          <ChainButton label={state.fromChain} active onClick={() => setState((current) => ({ ...current, fromChain: current.fromChain }))} />
          <button type="button" onClick={flip} style={{ width: T.buttons.icon.width, height: T.buttons.icon.height, borderRadius: T.buttons.icon.borderRadius, border: T.borders.glowCyan, background: T.colors.blackOverlay, color: T.colors.neonCyan, boxShadow: T.effects.neonCyan }}>→</button>
          <ChainButton label={state.toChain} active onClick={() => setState((current) => ({ ...current, toChain: current.toChain }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: T.spacing.elementGap }}>
          {TOKENS.map((token) => <button key={token.symbol} type="button" onClick={() => setState((current) => ({ ...current, token }))} style={{ minHeight: T.buttons.secondary.height, borderRadius: T.buttons.secondary.borderRadius, border: `${T.borders.thin} solid ${state.token.symbol === token.symbol ? T.colors.cyanBorder : T.colors.surfaceBorder}`, background: state.token.symbol === token.symbol ? T.colors.cyanOverlay : T.colors.surfaceOverlay, color: T.colors.textPrimary }}>{token.symbol}</button>)}
        </div>
        <input value={state.amount} onChange={(event) => setState((current) => ({ ...current, amount: event.target.value }))} inputMode="decimal" placeholder="0.0" style={{ height: T.inputs.height, borderRadius: T.inputs.borderRadius, padding: T.inputs.padding, fontSize: T.dimensions.inputValueSize, background: T.inputs.bg, border: `${T.borders.thick} solid ${T.colors.cyanBorder}`, color: T.colors.textPrimary, boxShadow: T.effects.inputGlowCyan, outlineColor: T.inputs.focusBorder }} />
        <div style={{ display: 'grid', gap: T.spacing.elementGap, padding: T.spacing.cardPadding, borderRadius: T.inputs.borderRadius, border: `${T.borders.thin} solid ${T.colors.surfaceBorder}`, background: T.colors.blackOverlay }}>
          {stat('Fee', `${fee.toFixed(6)} ${state.token.symbol} · 0.1%`, 'warning')}
          {stat('Estimated Arrival', state.fromChain === 'BSC' ? '6 confirmations' : 'ION finality window')}
          {stat('Receive', `${receive.toFixed(6)} ${state.token.symbol}`, 'positive')}
        </div>
        <StatusRail status={state.status} />
        <button type="button" disabled={!calldata} onClick={start} style={{ height: T.buttons.primary.height, borderRadius: T.buttons.primary.borderRadius, padding: T.buttons.primary.padding, background: calldata ? T.gradients.buttonPrimary : T.colors.disabledBg, color: calldata ? T.colors.background : T.colors.disabledText, border: T.borders.glowCyan, boxShadow: calldata ? T.effects.actionShadowCyan : T.effects.insetGlow, fontSize: T.typography.buttonLabel.fontSize, fontWeight: T.typography.buttonLabel.fontWeight, letterSpacing: T.typography.buttonLabel.letterSpacing, textTransform: T.typography.buttonLabel.textTransform }}>{state.status === 'idle' ? 'Lock Source Chain' : `Advance ${state.status}`}</button>
        <span style={{ ...caption, color: T.colors.textMuted, wordBreak: 'break-all' }}>{calldata ? `txHash pending · lock calldata ${calldata.slice(0, 42)}…` : 'Enter amount to prepare bridge lock transaction.'}</span>
      </div>
    </NeonCard>
  );
}

export default function BridgePage() {
  const totalLocked = 5_842_000;
  const dailyVolume = 286_000;
  return (
    <DEXGridHarness>
      <aside style={{ gridColumn: T.grid.leftColumn, display: 'grid', gap: T.spacing.gridGap }}>
        <NeonCard title="Stats" subtitle="BSC ↔ ION bridge" variant="cyan">
          <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
            {stat('Total Locked', `$${totalLocked.toLocaleString()}`, 'positive')}
            {stat('24h Volume', `$${dailyVolume.toLocaleString()}`)}
            {stat('Fee', '0.1%', 'warning')}
          </div>
        </NeonCard>
        <NeonCard title="Fees" subtitle="Relayer + mint accounting" variant="violet">
          <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
            {stat('Bridge Fee', '0.1%', 'warning')}
            {stat('Relayer', 'included')}
            {stat('Slashing Guard', 'active', 'positive')}
          </div>
        </NeonCard>
      </aside>
      <main style={{ gridColumn: T.grid.centerColumn }}><BridgeForm /></main>
      <aside style={{ gridColumn: T.grid.rightColumn }}>
        <NeonCard title="TxHistory" subtitle="Confirm + txHash" variant="magenta">
          <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
            {HISTORY.map((item) => stat(`${item.route} · ${item.amount} ${item.token}`, `${item.status} · ${item.hash}`, item.status === 'Complete' ? 'positive' : 'warning'))}
          </div>
        </NeonCard>
      </aside>
    </DEXGridHarness>
  );
}
