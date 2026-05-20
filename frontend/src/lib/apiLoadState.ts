import type { ApiLoadState } from "@/hooks/useApiResource";

export function resolveApiLoadState(
  cause: unknown,
  _meta: null,
  empty: boolean,
): { state: ApiLoadState; message: string | null } {
  if (empty) {
    return { state: "empty", message: null };
  }
  if (cause instanceof DOMException && cause.name === "AbortError") {
    return { state: "empty", message: null };
  }
  const message = cause instanceof Error ? cause.message : "Request failed";
  return { state: "error", message };
}
