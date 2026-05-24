import { useEffect, useState } from "react";
import type { ApiMeta } from "@/lib/ionApi";

export type ApiLoadState = "loading" | "ready" | "error" | "empty";

export type ApiResource<T> = {
  data: T;
  meta: ApiMeta | null;
  state: ApiLoadState;
  error: string | null;
  reload: () => void;
};

export function useApiResource<T>(
  fetcher: (signal: AbortSignal) => Promise<{ data: T; meta: ApiMeta }>,
  fallback: T,
  options?: { isEmpty?: (data: T) => boolean; timeoutMs?: number },
): ApiResource<T> {
  const [data, setData] = useState(fallback);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [state, setState] = useState<ApiLoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs ?? 1200;
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    setState("loading");
    setError(null);

    fetcher(controller.signal)
      .then((response) => {
        const empty = options?.isEmpty?.(response.data) ?? false;
        setData(response.data);
        setMeta(response.meta);
        setState(empty ? "empty" : "ready");
      })
      .catch((cause: unknown) => {
        setData(fallback);
        setMeta(null);
        setState("error");
        setError(cause instanceof Error ? cause.message : "Request failed");
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [fetcher, fallback, options?.isEmpty, options?.timeoutMs, reloadToken]);

  return {
    data,
    meta,
    state,
    error,
    reload: () => setReloadToken((value) => value + 1),
  };
}
