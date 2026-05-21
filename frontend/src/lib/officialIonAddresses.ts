/**
 * Canonical ION on-chain addresses (product-confirmed + ecosystem standard).
 * See docs/ion-official-canonical-addresses.md — do not duplicate magic strings elsewhere.
 */

/** BSC ION ERC-20 (18 decimals). Same asset as native ION, not a separate "wION". */
export const OFFICIAL_BSC_ION_TOKEN_ADDRESS =
  "0xe1ab61f7b093435204df32f5b3a405de55445ea8" as const;

/** BSC burn sink: transfers to this address count as destroyed ION on BSC. */
export const OFFICIAL_BSC_ION_BURN_ADDRESS =
  "0x000000000000000000000000000000000000dEaD" as const;

/** Fixed maximum supply narrative (never inflationary beyond bridge rules). */
export const OFFICIAL_ION_MAX_SUPPLY_HUMAN = "21100000000";

export const OFFICIAL_ION_MAX_SUPPLY_LABEL = "21.1B";
