import type { SentinelTier } from "../sentinel/types.js";

export type CapabilityRegistryEntry = {
  capability_id: string;
  label: string;
  tier_default: SentinelTier;
  vendor_ref: string;
  gateway_path: string | null;
  description?: string;
};

export type CapabilityRegistryDocument = {
  $schema?: string;
  description?: string;
  capabilities?: CapabilityRegistryEntry[];
};
