import { memo } from "react";

export const GlassPlaceholderSkeleton = memo(function GlassPlaceholderSkeleton({
  showChart = false,
  embedded = false,
  lines = 3,
  testId,
  minHeight,
}: {
  showChart?: boolean;
  embedded?: boolean;
  lines?: number;
  testId?: string;
  minHeight?: string;
}) {
  const Container = embedded ? "div" : "div";

  return (
    <div
      className={embedded ? undefined : "rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-5"}
      data-testid={testId}
      style={minHeight ? { minHeight } : undefined}
    >
      {showChart ? (
        <div className="mb-4 h-[12rem] animate-pulse rounded-xl bg-white/[0.05]" />
      ) : null}
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="mb-2 h-3 animate-pulse rounded bg-white/[0.06]"
          style={{ width: `${Math.max(40, 100 - index * 12)}%` }}
        />
      ))}
    </div>
  );
});
