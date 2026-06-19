import React from 'react';
import { DEXGridHarness } from '../components/layout/DEXGridHarness';
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
    <span className="text-sm tracking-wider uppercase" style={{ color: T.colors.neonCyan }}>Bridge</span>
  </nav>
);

export default function BridgePage() {
  return (
    <Guarded>
      <Starfield />
      <div className="relative z-10">
        <NavBar />
        <DEXGridHarness>
          <div className="col-span-12 lg:col-span-3">
            <WalletHarness />
          </div>
          <div className="col-span-12 lg:col-span-9">
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: T.colors.panelBg,
                backdropFilter: T.effects.glassBlur,
                border: `${T.borders.thin} solid ${T.colors.panelBorder}`,
              }}
            >
              <div className="text-5xl mb-4">🌉</div>
              <h2
                className="text-2xl font-bold mb-2 tracking-wider uppercase"
                style={{ color: T.colors.textPrimary }}
              >
                Cross-Chain Bridge
              </h2>
              <p className="mb-6" style={{ color: T.colors.textSecondary }}>
                Bridge ION between BSC and ION Chain
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  className="px-6 py-3 rounded-xl font-semibold tracking-wider uppercase text-sm"
                  style={{
                    backgroundColor: T.colors.cyanOverlay,
                    color: T.colors.neonCyan,
                    border: `${T.borders.thin} solid ${T.colors.cyanBorder}`,
                  }}
                >
                  BSC → ION
                </button>
                <button
                  className="px-6 py-3 rounded-xl font-semibold tracking-wider uppercase text-sm"
                  style={{
                    backgroundColor: T.colors.cyanOverlay,
                    color: T.colors.neonCyan,
                    border: `${T.borders.thin} solid ${T.colors.cyanBorder}`,
                  }}
                >
                  ION → BSC
                </button>
              </div>
              <p className="mt-6 text-xs" style={{ color: T.colors.textMuted }}>
                Full bridge interface coming soon
              </p>
            </div>
          </div>
          <VisualAuditor />
        </DEXGridHarness>
      </div>
    </Guarded>
  );
}
