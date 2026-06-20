import { useEffect, useRef, useState } from "react";
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
  const retryCount = useRef(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const controller = new AbortController();
    const timeoutMs = optionsRef.current?.timeoutMs ?? 15_000;
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    let cancelled = false;

    setState("loading");
    setError(null);

    fetcher(controller.signal)
      .then((response) => {
        if (cancelled) {
          return;
        }
        const empty = optionsRef.current?.isEmpty?.(response.data) ?? false;
        setData(response.data);
        setMeta(response.meta);
        setState(empty ? "empty" : "ready");
      })
      .catch((cause: unknown) => {
        if (cancelled && cause instanceof DOMException && cause.name === "AbortError") {
          // External abort (e.g. splash screen unmount) — retry once
          if (retryCount.current < 1) {
            retryCount.current += 1;
            setReloadToken((prev) => prev + 1);
          } else {
            setState("error");
            setError("Request aborted (splash-screen)");
          }
          return;
        }
        if (cancelled) {
          return;
        }
        setData(fallback);
        setMeta(null);
        setState("error");
        setError(cause instanceof Error ? cause.message : "Request failed");
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [fetcher, reloadToken]);

  return {
    data,
    meta,
    state,
    error,
    reload: () => setReloadToken((value) => value + 1),
  };
}
