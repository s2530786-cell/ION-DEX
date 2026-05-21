import type { PropsWithChildren } from "react";

export type NeonGlassCardProps = PropsWithChildren<{
  className?: string;
  /** Optional stable hook for tests; no fabricated product data inside the card. */
  testId?: string;
}>;

/**
 * Cyberpunk liquid-glass surface: frosted inner panel + cyan→purple gradient rim (::before).
 * Presentational only — children must come from real page data / API boundaries.
 */
export function NeonGlassCard({ children, className = "", testId }: NeonGlassCardProps) {
  return (
    <section
      className={[
        "neon-glass-card",
        "drop-shadow-[0_0_28px_rgba(0,255,255,0.28)]",
        "drop-shadow-[0_0_40px_rgba(255,0,255,0.18)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-testid={testId}
    >
      <div className="neon-glass-card__inner overflow-hidden rounded-[calc(2rem-1px)] bg-black/20 backdrop-blur-lg">
        <div className="rounded-[calc(2rem-2px)] p-5 sm:p-6">{children}</div>
      </div>
    </section>
  );
}
