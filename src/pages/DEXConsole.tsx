import React from 'react';
import { DEXGridHarness } from '../components/layout/DEXGridHarness';
import { SwapPanel } from '../components/dex/SwapPanel';
import { VisualAuditor } from '../components/dev/VisualAuditor';
import { Guarded } from '../components/Guarded';
import { DesignTokens } from '../lib/design-tokens';

/**
 * DEXConsole — ION-DEX 全站组装中心
 *
 * 利用 DEXGridHarness 容纳 SwapPanel（左侧 4 列），
 * 右侧预留 8 列作为后续数据图表输出，
 * 形成非对称高级科幻工业视觉。
 */
export const DEXConsole: React.FC = () => {
  return (
    <Guarded>
      <DEXGridHarness>
        {/* 左侧 4 列：Swap 交易内核 */}
        <SwapPanel />

        {/* 右侧 8 列：未来扩展的流动性 K 线与看板占位底盘 */}
        <div
          className="col-span-12 lg:col-span-8 flex flex-col justify-center items-center text-center border dashed"
          style={{
            borderColor: DesignTokens.colors.panelBorder,
            borderRadius: DesignTokens.spacing.borderRadius,
            backgroundColor: DesignTokens.colors.panelBg,
            backdropFilter: DesignTokens.effects.glassBlur,
            padding: DesignTokens.spacing.cardPadding,
          }}
        >
          <div
            className="animate-pulse tracking-widest text-xs font-mono"
            style={{ color: DesignTokens.colors.neonMagenta }}
          >
            [ AWAITING DATALINK: GECKOTERMINAL REALTIME TICKER ]
          </div>
        </div>

        {/* 悬浮全局视觉质量监控哨兵 */}
        <VisualAuditor />
      </DEXGridHarness>
    </Guarded>
  );
};

export default DEXConsole;
