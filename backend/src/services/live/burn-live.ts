import type { ServerConfig } from "../../config/server-config.js";
import {
  OFFICIAL_ION_MAINNET_BURN_ADDRESS,
  OFFICIAL_ION_MAX_SUPPLY_ION,
} from "../../constants/official-ion-addresses.js";
import { fetchIonMainnetBurnAddressBalance } from "../../upstream/ion-api.js";
import { fetchBscChainSnapshot, fetchBscIonBurnedBalance } from "../../upstream/bsc-rpc.js";
import type { BurnSummary } from "../burn.js";
import { formatUnits } from "./format-units.js";

const ION_DECIMALS = 9;

function sumIonAmounts(a: string, b: string): string {
  const total = Number(a) + Number(b);
  if (!Number.isFinite(total)) {
    return "0";
  }
  return total.toFixed(ION_DECIMALS);
}

function remainingSupply(totalBurned: string): string {
  const cap = Number(OFFICIAL_ION_MAX_SUPPLY_ION);
  const burned = Number(totalBurned);
  if (!Number.isFinite(cap) || !Number.isFinite(burned)) {
    return "0";
  }
  return Math.max(0, cap - burned).toFixed(3);
}

export async function loadLiveBurnSummary(config: ServerConfig): Promise<BurnSummary> {
  const chain = await fetchBscChainSnapshot(config);

  if (!config.bscIonTokenAddress) {
    throw new Error(
      "BSC_ION_TOKEN_ADDRESS is not configured. Cannot read on-chain burn balance without the official BSC ION token contract.",
    );
  }

  const burned = await fetchBscIonBurnedBalance(config, config.bscIonTokenAddress);
  const bscBurnedIon = formatUnits(burned.burnedWei, ION_DECIMALS);

  let ionMainnetBurnedIon = "0";
  let ionNote =
    "ION mainnet burn not loaded — official Burn Address balance via HTTP API failed or unreachable.";

  try {
    const ionBurn = await fetchIonMainnetBurnAddressBalance(config);
    ionMainnetBurnedIon = formatUnits(ionBurn.balanceNanoton, ION_DECIMALS);
    ionNote = `ION HTTP API getAddressBalance(${OFFICIAL_ION_MAINNET_BURN_ADDRESS}) — burn sink cumulative balance.`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ionNote = `ION API error for official Burn Address: ${message}`;
  }

  const totalBurnedIon = sumIonAmounts(bscBurnedIon, ionMainnetBurnedIon);

  return {
    totalBurnedIon,
    bscBurnedIon,
    ionMainnetBurnedIon,
    remainingSupplyIon: remainingSupply(totalBurnedIon),
    bscBurnAddress: burned.burnAddress,
    ionBurnSource: OFFICIAL_ION_MAINNET_BURN_ADDRESS,
    windows: [
      { label: "24h", burnedIon: "0", trendPct: 0 },
      { label: "7d", burnedIon: "0", trendPct: 0 },
      { label: "30d", burnedIon: "0", trendPct: 0 },
    ],
    provenance: [
      {
        source: "bsc-indexer",
        status: "online",
        note: `BSC RPC ${chain.rpcUrl} block #${chain.blockNumber}; burn = ERC20 balanceOf(${burned.burnAddress}).`,
      },
      {
        source: "ion-indexer",
        status: ionMainnetBurnedIon === "0" ? "planned" : "online",
        note: ionNote,
      },
    ],
  };
}
