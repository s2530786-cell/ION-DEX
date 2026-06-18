import React from 'react';
import { DEXGridHarness } from '../components/layout/DEXGridHarness';
import { SwapPanel } from '../components/dex/SwapPanel';
import { LiquidityPanel } from '../components/dex/LiquidityPanel';
import { WalletHarness } from '../components/dex/WalletHarness';
import { VisualAuditor } from '../components/dev/VisualAuditor';
import { Guarded } from '../components/Guarded';
import { DesignTokens } from '../lib/design-tokens';

/**
 * DEXConsole — ION-DEX 全站组装中心
 *
 * 三栏布局：Wallet | Swap | Liquidity
 * 全部组件包裹在 DEXGridHarness 12 列栅格内
 */
export const DEXConsole: React.FC = () => {
  return (
    <Guarded>
      <DEXGridHarness>
        {/* Left 3 cols: Wallet */}
        <div className="col-span-12 lg:col-span-3">
          <WalletHarness />
        </div>

        {/* Center 5 cols: Swap */}
        <SwapPanel />

        {/* Right 4 cols: Liquidity */}
        <LiquidityPanel />

        {/* Floating visual auditor */}
        <VisualAuditor />
      </DEXGridHarness>
    </Guarded>
  );
};

export default DEXConsole;
