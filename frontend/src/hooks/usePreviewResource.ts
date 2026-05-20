import { useMemo } from "react";
import { useMockData } from "@/context/MockDataContext";
import { mockPreviewMeta } from "@/lib/MOCK_DATA";
import type { ApiMeta } from "@/lib/ionApi";
import type { ApiLoadState, ApiResource } from "@/hooks/useApiResource";

const noopReload = () => {};

/**
 * 预览模式资源：始终 ready，数据来自 App 注入的 MOCK_DATA，无网络、无重试。
 */
export function usePreviewResource<T>(
  selector: (data: ReturnType<typeof useMockData>) => T,
  options?: { isEmpty?: (data: T) => boolean; metaKey?: string },
): ApiResource<T> {
  const snapshot = useMockData();
  const data = useMemo(() => selector(snapshot), [snapshot]);
  const empty = options?.isEmpty?.(data) ?? false;
  const meta: ApiMeta = mockPreviewMeta(options?.metaKey ?? "preview");

  return {
    data,
    meta,
    state: (empty ? "empty" : "ready") as ApiLoadState,
    error: null,
    reload: noopReload,
  };
}
