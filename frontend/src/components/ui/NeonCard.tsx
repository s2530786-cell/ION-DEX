import type { CSSProperties, PropsWithChildren } from "react";
import { NeonGlassCard } from "@/components/ui/NeonGlassCard";

type NeonCardProps = PropsWithChildren<{
  className?: string;
  variant?: "cyan" | "magenta" | "gold" | "mixed";
}>;

const variantBorder: Record<NonNullable<NeonCardProps["variant"]>, string> = {
  cyan: "cyan",
  magenta: "#ff00ff",
  gold: "#fbbf24",
  mixed: "cyan",
};

export function NeonCard({ children, className: _className = "", variant = "mixed" }: NeonCardProps) {
  const surfaceStyle: CSSProperties = {
    border: `2px solid ${variantBorder[variant]}`,
    padding: "1.25rem",
  };

  return <NeonGlassCard style={surfaceStyle}>{children}</NeonGlassCard>;
}
