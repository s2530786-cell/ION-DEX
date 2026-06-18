import React from 'react';
import { DesignTokens } from '../../lib/design-tokens';

/**
 * NeonCard — ION-DEX Foundation Component v2.0
 * All future modules (Pool, Swap, Bridge, Stake) extend this.
 * 
 * Zero hardcoded colors. All visual values from DesignTokens.
 * 
 * @param variant - 'cyan' | 'magenta' | 'violet' — neon glow color
 * @param columnSpan - Grid column span, default 4
 * @param icon - 3D icon path, e.g. "/public/assets/icons/pool-cube.webp"
 * @param title - Card heading
 * @param subtitle - Optional subheading
 * @param children - Card body content
 * @param footer - Optional footer (buttons, links)
 */
interface NeonCardProps {
  variant?: 'cyan' | 'magenta' | 'violet';
  columnSpan?: number;
  icon?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const NeonCard: React.FC<NeonCardProps> = ({
  variant = 'cyan',
  columnSpan = 4,
  icon,
  title,
  subtitle,
  children,
  footer,
}) => {
  const neonColor =
    variant === 'cyan'
      ? DesignTokens.colors.neonCyan
      : variant === 'magenta'
        ? DesignTokens.colors.neonMagenta
        : DesignTokens.colors.neonViolet;

  return (
    <div
      className="relative flex flex-col transition-all hover:scale-[1.01]"
      style={{
        gridColumn: DesignTokens.grid.columnSpan(columnSpan),
        backgroundColor: DesignTokens.colors.panelBg,
        backdropFilter: DesignTokens.effects.glassBlur,
        WebkitBackdropFilter: DesignTokens.effects.glassBlur,
        borderWidth: DesignTokens.borders.thin,
        borderStyle: 'solid',
        borderColor: DesignTokens.colors.panelBorder,
        borderRadius: DesignTokens.spacing.borderRadius,
        boxShadow: DesignTokens.effects.neonShadow(neonColor),
        padding: DesignTokens.spacing.cardPadding,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center"
        style={{ gap: DesignTokens.spacing.elementGap, marginBottom: subtitle ? DesignTokens.spacing.elementGap : DesignTokens.spacing.cardPadding }}
      >
        {icon && (
          <img
            src={icon}
            alt={title}
            className="object-contain shrink-0"
            style={{
              width: DesignTokens.spacing.iconSize,
              height: DesignTokens.spacing.iconSize,
            }}
          />
        )}
        <div>
          <h2
            style={{
              color: DesignTokens.colors.textPrimary,
              fontSize: DesignTokens.typography.heading.fontSize,
              fontWeight: DesignTokens.typography.heading.fontWeight,
              lineHeight: DesignTokens.typography.heading.lineHeight,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                color: DesignTokens.colors.textSecondary,
                fontSize: DesignTokens.typography.caption.fontSize,
                marginTop: DesignTokens.spacing.elementGap,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>

      {/* Footer */}
      {footer && (
        <div style={{ marginTop: DesignTokens.spacing.sectionGap }}>
          {footer}
        </div>
      )}
    </div>
  );
};
