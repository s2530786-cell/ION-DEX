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
 * 7. 3D float shadow — bottom projection for lift feel
 * 8. Content surface
 *
 * Per Master spec 2026-05-21: parameters strengthened for visible depth.
 */

interface NeonGlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "cyan" | "magenta" | "violet" | "gold" | "mixed";
  hero?: boolean;
  noAurora?: boolean;
}

const VARIANT_COLORS = {
  cyan: {
    primary: "rgba(36, 247, 255, 1)",
    secondary: "rgba(36, 247, 255, 0.55)",
    glow: "rgba(36, 247, 255, 0.45)",
    highlight: "rgba(36, 247, 255, 0.14)",
  },
  magenta: {
    primary: "rgba(255, 59, 212, 1)",
    secondary: "rgba(255, 59, 212, 0.55)",
    glow: "rgba(255, 59, 212, 0.45)",
    highlight: "rgba(255, 59, 212, 0.14)",
  },
  violet: {
    primary: "rgba(141, 77, 255, 1)",
    secondary: "rgba(141, 77, 255, 0.55)",
    glow: "rgba(141, 77, 255, 0.45)",
    highlight: "rgba(141, 77, 255, 0.14)",
  },
  gold: {
    primary: "rgba(255, 209, 102, 1)",
    secondary: "rgba(255, 209, 102, 0.55)",
    glow: "rgba(255, 209, 102, 0.45)",
    highlight: "rgba(255, 209, 102, 0.14)",
  },
  mixed: {
    primary: "rgba(36, 247, 255, 1)",
    secondary: "rgba(255, 59, 212, 0.6)",
    glow: "rgba(36, 247, 255, 0.45)",
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
  const blurBase = hero ? 48 : 40;
  const blurMid = hero ? 26 : 20;
  const blurAurora = hero ? 34 : 28;
  const glowBlur = hero ? 18 : 14;

  return (
    <div
      className={`relative rounded-[2rem] transition-all duration-500 hover:-translate-y-[2px] ${className}`}
      style={{
        isolation: "isolate",
        perspective: "1200px",
      }}
    >
      {/* Layer 1: Outer glow ring — WIDER thick neon aura */}
      <div
        className="absolute -inset-[6px] rounded-[2.2rem] pointer-events-none"
        style={{
          background: `conic-gradient(from 200deg, ${c.primary}, ${c.secondary}, ${
            variant === "mixed" ? "rgba(141,77,255,0.6)" : c.secondary
          }, ${c.primary})`,
          opacity: 0.32 * intense,
          filter: `blur(${glowBlur}px)`,
        }}
      />

      {/* Layer 1b: Extra outer bloom */}
      <div
        className="absolute -inset-[10px] rounded-[2.5rem] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${c.glow}, transparent 70%)`,
          opacity: 0.18 * intense,
          filter: "blur(24px)",
        }}
      />

      {/* Layer 2: Deep glass base — heavy blur + dark translucent */}
      <div
        className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none"
        style={{
          background: "rgba(2, 4, 12, 0.7)",
          backdropFilter: `blur(${blurBase}px) saturate(1.6)`,
          WebkitBackdropFilter: `blur(${blurBase}px) saturate(1.6)`,
          border: `2px solid ${c.primary.replace("1)", "0.30)")}`,
          boxShadow: `inset 0 0 100px ${c.glow.replace("0.45", "0.14")}`,
        }}
      />

      {/* Layer 3: Glass mid-layer — lighter blur for refraction depth */}
      <div
        className="absolute inset-[2px] rounded-[1.85rem] overflow-hidden pointer-events-none"
        style={{
          background: `linear-gradient(135deg,
            ${c.highlight} 0%,
            rgba(255, 255, 255, 0.06) 35%,
            rgba(255, 255, 255, 0.03) 55%,
            ${c.highlight.replace("0.14", "0.10")} 100%)`,
          backdropFilter: `blur(${blurMid}px) saturate(1.8)`,
          WebkitBackdropFilter: `blur(${blurMid}px) saturate(1.8)`,
        }}
      />

      {/* Layer 4: Aurora color reflection — chromatic aberration sweep */}
      {!noAurora && (
        <div
          className="absolute inset-[3px] rounded-[1.8rem] overflow-hidden pointer-events-none"
          style={{
            background: `linear-gradient(
              160deg,
              transparent 0%,
              ${c.primary.replace("1)", "0.18)")} 30%,
              ${
                variant === "mixed"
                  ? "rgba(255,59,212,0.14)"
                  : c.secondary.replace("0.6", "0.12")
              } 55%,
              transparent 100%)`,
            opacity: 0.38,
            filter: `blur(${blurAurora}px)`,
          }}
        />
      )}

      {/* Layer 5: Glossy highlight — diagonal light sweep with skew */}
      <div
        className="absolute inset-[4px] rounded-[1.75rem] overflow-hidden pointer-events-none"
        style={{
          background: `linear-gradient(
            115deg,
            transparent 0%,
            rgba(255, 255, 255, 0.09) 42%,
            rgba(255, 255, 255, 0.12) 50%,
            rgba(255, 255, 255, 0.06) 58%,
            transparent 100%)`,
          filter: "blur(2px)",
          transform: "skewX(-2deg)",
        }}
      />

      {/* Layer 6: Inner light border — thin bright edge */}
      <div
        className="absolute inset-[2px] rounded-[1.85rem] pointer-events-none"
        style={{
          border: `1px solid ${c.primary.replace("1)", `${hero ? 0.4 : 0.28})`)}`,
          boxShadow: hero
            ? `inset 0 0 40px ${c.glow.replace("0.45", "0.22")}, 0 0 60px ${c.glow.replace(
                "0.45",
                "0.28"
              )}`
            : `inset 0 0 24px ${c.glow.replace("0.45", "0.12")}`,
        }}
      />

      {/* Layer 7: 3D float shadow — DEEPER projection */}
      <div
        className="absolute inset-0 rounded-[2rem] pointer-events-none"
        style={{
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4)",
        }}
      />

      {/* Layer 8: Content — sits on top of all glass layers */}
      <div className="relative z-10 rounded-[2rem] p-6">{children}</div>
    </div>
  );
};
