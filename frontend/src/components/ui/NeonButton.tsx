import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

/**
 * 6-Layer Glass Button — per Master 2026-05-21 spec
 *
 * Layers (bottom → top):
 * 1. Outer glow — conic-gradient neon ring, wide + bright
 * 2. Glass base — deep blur + dark translucent
 * 3. Mid refraction — gradient overlay with blur
 * 4. Glossy sweep — diagonal highlight
 * 5. Inner border — thin bright edge
 * 6. Content — text on top
 */

type NeonButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "cyan" | "magenta" | "gold" | "mixed";
  }
>;

const COLOR_MAP = {
  cyan: {
    primary: "rgba(36,247,255,1)",
    secondary: "rgba(36,247,255,0.55)",
    glow: "rgba(36,247,255,0.45)",
    border: "rgba(36,247,255,0.35)",
    textGlow: "0 0 20px rgba(36,247,255,0.7)",
  },
  magenta: {
    primary: "rgba(255,59,212,1)",
    secondary: "rgba(255,59,212,0.55)",
    glow: "rgba(255,59,212,0.45)",
    border: "rgba(255,59,212,0.35)",
    textGlow: "0 0 20px rgba(255,59,212,0.7)",
  },
  gold: {
    primary: "rgba(255,209,102,1)",
    secondary: "rgba(255,209,102,0.55)",
    glow: "rgba(255,209,102,0.45)",
    border: "rgba(255,209,102,0.35)",
    textGlow: "0 0 20px rgba(255,209,102,0.7)",
  },
  mixed: {
    primary: "rgba(36,247,255,1)",
    secondary: "rgba(255,59,212,0.55)",
    glow: "rgba(255,59,212,0.4)",
    border: "rgba(141,77,255,0.35)",
    textGlow: "0 0 20px rgba(36,247,255,0.55)",
  },
};

export function NeonButton({
  children,
  className = "",
  variant = "mixed",
  ...props
}: NeonButtonProps) {
  const c = COLOR_MAP[variant];

  return (
    <button
      className={`relative rounded-full px-5 py-3 text-sm font-black text-white transition-all duration-300
        hover:scale-[1.03] active:scale-[0.97]
        disabled:cursor-not-allowed disabled:opacity-50
        group ${className}`}
      style={{ isolation: "isolate" }}
      {...props}
    >
      {/* L1: Outer glow ring — WIDER ring, HIGHER opacity */}
      <span
        className="pointer-events-none absolute -inset-[3px] rounded-full opacity-35 transition-all duration-300 group-hover:opacity-55"
        style={{
          background: `conic-gradient(from 200deg, ${c.primary}, ${c.secondary}, ${
            variant === "mixed" ? "rgba(141,77,255,0.55)" : c.secondary
          }, ${c.primary})`,
          filter: "blur(8px)",
        }}
      />

      {/* L1b: Extra outer bloom */}
      <span
        className="pointer-events-none absolute -inset-[5px] rounded-full opacity-12 transition-opacity duration-300 group-hover:opacity-20"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${c.glow}, transparent 70%)`,
          filter: "blur(12px)",
        }}
      />

      {/* L2: Glass base — DARKER bg, STRONGER blur */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: "rgba(3,5,15,0.7)",
          backdropFilter: "blur(24px) saturate(1.5)",
          WebkitBackdropFilter: "blur(24px) saturate(1.5)",
          border: `1.5px solid ${c.border}`,
          boxShadow: `inset 0 0 30px ${c.glow.replace("0.45", "0.08")}`,
        }}
      />

      {/* L3: Mid refraction — STRONGER gradient */}
      <span
        className="pointer-events-none absolute inset-[1px] rounded-full"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      />

      {/* L4: Glossy sweep — BRIGHTER diagonal */}
      <span className="pointer-events-none absolute inset-[1px] rounded-full overflow-hidden">
        <span
          className="absolute inset-0 transition-all duration-300 group-hover:translate-x-[2px]"
          style={{
            background:
              "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.08) 55%, transparent 65%)",
          }}
        />
      </span>

      {/* L5: Inner border — BRIGHTER */}
      <span
        className="pointer-events-none absolute inset-[2px] rounded-full transition-all duration-300 group-hover:opacity-70"
        style={{
          border: `1px solid ${c.border.replace("0.35", "0.22")}`,
        }}
      />

      {/* L6: Content — STRONGER text glow */}
      <span
        className="relative z-10 flex items-center gap-2 transition-shadow duration-300 group-hover:drop-shadow-[0_0_12px_rgba(36,247,255,0.6)]"
        style={{ textShadow: c.textGlow }}
      >
        {children}
      </span>
    </button>
  );
}
