import type { ServerConfig } from "../config/server-config.js";
import { OFFICIAL_ION_MAINNET_BURN_ADDRESS } from "../upstream/ion-indexer.js";

export type ValidatedIonBurnAddress = {
  balanceNano: bigint;
  rawAddress: string;
  userFriendly: string;
  validatedVia: string;
};

export async function getCachedValidatedIonBurnAddress(
  config: ServerConfig,
): Promise<ValidatedIonBurnAddress> {
  const userFriendly = config.ionMainnetBurnAddress || OFFICIAL_ION_MAINNET_BURN_ADDRESS;
  return {
    balanceNano: 0n,
    rawAddress: userFriendly,
    userFriendly,
    validatedVia: "config-fallback",
  };
}

export async function getCachedBurnWindowSum(
  _config: ServerConfig,
  _rawAddress: string,
  _label: string,
  _fromUnixSec: number,
): Promise<bigint> {
  return 0n;
}
