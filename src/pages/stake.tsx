import React from 'react';
import { DEXGridHarness } from '../components/layout/DEXGridHarness';
import { StakePanel } from '../components/DEX/StakePanel';
import { WalletHarness } from '../components/DEX/WalletHarness';
import { VisualAuditor } from '../components/dev/VisualAuditor';
import { Guarded } from '../components/Guarded';
import { DesignTokens as T } from '../lib/design-tokens';

const Starfield: React.FC = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: T.colors.background }}>
    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 0%, ${T.colors.neonCyan}08 0%, transparent 50%)` }} />
  </div>
);

const NavBar: React.FC = () => (
  <nav
    className="w-full flex items-center justify-between px-8 py-4 z-50"
    style={{
      background: `linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 80%, transparent 100%)`,
      backdropFilter: T.effects.glassBlur,
      borderBottom: `${T.borders.thin} solid ${T.colors.surfaceBorder}`,
    }}
  >
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: T.colors.neonCyan }}>
        <span className="font-bold text-sm" style={{ color: T.colors.background }}>⚡</span>
      </div>
      <span className="font-bold tracking-wider text-lg" style={{ color: T.colors.textPrimary }}>ION DEX</span>
    </div>
    <span className="text-sm tracking-wider uppercase" style={{ color: T.colors.neonCyan }}>Stake</span>
  </nav>
);

export default function StakePage() {
  return (
    <Guarded>
      <Starfield />
      <div className="relative z-10">
        <NavBar />
        <DEXGridHarness>
          <div className="col-span-12 lg:col-span-3">
            <WalletHarness />
          </div>
          <StakePanel />
          <VisualAuditor />
        </DEXGridHarness>
      </div>
    </Guarded>
  );
}
