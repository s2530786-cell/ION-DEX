import React from 'react';
import { DesignTokens } from '@/lib/design-tokens';

interface Props {
  children: React.ReactNode;
}

export const DEXGridHarness: React.FC<Props> = ({ children }) => {
  return (
    <div
      className="w-full min-h-screen"
      style={{
        display: 'grid',
        gridTemplateColumns: DesignTokens.grid.pageColumns,
        gridTemplateRows: DesignTokens.grid.pageRows,
        gap: DesignTokens.spacing.gridGap,
        padding: DesignTokens.spacing.pagePadding,
        background: DesignTokens.colors.background,
      }}
    >
      {children}
    </div>
  );
};
