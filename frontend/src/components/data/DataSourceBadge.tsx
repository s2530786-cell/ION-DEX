import type { ApiMeta } from "@/lib/ionApi";
import { formatDataSourceLabel } from "@/lib/ionApi";

export function DataSourceBadge({
  meta,
  testId,
  fallbackLabel = "offline fallback",
}: {
  meta: ApiMeta | null;
  testId: string;
  fallbackLabel?: string;
}) {
  const label = meta ? formatDataSourceLabel(meta) : fallbackLabel;

  return (
    <span className="sr-only" data-testid={testId}>
      Data source: {label}
    </span>
  );
}
