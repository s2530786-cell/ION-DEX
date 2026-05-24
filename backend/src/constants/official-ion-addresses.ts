/** Confirmed official ION addresses — do not invent wrappers or alternate burn paths. */
export const BSC_ION_TOKEN = "0xe1ab61f7b093435204df32f5b3a405de55445ea8";
export const BSC_BURN_ADDRESS = "0x000000000000000000000000000000000000dead";
export const BSC_USDT_TOKEN = "0x55d398326f99059fF775485246099027B3197955";
export const ION_BSC_LP_POOL = "0x6487725b383954e05cA56F3c2B93a104B3DD2C25";

/** Optional IonBurn contract address from env — placeholder until mainnet deploy. */
export const BSC_BURN_CONTRACT_PLACEHOLDER =
  process.env.BSC_BURN_CONTRACT_ADDRESS?.trim() ||
  "0x0000000000000000000000000000000000000000";

/** Optional VaultLock contract address from env — placeholder until mainnet deploy. */
export const BSC_VAULT_LOCK_PLACEHOLDER =
  process.env.BSC_VAULT_LOCK_ADDRESS?.trim() ||
  "0x0000000000000000000000000000000000000000";
