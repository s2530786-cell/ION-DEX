import type { ReactNode } from "react";
import type { ApiLoadState } from "@/hooks/useApiResource";
import { GlassPlaceholderSkeleton } from "@/components/ui/GlassPlaceholderSkeleton";

export function AsyncState({
  state,
  error: _error,
  onRetry: _onRetry,
  emptyMessage: _emptyMessage = "No data available yet.",
  children,
  testId,
  skeletonLines = 4,
  skeletonChart = false,
}: {
  state: ApiLoadState;
  error: string | null;
  /** 已禁用重试；保留参数仅为兼容旧调用 */
  onRetry?: () => void;
  emptyMessage?: string;
  children: ReactNode;
  testId?: string;
  skeletonLines?: number;
  skeletonChart?: boolean;
}) {
  if (state === "loading" || state === "error") {
    return (
      <GlassPlaceholderSkeleton
        showChart={skeletonChart}
        lines={skeletonLines}
        testId={testId ? `${testId}-placeholder` : "async-placeholder"}
        minHeight={skeletonChart ? "17.5rem" : "14rem"}
      />
    );
  }

  if (state === "empty") {
    return (
      <GlassPlaceholderSkeleton
        lines={3}
        testId={testId ? `${testId}-empty` : "async-empty"}
        minHeight="10rem"
      />
    );
  }

  return <>{children}</>;
}
