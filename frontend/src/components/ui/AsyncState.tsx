import type { ReactNode } from "react";
import type { ApiLoadState } from "@/hooks/useApiResource";

export function AsyncState({
  state,
  error,
  onRetry,
  emptyMessage = "No data available yet.",
  children,
  testId,
}: {
  state: ApiLoadState;
  error: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  children: ReactNode;
  testId?: string;
}) {
  if (state === "loading") {
    return (
      <LoadingSkeleton testId={testId ? `${testId}-loading` : "async-loading"} />
    );
  }

  if (state === "error") {
    return (
      <div
        className="rounded-2xl border border-rose-300/25 bg-rose-400/[0.08] p-4 text-sm text-rose-100"
        data-testid={testId ? `${testId}-error` : "async-error"}
      >
        <p className="font-bold">Unable to load live data</p>
        <p className="mt-1 text-rose-100/75">{error ?? "Unknown error"}</p>
        {onRetry ? (
          <button
            className="mt-3 rounded-full border border-rose-200/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]"
            onClick={onRetry}
            type="button"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div
        className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-cyan-100/70"
        data-testid={testId ? `${testId}-empty` : "async-empty"}
      >
        {emptyMessage}
      </div>
    );
  }

  return <>{children}</>;
}

function LoadingSkeleton({ testId }: { testId: string }) {
  return (
    <div className="grid gap-3" data-testid={testId}>
      <SkeletonLine />
      <SkeletonLine className="w-4/5" />
      <SkeletonLine className="w-3/5" />
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`h-4 animate-pulse rounded-full bg-white/10 ${className}`} />;
}
