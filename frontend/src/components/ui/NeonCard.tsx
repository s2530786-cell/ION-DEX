import type { PropsWithChildren } from "react";

type NeonCardProps = PropsWithChildren<{
  className?: string;
  variant?: "cyan" | "magenta" | "gold" | "mixed";
  /** Tighter padding for sidebar metric stacks */
  density?: "default" | "compact";
}>;

const variantShadow: Record<NonNullable<NeonCardProps["variant"]>, string> = {
  cyan: "shadow-neonCyan",
  magenta: "shadow-neonMagenta",
  gold: "shadow-neonGold",
  mixed: "shadow-cyberPanel",
};

export function NeonCard({
  children,
  className = "",
  variant = "mixed",
  density = "default",
}: NeonCardProps) {
  const padding = density === "compact" ? "p-3.5 sm:p-4" : "p-5";
  return (
    <section
      className={`glass-surface neon-ambient rounded-[1.75rem] ${variantShadow[variant]} neon-panel-glow ${className}`}
    >
      <div
        className={`relative h-full rounded-[1.7rem] border border-cyan-400/10 bg-[linear-gradient(145deg,rgba(4,6,14,0.94),rgba(2,4,10,0.88)_48%,rgba(12,4,18,0.9))] ${padding}`}
      >
        {children}
      </div>
    </section>
  );
}
