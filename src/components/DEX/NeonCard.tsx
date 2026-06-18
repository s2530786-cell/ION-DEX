import React from 'react';
import { DesignTokens } from '../../lib/design-tokens';

/**
 * NeonCard — ION-DEX 基石组件
 * 所有后续模块（Pool, Swap, Bridge, Stake）均以此组件为基准
 * 
 * 铁律：禁止硬编码颜色，所有视觉属性引用 DesignTokens
 * 
 * @param variant - 'cyan' | 'magenta' 切换霓虹光晕颜色
 * @param columnSpan - Grid 列跨度，默认 4
 * @param icon - 3D 图标路径，例如 "/public/assets/icons/pool-cube.webp"
 * @param title - 卡片标题
 * @param children - 卡片内容
 */
interface NeonCardProps {
  variant?: 'cyan' | 'magenta';
  columnSpan?: number;
  icon?: string;
  title: string;
  children: React.ReactNode;
}

export const NeonCard: React.FC<NeonCardProps> = ({
  variant = 'cyan',
  columnSpan = 4,
  icon,
  title,
  children,
}) => {
  const neonColor = variant === 'cyan'
    ? DesignTokens.colors.neonCyan
    : DesignTokens.colors.neonMagenta;

  return (
    <div
      className="relative flex flex-col transition-all hover:scale-[1.01]"
      style={{
        gridColumn: DesignTokens.grid.columnSpan(columnSpan),
        backgroundColor: DesignTokens.colors.panelBg,
        backdropFilter: DesignTokens.effects.glassBlur,
        border: `1px solid ${DesignTokens.colors.panelBorder}`,
        borderRadius: DesignTokens.spacing.borderRadius,
        boxShadow: DesignTokens.effects.neonShadow(neonColor),
        padding: DesignTokens.spacing.cardPadding,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center"
        style={{ gap: '16px', marginBottom: '24px' }}
      >
        {icon && (
          <img
            src={icon}
            alt={title}
            className="object-contain"
            style={{ width: '64px', height: '64px' }}
          />
        )}
        <h2
          className="font-bold"
          style={{
            color: DesignTokens.colors.textPrimary,
            fontSize: '24px',
          }}
        >
          {title}
        </h2>
      </div>

      {/* Content */}
      {children}
    </div>
  );
};
