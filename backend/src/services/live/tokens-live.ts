import type { ServerConfig } from "../../config/server-config.js";
import {
  BSC_ION_TOKEN,
  BSC_USDT_TOKEN,
} from "../../constants/official-ion-addresses.js";
import type { TokenMetadata } from "../tokens.js";

export function loadLiveTokens(config: ServerConfig): TokenMetadata[] {
  const ionAddress = config.bscIonTokenAddress ?? BSC_ION_TOKEN;

  return [
    {
      symbol: "ION",
      name: "Ice Open Network",
      chain: "BSC",
      decimals: 9,
      address: ionAddress,
      iconHint: "ion",
      status: "online",
      provenance: {
        source: "upstream",
        note: "Official BSC ION ERC-20 (ice-blockchain bridge deployment).",
      },
    },
    {
      symbol: "BNB",
      name: "BNB",
      chain: "BSC",
      decimals: 18,
      address: "native:bsc",
      iconHint: "bnb",
      status: "online",
      provenance: {
        source: "upstream",
        note: `BSC native asset via RPC ${config.bscRpcUrl}.`,
      },
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      chain: "BSC",
      decimals: 18,
      address: BSC_USDT_TOKEN,
      iconHint: "usdt",
      status: "online",
      provenance: {
        source: "upstream",
        note: "BSC USDT (BEP-20) canonical contract address.",
      },
    },
  ];
}
