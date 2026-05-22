import type { PropsWithChildren } from "react";

type NeonCardProps = PropsWithChildren<{
  className?: string;
  variant?: "cyan" | "magenta" | "gold" | "mixed";
}>;

const variantGlow: Record<NonNullable<NeonCardProps["variant"]>, string> = {
  cyan: "drop-shadow-[0_0_28px_rgba(36,247,255,0.32)]",
  magenta: "drop-shadow-[0_0_32px_rgba(255,59,212,0.28)]",
  gold: "drop-shadow-[0_0_28px_rgba(255,209,102,0.24)]",
  mixed: "drop-shadow-[0_0_28px_rgba(0,255,255,0.28)] drop-shadow-[0_0_40px_rgba(255,0,255,0.18)]",
};

/**
 * Legacy name kept for call sites; renders the same liquid-glass stack as NeonGlassCard
 * with variant-tinted outer glow (docs/10-ui-design-route thick neon rim).
 */
export function NeonCard({ children, className = "", variant = "mixed" }: NeonCardProps) {
  return (
    <section
      className={[
        "neon-glass-card neon-rim-hero rounded-[1.75rem]",
        "float-3d",
        variantGlow[variant],
        className,
      ].join(" ")}
    >
      <div className="neon-glass-card__inner overflow-hidden rounded-[calc(1.75rem-1px)]">
        <div className="h-full rounded-[calc(1.75rem-2px)] p-5 sm:p-6">{children}</div>
      </div>
    </section>
  );
}
