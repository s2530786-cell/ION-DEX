import React from "react";

/**
 * 5D Liquid-Glass Card — Multi-layer glassmorphism primitives
 *
 * Layers (bottom → top):
 * 1. Outer glow ring — thick luminous neon rim
 * 2. Deep glass base — heavy backdrop blur + dark translucent bg
 * 3. Glass mid-layer — lighter blur for refraction depth
 * 4. Aurora reflection — chromatic aberration overlay
 * 5. Glossy highlight — diagonal shine sweep
 * 6. Inner light border — thin bright rim for edge definition
 * 7. Content surface
 */

interface NeonGlassCardProps {
  children: React.ReactNode;
  className?: string;
  /** Neon accent color theme */
  variant?: "cyan" | "magenta" | "violet" | "gold" | "mixed";
  /** Extra intense glow for hero cards */
  hero?: boolean;
  /** Disable aurora reflection layer for performance/dense areas */
  noAurora?: boolean;
}

const VARIANT_COLORS = {
  cyan: {
    primary: "rgba(36, 247, 255, 1)",
    secondary: "rgba(36, 247, 255, 0.55)",
    glow: "rgba(36, 247, 255, 0.45)",
    highlight: "rgba(36, 247, 255, 0.12)",
  },
  magenta: {
    primary: "rgba(255, 59, 212, 1)",
    secondary: "rgba(255, 59, 212, 0.55)",
    glow: "rgba(255, 59, 212, 0.45)",
    highlight: "rgba(255, 59, 212, 0.12)",
  },
  violet: {
    primary: "rgba(141, 77, 255, 1)",
    secondary: "rgba(141, 77, 255, 0.55)",
    glow: "rgba(141, 77, 255, 0.45)",
    highlight: "rgba(141, 77, 255, 0.12)",
  },
  gold: {
    primary: "rgba(255, 209, 102, 1)",
    secondary: "rgba(255, 209, 102, 0.55)",
    glow: "rgba(255, 209, 102, 0.45)",
    highlight: "rgba(255, 209, 102, 0.12)",
  },
  mixed: {
    primary: "rgba(36, 247, 255, 1)",
    secondary: "rgba(255, 59, 212, 0.6)",
    glow: "rgba(36, 247, 255, 0.4)",
    highlight: "rgba(141, 77, 255, 0.15)",
  },
};

export const NeonGlassCard: React.FC<NeonGlassCardProps> = ({
  children,
  className = "",
  variant = "mixed",
  hero = false,
  noAurora = false,
}) => {
  const c = VARIANT_COLORS[variant];
  const intense = hero ? 1.6 : 1;

  return (
    <div
      className={`relative rounded-[2rem] ${className}`}
      style={{ isolation: "isolate" }}
    >
      {/* Layer 1: Outer glow ring — thick neon aura */}
      <div
        className="absolute -inset-[3px] rounded-[2rem] pointer-events-none"
        style={{
          background: `conic-gradient(from 200deg, ${c.primary}, ${c.secondary}, ${variant === "mixed" ? "rgba(141,77,255,0.6)" : c.secondary}, ${c.primary})`,
          opacity: 0.18 * intense,
          filter: `blur(${hero ? 12 : 8}px)`,
        }}
      />

      {/* Layer 2: Deep glass base — heavy blur + dark translucent */}
      <div
        className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none"
        style={{
          background: "rgba(3, 5, 15, 0.55)",
          backdropFilter: "blur(32px) saturate(1.4)",
          WebkitBackdropFilter: "blur(32px) saturate(1.4)",
          border: `2px solid ${c.primary.replace("1)", "0.25)")}`,
          boxShadow: `inset 0 0 80px ${c.glow.replace("0.45", "0.08")}`,
        }}
      />

      {/* Layer 3: Glass mid-layer — lighter blur for refraction depth */}
      <div
        className="absolute inset-[2px] rounded-[1.85rem] overflow-hidden pointer-events-none"
        style={{
          background: `linear-gradient(135deg,
            ${c.highlight} 0%,
            rgba(255, 255, 255, 0.03) 35%,
            rgba(255, 255, 255, 0.01) 55%,
            ${c.highlight.replace("0.12", "0.06")} 100%)`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      />

      {/* Layer 4: Aurora color reflection — chromatic aberration sweep */}
      {!noAurora && (
        <div
          className="absolute inset-[3px] rounded-[1.8rem] overflow-hidden pointer-events-none opacity-25"
          style={{
            background: `linear-gradient(
              160deg,
              transparent 0%,
              ${c.primary.replace("1)", "0.12)")} 30%,
              ${variant === "mixed" ? "rgba(255,59,212,0.08)" : c.secondary.replace("0.6", "0.06")} 55%,
              transparent 100%)`,
            filter: "blur(20px)",
          }}
        />
      )}

      {/* Layer 5: Glossy highlight — diagonal light sweep */}
      <div
        className="absolute inset-[4px] rounded-[1.75rem] overflow-hidden pointer-events-none"
        style={{
          background: `linear-gradient(
            115deg,
            transparent 0%,
            rgba(255, 255, 255, 0.06) 42%,
            rgba(255, 255, 255, 0.09) 50%,
            rgba(255, 255, 255, 0.03) 58%,
            transparent 100%)`,
          filter: "blur(1px)",
        }}
      />

      {/* Layer 6: Inner light border — thin bright edge */}
      <div
        className="absolute inset-[2px] rounded-[1.85rem] pointer-events-none"
        style={{
          border: `1px solid ${c.primary.replace("1)", `${hero ? 0.3 : 0.18})`)}`,
          boxShadow: hero
            ? `inset 0 0 30px ${c.glow.replace("0.45", "0.15")}, 0 0 40px ${c.glow.replace("0.45", "0.2")}`
            : `inset 0 0 18px ${c.glow.replace("0.45", "0.06")}`,
        }}
      />

      {/* Layer 7: Content — sits on top of all glass layers */}
      <div className="relative z-10 rounded-[2rem] p-6">{children}</div>
    </div>
  );
};
