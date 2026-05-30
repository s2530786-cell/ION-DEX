import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolvePrivateKernelDir } from "./kernel-path.js";
import type { ToolAllowlistEntry } from "./types.js";

export type ToolAllowlistDocument = {
  $schema?: string;
  description?: string;
  tools?: ToolAllowlistEntry[];
};

let cachedAllowlist: ToolAllowlistEntry[] | undefined;

export function loadToolAllowlist(options?: { reset?: boolean }): ToolAllowlistEntry[] {
  if (options?.reset) {
    cachedAllowlist = undefined;
  }
  if (cachedAllowlist !== undefined) {
    return cachedAllowlist;
  }

  const kernelDir = resolvePrivateKernelDir();
  if (!kernelDir) {
    cachedAllowlist = [];
    return cachedAllowlist;
  }

  const allowlistPath = join(kernelDir, "tool-allowlist.json");
  try {
    const raw = JSON.parse(readFileSync(allowlistPath, "utf8")) as ToolAllowlistDocument;
    cachedAllowlist = Array.isArray(raw.tools) ? raw.tools : [];
  } catch {
    cachedAllowlist = [];
  }
  return cachedAllowlist;
}

export function resetAllowlistCacheForTests(): void {
  cachedAllowlist = undefined;
}

/** @deprecated use resolvePrivateKernelDir from kernel-path.ts */
export function resolvePrivateKernelDirLegacy(): string | null {
  return resolvePrivateKernelDir();
}
