import { existsSync } from "node:fs";
import { join } from "node:path";

const KERNEL_SUBDIR = join(".memory-bank", "ai-civilization-kernel");

function kernelCandidates(): string[] {
  const envRoot = process.env.ION_PRIVATE_CORE_ROOT?.trim();
  return [
    envRoot,
    join(process.cwd(), "..", "ion-private-core"),
    "d:\\openclaw-tools\\ion-private-core",
  ].filter((value): value is string => Boolean(value));
}

export function resolvePrivateKernelDir(): string | null {
  for (const root of kernelCandidates()) {
    const dir = join(root, KERNEL_SUBDIR);
    const allowlistPath = join(dir, "tool-allowlist.json");
    if (existsSync(allowlistPath)) {
      return dir;
    }
  }
  return null;
}

export function resolvePrivateKernelFile(name: string): string | null {
  const dir = resolvePrivateKernelDir();
  if (!dir) {
    return null;
  }
  const path = join(dir, name);
  return existsSync(path) ? path : null;
}
