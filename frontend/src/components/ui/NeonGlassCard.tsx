import type { PropsWithChildren } from "react";

export type NeonGlassCardProps = PropsWithChildren<{
  className?: string;
  /** Thicker cyan/magenta rim for hero panels (Swap, market stage). */
  rim?: "default" | "hero";
  /** Optional stable hook for tests; no fabricated product data inside the card. */
  testId?: string;
}>;

/**
 * Cyberpunk liquid-glass surface: frosted inner panel + cyan→purple gradient rim (::before).
 * Presentational only — children must come from real page data / API boundaries.
 */
export function NeonGlassCard({
  children,
  className = "",
  rim = "default",
  testId,
}: NeonGlassCardProps) {
  return (
    <section
      className={[
        "neon-glass-card",
        rim === "hero" ? "neon-rim-hero" : "",
        "float-3d",
        "drop-shadow-[0_0_32px_rgba(0,255,255,0.45)]",
        "drop-shadow-[0_0_48px_rgba(255,0,255,0.28)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-testid={testId}
    >
      <div className="neon-glass-card__inner overflow-hidden rounded-[calc(2rem-1px)]">
        <div className="rounded-[calc(2rem-2px)] p-5 sm:p-6">{children}</div>
      </div>
    </section>
  );
}
