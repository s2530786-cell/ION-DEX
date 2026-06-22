'use client';

import React, { useMemo, useState } from 'react';
import { encodeFunctionData, parseUnits } from 'viem';
import { DEXGridHarness } from '@/components/layout/DEXGridHarness';
import { NeonCard } from '@/components/DEX/NeonCard';
import { StakePanel } from '@/components/DEX/StakePanel';
import { DesignTokens as T } from '@/lib/design-tokens';

interface StakePosition { amount: string; duration: number; apr: number; rewards: string; lockEnd: number }
interface Token { symbol: string; address: `0x${string}`; decimals: number; logoURI: string }

const ION: Token = { symbol: 'ION', address: '0xe1ab61f7b093435204df32f5b3a405de55445ea8', decimals: 18, logoURI: '/assets/icons/ion-token.webp' };
const FEE_DISTRIBUTOR = '0x000000000000000000000000000000000000fee1' as const;
const DURATIONS = [
  { label: 'Flexible', days: 0, apr: 8 },
  { label: '7d', days: 7, apr: 10 },
  { label: '30d', days: 30, apr: 12 },
  { label: '90d', days: 90, apr: 15 },
  { label: '180d', days: 180, apr: 20 },
  { label: '365d', days: 365, apr: 30 },
];
const HISTORY: StakePosition[] = [
  { amount: '24000', duration: 30, apr: 12, rewards: '236.71', lockEnd: Date.now() + 11 * 86400000 },
  { amount: '8000', duration: 90, apr: 15, rewards: '118.35', lockEnd: Date.now() + 54 * 86400000 },
];

const FEE_DISTRIBUTOR_ABI = [
  { type: 'function', name: 'stake', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }, { name: 'duration', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'unstake', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'claimRewards', stateMutability: 'nonpayable', inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [] },
] as const;

const ERC20_ABI = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const;

const caption = T.typography.caption;

function row(label: string, value: string, tone?: 'positive' | 'negative' | 'warning') {
  return (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: T.spacing.elementGap }}>
      <span style={{ ...caption, color: T.colors.textSecondary }}>{label}</span>
      <span style={{ ...caption, color: tone === 'positive' ? T.colors.positive : tone === 'negative' ? T.colors.negative : tone === 'warning' ? T.colors.warning : T.colors.textPrimary, fontFamily: T.typography.dataValue.fontFamily }}>{value}</span>
    </div>
  );
}

function AmountBox({ amount, onAmount }: { amount: string; onAmount: (amount: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: T.spacing.elementGap }}>
      <span style={{ ...caption, color: T.colors.textSecondary }}>Stake Amount · Balance 1280.45 ION from BSC</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: T.spacing.elementGap }}>
        <input
          value={amount}
          inputMode="decimal"
          onChange={(event) => onAmount(event.target.value)}
          placeholder="0.0"
          style={{ height: T.inputs.height, borderRadius: T.inputs.borderRadius, padding: T.inputs.padding, fontSize: T.dimensions.inputValueSize, background: T.inputs.bg, border: `${T.borders.thick} solid ${T.colors.cyanBorder}`, color: T.colors.textPrimary, boxShadow: T.effects.inputGlowCyan, outlineColor: T.inputs.focusBorder }}
        />
        <button type="button" onClick={() => onAmount('1280.45')} style={{ height: T.buttons.primary.height, borderRadius: T.buttons.primary.borderRadius, padding: T.buttons.primary.padding, background: T.gradients.buttonPrimary, color: T.colors.background, border: T.borders.glowCyan, boxShadow: T.effects.actionShadowCyan, fontWeight: T.buttons.primary.fontWeight }}>MAX</button>
      </div>
    </label>
  );
}

