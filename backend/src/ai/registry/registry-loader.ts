import { readFileSync } from "node:fs";
import { resolvePrivateKernelFile } from "../sentinel/kernel-path.js";
import type { CapabilityRegistryEntry, CapabilityRegistryDocument } from "./types.js";

let cachedRegistry: CapabilityRegistryEntry[] | undefined;

export function loadCapabilityRegistry(options?: { reset?: boolean }): CapabilityRegistryEntry[] {
  if (options?.reset) {
    cachedRegistry = undefined;
  }
  if (cachedRegistry !== undefined) {
    return cachedRegistry;
  }

  const registryPath = resolvePrivateKernelFile("capability-registry.json");
  if (!registryPath) {
    cachedRegistry = [];
    return cachedRegistry;
  }

  try {
    const raw = JSON.parse(readFileSync(registryPath, "utf8")) as CapabilityRegistryDocument;
    cachedRegistry = Array.isArray(raw.capabilities) ? raw.capabilities : [];
  } catch {
    cachedRegistry = [];
  }
  return cachedRegistry;
}

export function resetRegistryCacheForTests(): void {
  cachedRegistry = undefined;
}

export function findRegistryEntry(capabilityId: string): CapabilityRegistryEntry | undefined {
  return loadCapabilityRegistry().find((entry) => entry.capability_id === capabilityId);
}
