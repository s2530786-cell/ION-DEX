import type { PropsWithChildren } from "react";
import { NeonGlassCard } from "@/components/ui/NeonGlassCard";

type NeonCardProps = PropsWithChildren<{
  className?: string;
  variant?: "cyan" | "magenta" | "violet" | "gold" | "mixed";
  hero?: boolean;
  noAurora?: boolean;
}>;

export function NeonCard({
  children,
  className = "",
  variant = "mixed",
  hero = false,
  noAurora = false,
}: NeonCardProps) {
  return (
    <NeonGlassCard className={className} variant={variant} hero={hero} noAurora={noAurora}>
      {children}
    </NeonGlassCard>
  );
}
