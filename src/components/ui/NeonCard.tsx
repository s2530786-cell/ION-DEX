import React from 'react';
import { DesignTokens } from '../../lib/design-tokens';

/**
 * NeonCard — 全站 UI 母版模具
 *
 * 100% 绑定 DesignTokens，零硬编码。
 * 所有未来卡片组件必须基于此模具构建。
 */

interface NeonCardProps {
  children: React.ReactNode;
  title?: string;
  variant?: 'cyan' | 'magenta';
  className?: string;
}

export const NeonCard: React.FC<NeonCardProps> = ({
  children,
  title,
  variant = 'cyan',
  className = '',
}) => {
  const shadowEffect =
    variant === 'cyan'
      ? DesignTokens.effects.neonCyan
      : DesignTokens.effects.neonMagenta;

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${className}`}
      style={{
        backgroundColor: DesignTokens.colors.panelBg,
        borderWidth: DesignTokens.borders.thin,
        borderStyle: 'solid',
        borderColor: DesignTokens.colors.panelBorder,
        borderRadius: DesignTokens.spacing.borderRadius,
        padding: DesignTokens.spacing.cardPadding,
        backdropFilter: DesignTokens.effects.glassBlur,
        boxShadow: shadowEffect,
      }}
    >
      {title && (
        <h2
          className="font-bold tracking-wide font-sans text-lg"
          style={{
            color: DesignTokens.colors.textPrimary,
            borderBottomWidth: DesignTokens.borders.thin,
            borderStyle: 'solid',
            borderBottomColor: DesignTokens.colors.panelBorder,
            paddingBottom: DesignTokens.spacing.elementGap,
            marginBottom: DesignTokens.spacing.cardPadding,
          }}
        >
          {title}
        </h2>
      )}
      <div style={{ color: DesignTokens.colors.textSecondary }}>
        {children}
      </div>
    </div>
  );
};

export default NeonCard;
