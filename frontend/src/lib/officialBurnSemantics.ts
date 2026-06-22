export const OFFICIAL_ION_MAINNET_BURN_NAME = "ION mainnet burn";
export const OFFICIAL_ION_MAINNET_BURN_ADDRESS = "EQBurnOfficialIonMainnetPlaceholder";

export const OFFICIAL_BURN_PROOF_STEPS = [
  "Verify BSC dead address balance on explorer",
  "Cross-check ION mainnet burn contract events",
  "Compare indexer totals with dashboard summary",
] as const;
