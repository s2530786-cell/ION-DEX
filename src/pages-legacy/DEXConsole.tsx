import React, { useState } from 'react';
import { DEXGridHarness } from '../components/layout/DEXGridHarness';
import { SwapPanel } from '../components/DEX/SwapPanel';
import { LiquidityPanel } from '../components/DEX/LiquidityPanel';
import { PoolPanel } from '../components/DEX/PoolPanel';
import { StakePanel } from '../components/DEX/StakePanel';
import { WalletHarness } from '../components/DEX/WalletHarness';
import { VisualAuditor } from '../components/dev/VisualAuditor';
import { Guarded } from '../components/Guarded';
import { DesignTokens as T } from '../lib/design-tokens';

/** Top navigation bar with ION DEX branding */
const NavBar: React.FC<{ active: string; onNav: (v: string) => void }> = ({ active, onNav }) => {
  const tabs = ['Swap', 'Pool', 'Liquidity', 'Stake'];
  return (
    <nav
      className="w-full flex items-center justify-between px-8 py-4 z-50"
      style={{
        background: T.gradients.navFade,
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
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onNav(tab)}
            className="px-5 py-2 rounded-xl font-medium uppercase tracking-wider transition-all text-sm"
            style={{
              backgroundColor: active === tab ? T.colors.cyanOverlay : 'transparent',
              color: active === tab ? T.colors.neonCyan : T.colors.textSecondary,
              border: active === tab ? `${T.borders.thin} solid ${T.colors.cyanBorder}` : `${T.borders.thin} solid transparent`,
              boxShadow: active === tab ? T.effects.tabGlowSoft : 'none',
              transition: `all ${T.animation.durationNormal} ${T.animation.easeOut}`,
            }}
          >
            {tab}
          </button>
        ))}
      </div>
    </nav>
  );
};

/** Starfield background effect */
const Starfield: React.FC = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: T.colors.background }}>
    <div
      className="absolute inset-0"
      style={{
        background: T.gradients.starfield,
        backgroundRepeat: 'repeat',
        backgroundSize: T.dimensions.starfieldSize,
      }}
    />
    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 0%, ${T.colors.neonCyan}08 0%, transparent 50%)` }} />
  </div>
);

export const DEXConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Swap');

  return (
    <Guarded>
      <Starfield />
      <div className="relative z-10">
        <NavBar active={activeTab} onNav={setActiveTab} />
        <DEXGridHarness>
          {/* Left 3 cols: Wallet */}
          <div className="col-span-12 lg:col-span-3">
            <WalletHarness />
          </div>

          {/* Center area — nav-driven panels */}
          {activeTab === 'Swap' && <SwapPanel />}
          {activeTab === 'Liquidity' && <LiquidityPanel />}
          {activeTab === 'Pool' && <PoolPanel />}
          {activeTab === 'Stake' && <StakePanel />}

          {/* Floating visual auditor */}
          <VisualAuditor />
        </DEXGridHarness>
      </div>
    </Guarded>
  );
};

export default DEXConsole;
