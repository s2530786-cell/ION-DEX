import React from 'react';
import { DesignTokens } from '../../lib/design-tokens';

/**
 * DEXGridHarness v2.0 — ION-DEX 仪表盘强制栅格底座
 * 
 * 铁律：所有页面必须包裹在此组件中，使用 12 列 CSS Grid。
 * 组件尺寸和位置使用 grid-column: span X 定义。
 * 严禁使用 margin 进行手动对齐，严禁 fixed/absolute 排版。
 * 
 * 布局：12 列标准栅格，gap 由 DesignTokens.spacing.gridGap 控制
 */
export const DEXGridHarness: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      className="w-full min-h-screen"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${DesignTokens.grid.columns}, 1fr)`,
        gap: DesignTokens.spacing.gridGap,
        padding: DesignTokens.spacing.pagePadding,
        background: `radial-gradient(circle at center, #1e0a3c 0%, ${DesignTokens.colors.background} 100%)`,
      }}
    >
      {children}
    </div>
  );
};
