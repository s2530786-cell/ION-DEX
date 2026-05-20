import type { ServerConfig } from "../../config/server-config.js";
import { OFFICIAL_ION_MAINNET_BURN_ADDRESS } from "../../upstream/ion-indexer.js";
import { fetchBscChainSnapshot, fetchBscIonBurnedBalance } from "../../upstream/bsc-rpc.js";
import {
  getCachedBurnWindowSum,
  getCachedValidatedIonBurnAddress,
} from "../ion-indexer-cache.js";
import type { BurnSummary } from "../burn.js";
import { formatUnits } from "./format-units.js";

const ION_DECIMALS = 9;
const WINDOW_SECONDS = {
  "24h": 86_400,
  "7d": 604_800,
  "30d": 2_592_000,
} as const;

function parseIonAmountToNano(amount: string): bigint {
  const trimmed = amount.trim();
  if (!trimmed) {
    return 0n;
  }
  const negative = trimmed.startsWith("-");
  const normalized = negative ? trimmed.slice(1) : trimmed;
  const [wholePart, fractionPart = ""] = normalized.split(".");
  const whole = wholePart ? BigInt(wholePart) : 0n;
  const fraction = (fractionPart + "000000000").slice(0, ION_DECIMALS);
  const fractionValue = fraction ? BigInt(fraction) : 0n;
  const nano = whole * 10n ** BigInt(ION_DECIMALS) + fractionValue;
  return negative ? -nano : nano;
}

function subtractIonAmount(totalIon: string, burnedIon: string): string {
  const remaining = parseIonAmountToNano(totalIon) - parseIonAmountToNano(burnedIon);
  if (remaining < 0n) {
    return "0";
  }
  return formatUnits(remaining, ION_DECIMALS);
}

function trendPct(current: bigint, baseline: bigint): number {
  if (baseline <= 0n) {
    return current > 0n ? 100 : 0;
  }
  const scaled = Number((current * 10000n) / baseline) / 100;
  return Math.round((scaled - 100) * 10) / 10;
}

export async function loadLiveBurnSummary(config: ServerConfig): Promise<BurnSummary> {
  const chain = await fetchBscChainSnapshot(config);

  if (!config.bscIonTokenAddress) {
    throw new Error(
      "BSC_ION_TOKEN_ADDRESS is not configured. Cannot read on-chain burn balance without the official BSC ION token contract.",
    );
  }

  const [burned, ionBurn] = await Promise.all([
    fetchBscIonBurnedBalance(config, config.bscIonTokenAddress),
    getCachedValidatedIonBurnAddress(config),
  ]);

  const bscBurnedIon = formatUnits(burned.burnedWei, ION_DECIMALS);
  const ionMainnetBurnedIon = formatUnits(ionBurn.balanceNano, ION_DECIMALS);
  const totalBurnedNano = burned.burnedWei + ionBurn.balanceNano;
  const totalBurnedIon = formatUnits(totalBurnedNano, ION_DECIMALS);
  const remainingSupplyIon = subtractIonAmount(config.ionTotalSupplyIon, totalBurnedIon);

  const nowSec = Math.floor(Date.now() / 1000);
  const windowEntries = await Promise.all(
    (Object.entries(WINDOW_SECONDS) as Array<[keyof typeof WINDOW_SECONDS, number]>).map(
      async ([label, seconds]) => {
        const burnedWindowNano = await getCachedBurnWindowSum(
          config,
          ionBurn.rawAddress,
          label,
          nowSec - seconds,
        );
        const burnedIon = formatUnits(burnedWindowNano, ION_DECIMALS);
        const baselineNano =
          label === "24h"
            ? burnedWindowNano
            : await getCachedBurnWindowSum(
                config,
                ionBurn.rawAddress,
                `${label}-baseline`,
                nowSec - seconds * 2,
              );
        return {
          label,
          burnedIon,
          trendPct: trendPct(burnedWindowNano, baselineNano),
        };
      },
    ),
  );

  return {
    totalBurnedIon,
    bscBurnedIon,
    ionMainnetBurnedIon,
    remainingSupplyIon,
    bscBurnAddress: burned.burnAddress,
    ionBurnAddress: ionBurn.userFriendly,
    ionBurnSource: `indexer-v3:${OFFICIAL_ION_MAINNET_BURN_ADDRESS}`,
    windows: windowEntries,
    provenance: [
      {
        source: "bsc-indexer",
        status: "online",
        note: `BSC RPC ${chain.rpcUrl} block #${chain.blockNumber}; burn = ERC20 balanceOf(${burned.burnAddress}).`,
      },
      {
        source: "ion-indexer",
        status: "online",
        note: `Indexer v3 accountStates balance on ${ionBurn.userFriendly} (${ionBurn.validatedVia}); windows = ion_transfer actions.`,
      },
    ],
  };
}
