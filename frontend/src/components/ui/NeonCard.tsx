import type { PropsWithChildren } from "react";

type NeonCardProps = PropsWithChildren<{
  className?: string;
  variant?: "cyan" | "magenta" | "gold" | "mixed";
}>;

const variantShadow: Record<NonNullable<NeonCardProps["variant"]>, string> = {
  cyan: "shadow-neonCyan",
  magenta: "shadow-neonMagenta",
  gold: "shadow-neonGold",
  mixed: "shadow-[0_0_34px_rgba(36,247,255,0.24),0_0_44px_rgba(255,59,212,0.18)]",
};

export function NeonCard({ children, className = "", variant = "mixed" }: NeonCardProps) {
  return (
    <section
      className={`glass-surface neon-ambient rounded-[1.75rem] ${variantShadow[variant]} neon-panel-glow ${className}`}
    >
      <div className="relative h-full rounded-[1.7rem] border border-white/10 bg-[linear-gradient(145deg,rgba(12,24,52,0.88),rgba(9,13,35,0.68)_48%,rgba(40,14,54,0.78))] p-5">
        {children}
      </div>
    </section>
  );
}
