import React from "react";

/**
 * 7-Layer Glass Panel — content area container
 *
 * Use for: chart boxes, order books, trade history, liquidity lists,
 * form panels, any internal content surface.
 *
 * Layers (bottom → top):
 * 1. Outer glow — WIDER variant color blur ring
 * 2. Glass base — STRONGER deep blur + dark translucent
 * 3. Mid glass — lighter blur for refraction
 * 4. Aurora reflection — chromatic overlay
 * 5. Glossy sweep — BRIGHTER diagonal highlight
 * 6. Inner border — thin bright edge
 * 7. Content
 */

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: "cyan" | "magenta" | "violet" | "gold" | "mixed";
  noAurora?: boolean;
  padding?: "sm" | "md" | "lg";
  "data-testid"?: string;
}

const VARIANT_COLORS = {
  cyan: {
    primary: "rgba(36, 247, 255, 1)",
    secondary: "rgba(36, 247, 255, 0.55)",
    glow: "rgba(36, 247, 255, 0.45)",
    highlight: "rgba(36, 247, 255, 0.16)",
  },
  magenta: {
    primary: "rgba(255, 59, 212, 1)",
    secondary: "rgba(255, 59, 212, 0.55)",
    glow: "rgba(255, 59, 212, 0.45)",
    highlight: "rgba(255, 59, 212, 0.16)",
  },
  violet: {
    primary: "rgba(141, 77, 255, 1)",
    secondary: "rgba(141, 77, 255, 0.55)",
    glow: "rgba(141, 77, 255, 0.45)",
    highlight: "rgba(141, 77, 255, 0.16)",
  },
  gold: {
    primary: "rgba(255, 209, 102, 1)",
    secondary: "rgba(255, 209, 102, 0.55)",
    glow: "rgba(255, 209, 102, 0.45)",
    highlight: "rgba(255, 209, 102, 0.16)",
  },
  mixed: {
    primary: "rgba(36, 247, 255, 1)",
    secondary: "rgba(255, 59, 212, 0.6)",
    glow: "rgba(36, 247, 255, 0.45)",
    highlight: "rgba(141, 77, 255, 0.15)",
  },
};

const PADDING_MAP = { sm: "p-4", md: "p-5", lg: "p-6" };

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = "",
  variant = "mixed",
  noAurora = false,
  padding = "md",
  "data-testid": testId,
}) => {
  const c = VARIANT_COLORS[variant];

  return (
    <div
      className={`relative rounded-[1.25rem] ${PADDING_MAP[padding]} ${className}`}
      data-testid={testId}
      style={{ isolation: "isolate" }}
    >
      {/* L1: Outer glow — WIDER ring, HIGHER opacity */}
      <div
        className="absolute -inset-[3px] rounded-[1.4rem] pointer-events-none"
        style={{
          background: `conic-gradient(from 200deg, ${c.primary}, ${c.secondary}, ${
            variant === "mixed" ? "rgba(141,77,255,0.55)" : c.secondary
          }, ${c.primary})`,
          opacity: 0.2,
          filter: "blur(12px)",
        }}
      />

      {/* L1b: Extra outer bloom */}
      <div
        className="absolute -inset-[5px] rounded-[1.5rem] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${c.glow}, transparent 70%)`,
          opacity: 0.1,
          filter: "blur(16px)",
        }}
      />

      {/* L2: Glass base — DARKER, STRONGER blur */}
      <div
        className="absolute inset-0 rounded-[1.25rem] overflow-hidden pointer-events-none"
        style={{
          background: "rgba(2,4,12,0.6)",
          backdropFilter: "blur(32px) saturate(1.5)",
          WebkitBackdropFilter: "blur(32px) saturate(1.5)",
          border: `1.5px solid ${c.primary.replace("1)", "0.22)")}`,
          boxShadow: `inset 0 0 60px ${c.glow.replace("0.45", "0.10")}`,
        }}
      />

      {/* L3: Mid glass — STRONGER refraction */}
      <div
        className="absolute inset-[1px] rounded-[1.18rem] overflow-hidden pointer-events-none"
        style={{
          background: `linear-gradient(135deg,
            ${c.highlight} 0%,
            rgba(255, 255, 255, 0.05) 35%,
            rgba(255, 255, 255, 0.02) 55%,
            ${c.highlight.replace("0.16", "0.08")} 100%)`,
          backdropFilter: "blur(18px) saturate(1.6)",
          WebkitBackdropFilter: "blur(18px) saturate(1.6)",
        }}
      />

      {/* L4: Aurora reflection — STRONGER color */}
      {!noAurora && (
        <div
          className="absolute inset-[2px] rounded-[1.15rem] overflow-hidden pointer-events-none"
          style={{
            background: `linear-gradient(
              160deg,
              transparent 0%,
              ${c.primary.replace("1)", "0.12)")} 30%,
              ${
                variant === "mixed"
                  ? "rgba(255,59,212,0.10)"
                  : c.secondary.replace("0.55", "0.08")
              } 55%,
              transparent 100%)`,
            opacity: 0.25,
            filter: "blur(22px)",
          }}
        />
      )}

      {/* L5: Glossy sweep — BRIGHTER diagonal */}
      <div
        className="absolute inset-[3px] rounded-[1.12rem] overflow-hidden pointer-events-none"
        style={{
          background: `linear-gradient(
            115deg,
            transparent 0%,
            rgba(255, 255, 255, 0.06) 40%,
            rgba(255, 255, 255, 0.10) 50%,
            rgba(255, 255, 255, 0.04) 60%,
            transparent 100%)`,
          filter: "blur(2px)",
          transform: "skewX(-2deg)",
        }}
      />

      {/* L6: Inner border — BRIGHTER */}
      <div
        className="absolute inset-[2px] rounded-[1.18rem] pointer-events-none"
        style={{
          border: `1px solid ${c.primary.replace("1)", "0.20)")}`,
          boxShadow: `inset 0 0 16px ${c.glow.replace("0.45", "0.08")}`,
        }}
      />

      {/* L7: Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
