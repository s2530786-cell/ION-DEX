import React, { useState } from 'react';
import { DesignTokens } from '../../lib/design-tokens';

const poolIconSource = '/assets/icons/pool-cube.webp';

type PoolCardProps = {
  tvl?: string;
  apr?: string;
};

export const PoolCard: React.FC<PoolCardProps> = ({
  tvl = '$128.4M',
  apr = '18.7%',
}) => {
  const [iconMissing, setIconMissing] = useState(false);

  return (
    <section
      className="grid transform-gpu gap-[var(--pool-card-gap)] transition-transform duration-200 ease-out hover:scale-[1.01]"
      style={{
        gridColumn: 'span 1',
        gridRow: 'span 1',
        '--pool-card-gap': DesignTokens.dimensions.panelGap,
        padding: DesignTokens.dimensions.panelPadding,
        borderRadius: DesignTokens.dimensions.borderRadius,
        background: DesignTokens.colors.glassBase,
        boxShadow: DesignTokens.effects.cardGlow,
        backdropFilter: DesignTokens.effects.backdropBlur,
        WebkitBackdropFilter: DesignTokens.effects.backdropBlur,
        color: DesignTokens.colors.textPrimary,
      } as React.CSSProperties}
      aria-label="Pool overview card"
    >
      <header className="flex items-center gap-[var(--pool-card-gap)]">
        {!iconMissing ? (
          <img
            src={poolIconSource}
            alt="Pool 3D cube"
            className="shrink-0 object-contain"
            style={{
              width: DesignTokens.dimensions.iconSize,
              height: DesignTokens.dimensions.iconSize,
            }}
            onError={() => setIconMissing(true)}
          />
        ) : (
          <div
            className="grid shrink-0 place-items-center border text-center font-bold leading-tight"
            style={{
              width: DesignTokens.dimensions.iconSize,
              height: DesignTokens.dimensions.iconSize,
              borderRadius: DesignTokens.dimensions.buttonRadius,
              borderColor: DesignTokens.colors.neonCyan,
              color: DesignTokens.colors.neonCyan,
              boxShadow: DesignTokens.effects.neonCyan,
            }}
          >
            Master: add pool-cube.webp
          </div>
        )}

        <h2
          className="font-bold"
          style={{
            color: DesignTokens.colors.textPrimary,
            fontSize: DesignTokens.dimensions.titleSize,
          }}
        >
          Pool
        </h2>
      </header>

      <div className="grid gap-[var(--pool-card-gap)]">
        <div className="flex items-center justify-between gap-[var(--pool-card-gap)]">
          <span
            style={{
              color: DesignTokens.colors.textSecondary,
              fontSize: DesignTokens.dimensions.dataLabelSize,
            }}
          >
            TVL
          </span>
          <span
            className="font-mono font-semibold"
            style={{
              color: DesignTokens.colors.textPrimary,
              fontSize: DesignTokens.dimensions.dataValueSize,
            }}
          >
            {tvl}
          </span>
        </div>

        <div className="flex items-center justify-between gap-[var(--pool-card-gap)]">
          <span
            style={{
              color: DesignTokens.colors.textSecondary,
              fontSize: DesignTokens.dimensions.dataLabelSize,
            }}
          >
            APR
          </span>
          <span
            className="font-bold"
            style={{
              color: DesignTokens.colors.neonCyan,
              fontSize: DesignTokens.dimensions.dataValueSize,
            }}
          >
            {apr}
          </span>
        </div>
      </div>

      <footer className="grid grid-cols-2 gap-[var(--pool-card-gap)]">
        <button
          type="button"
          className="border font-semibold transition-transform duration-200 ease-out hover:scale-[1.01]"
          style={{
            minHeight: DesignTokens.dimensions.buttonHeight,
            borderRadius: DesignTokens.dimensions.buttonRadius,
            borderColor: DesignTokens.colors.neonCyan,
            background: DesignTokens.colors.glassBase,
            color: DesignTokens.colors.neonCyan,
            boxShadow: DesignTokens.effects.neonCyan,
          }}
        >
          Add
        </button>
        <button
          type="button"
          className="border font-semibold transition-transform duration-200 ease-out hover:scale-[1.01]"
          style={{
            minHeight: DesignTokens.dimensions.buttonHeight,
            borderRadius: DesignTokens.dimensions.buttonRadius,
            borderColor: DesignTokens.colors.neonMagenta,
            background: DesignTokens.colors.glassBase,
            color: DesignTokens.colors.neonMagenta,
            boxShadow: DesignTokens.effects.neonMagenta,
          }}
        >
          Remove
        </button>
      </footer>
    </section>
  );
};
