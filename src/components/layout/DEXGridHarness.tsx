import React from 'react';
import { DesignTokens } from '@/lib/design-tokens';

interface Props {
  children: React.ReactNode;
}

/**
 * DEXGridHarness — ION-DEX 强制栅格底座
 * All layouts MUST use this component. No arbitrary absolute/fixed positioning.
 * 12-col standard grid: grid-column: span X for component placement.
 */
export const DEXGridHarness: React.FC<Props> = ({ children }) => {
  return (
    <div
      className="w-full min-h-screen"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: DesignTokens.spacing.gridGap,
        padding: DesignTokens.spacing.pagePadding,
        background: `radial-gradient(circle at center, ${DesignTokens.colors.background} 0%, ${DesignTokens.colors.background} 100%)`,
      }}
    >
      {children}
    </div>
  );
};
