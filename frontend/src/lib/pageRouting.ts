import type { PageKey } from "@/components/layout/AppShell";

const PAGE_KEYS: readonly PageKey[] = [
  "dashboard",
  "swap",
  "trade",
  "grid",
  "pool",
  "stake",
  "bridge",
  "burn",
  "domain",
  "ai",
] as const;

export function isPageKey(value: string): value is PageKey {
  return (PAGE_KEYS as readonly string[]).includes(value);
}

/** Parse `#/swap` or `#swap` into a PageKey; unknown segments fall back to dashboard. */
export function pageKeyFromHash(hash: string = typeof window !== "undefined" ? window.location.hash : ""): PageKey {
  const raw = hash.replace(/^#\/?/, "").split("?")[0]?.trim().toLowerCase() ?? "";
  if (!raw) {
    return "dashboard";
  }
  const segment = raw.split("/")[0] ?? "";
  return isPageKey(segment) ? segment : "dashboard";
}

export function hashForPageKey(page: PageKey): string {
  return page === "dashboard" ? "#/" : `#/${page}`;
}

export function writePageHash(page: PageKey): void {
  const next = hashForPageKey(page);
  if (window.location.hash !== next) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${next}`);
  }
}
