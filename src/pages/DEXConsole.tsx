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
              boxShadow: active === tab ? `0 0 12px ${T.colors.neonCyan}20` : 'none',
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
        background: `
          radial-gradient(2px 2px at 20px 30px, ${T.colors.neonCyan}55, transparent),
          radial-gradient(2px 2px at 40px 70px, ${T.colors.textPrimary}33, transparent),
          radial-gradient(1px 1px at 90px 40px, ${T.colors.neonCyan}44, transparent),
          radial-gradient(2px 2px at 160px 120px, ${T.colors.neonMagenta}44, transparent),
          radial-gradient(1px 1px at 230px 50px, ${T.colors.textPrimary}22, transparent),
          radial-gradient(2px 2px at 300px 90px, ${T.colors.neonCyan}33, transparent),
          radial-gradient(1px 1px at 380px 20px, ${T.colors.textPrimary}33, transparent),
          radial-gradient(2px 2px at 450px 110px, ${T.colors.neonViolet}44, transparent),
          radial-gradient(1px 1px at 520px 60px, ${T.colors.neonCyan}44, transparent),
          radial-gradient(2px 2px at 600px 30px, ${T.colors.textPrimary}22, transparent),
          radial-gradient(2px 2px at 690px 100px, ${T.colors.neonMagenta}33, transparent),
          radial-gradient(1px 1px at 760px 40px, ${T.colors.neonCyan}55, transparent),
          radial-gradient(2px 2px at 840px 80px, ${T.colors.textPrimary}33, transparent),
          radial-gradient(1px 1px at 920px 20px, ${T.colors.neonViolet}44, transparent),
          radial-gradient(2px 2px at 1020px 70px, ${T.colors.neonCyan}33, transparent),
          radial-gradient(1px 1px at 1100px 50px, ${T.colors.textPrimary}22, transparent),
          radial-gradient(2px 2px at 1190px 90px, ${T.colors.neonMagenta}44, transparent),
          radial-gradient(1px 1px at 1280px 30px, ${T.colors.neonCyan}55, transparent),
          radial-gradient(2px 2px at 70px 180px, ${T.colors.textPrimary}33, transparent),
          radial-gradient(1px 1px at 150px 220px, ${T.colors.neonCyan}44, transparent),
          radial-gradient(2px 2px at 280px 170px, ${T.colors.neonViolet}33, transparent),
          radial-gradient(1px 1px at 400px 240px, ${T.colors.textPrimary}22, transparent)
        `,
        backgroundRepeat: 'repeat',
        backgroundSize: '1400px 300px',
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