function StakeForm() {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(DURATIONS[0]);
  const numeric = Number(amount) || 0;
  const rewards = numeric * (duration.apr / 100) * ((duration.days || 365) / 365);
  const penalty = duration.days === 0 ? 0 : rewards * 0.15;
  const approveCalldata = useMemo(() => amount ? encodeFunctionData({ abi: ERC20_ABI, functionName: 'approve', args: [FEE_DISTRIBUTOR, parseUnits(amount, ION.decimals)] }) : null, [amount]);
  const stakeCalldata = useMemo(() => amount ? encodeFunctionData({ abi: FEE_DISTRIBUTOR_ABI, functionName: 'stake', args: [parseUnits(amount, ION.decimals), BigInt(duration.days)] }) : null, [amount, duration]);

  return (
    <NeonCard title="StakeForm" subtitle="approveION → stake on FeeDistributor" variant="violet">
      <div style={{ display: 'grid', gap: T.spacing.sectionGap }}>
        <AmountBox amount={amount} onAmount={setAmount} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: T.spacing.elementGap }}>
          {DURATIONS.map((option) => (
            <button key={option.label} type="button" onClick={() => setDuration(option)} style={{ minHeight: T.buttons.secondary.height, borderRadius: T.buttons.secondary.borderRadius, border: `${T.borders.thin} solid ${duration.label === option.label ? T.colors.cyanBorder : T.colors.surfaceBorder}`, background: duration.label === option.label ? T.colors.cyanOverlay : T.colors.surfaceOverlay, color: T.colors.textPrimary, fontSize: T.buttons.secondary.fontSize, fontWeight: T.buttons.secondary.fontWeight }}>
              {option.label} · {option.apr}%
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gap: T.spacing.elementGap, padding: T.spacing.cardPadding, borderRadius: T.inputs.borderRadius, border: `${T.borders.thin} solid ${T.colors.surfaceBorder}`, background: T.colors.blackOverlay }}>
          {row('totalEarned', `${rewards.toFixed(4)} ION`, 'positive')}
          {row('claimableNow', `${duration.days === 0 ? rewards.toFixed(4) : '0.0000'} ION`, 'positive')}
          {row('projectedAPR', `${duration.apr.toFixed(2)}%`, 'warning')}
          {row('earlyExitPenalty', `${penalty.toFixed(4)} ION`, penalty > 0 ? 'negative' : 'positive')}
        </div>
        <button type="button" disabled={!stakeCalldata} style={{ height: T.buttons.primary.height, borderRadius: T.buttons.primary.borderRadius, padding: T.buttons.primary.padding, background: stakeCalldata ? T.gradients.buttonPrimaryViolet : T.colors.disabledBg, color: stakeCalldata ? T.colors.background : T.colors.disabledText, border: T.borders.glowViolet, boxShadow: stakeCalldata ? T.effects.actionShadowViolet : T.effects.insetGlow, fontSize: T.typography.buttonLabel.fontSize, fontWeight: T.typography.buttonLabel.fontWeight, letterSpacing: T.typography.buttonLabel.letterSpacing, textTransform: T.typography.buttonLabel.textTransform }}>
          Stake ION
        </button>
        <span style={{ ...caption, color: T.colors.textMuted, wordBreak: 'break-all' }}>{approveCalldata && stakeCalldata ? `approve ${approveCalldata.slice(0, 18)}… · stake ${stakeCalldata.slice(0, 18)}…` : 'Enter amount to prepare approval and stake transaction.'}</span>
      </div>
    </NeonCard>
  );
}

function Rewards() {
  const total = HISTORY.reduce((sum, item) => sum + Number(item.rewards), 0);
  const principal = HISTORY.reduce((sum, item) => sum + Number(item.amount), 0);
  return (
    <NeonCard title="Rewards" subtitle="Accrued staking accounting" variant="cyan">
      <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
        {row('totalEarned', `${total.toFixed(2)} ION`, 'positive')}
        {row('claimableNow', `${(total * 0.36).toFixed(2)} ION`, 'positive')}
        {row('stakedAmount', `${principal.toLocaleString()} ION`)}
        {row('accruedRewards', `${total.toFixed(2)} ION`, 'warning')}
      </div>
    </NeonCard>
  );
}

export default function StakePage() {
  return (
    <DEXGridHarness>
      <aside style={{ gridColumn: T.grid.leftColumn, display: 'grid', gap: T.spacing.gridGap }}>
        <NeonCard title="StakeHistory" subtitle="BSC staking reads" variant="cyan">
          <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
            {HISTORY.map((item) => row(`${item.duration}d · ${item.amount} ION`, `${item.rewards} rewards`, 'positive'))}
          </div>
        </NeonCard>
      </aside>
      <main style={{ gridColumn: T.grid.centerColumn, display: 'grid', gap: T.spacing.gridGap }}>
        <StakeForm />
        <Rewards />
      </main>
      <aside style={{ gridColumn: T.grid.rightColumn, display: 'grid', gap: T.spacing.gridGap }}>
        <StakePanel />
        <NeonCard title="APRCalculator" subtitle="Duration-weighted yield" variant="magenta">
          <div style={{ display: 'grid', gap: T.spacing.elementGap }}>
            {DURATIONS.map((item) => row(item.label, `${item.apr}% APR`, item.apr >= 20 ? 'positive' : 'warning'))}
          </div>
        </NeonCard>
      </aside>
    </DEXGridHarness>
  );
}
