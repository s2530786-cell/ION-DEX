import { BSC_USDT_TOKEN } from "../constants/official-ion-addresses.js";

export type TokenMetadata = {
  symbol: string;
  name: string;
  chain: "ION" | "BSC" | "EVM";
  decimals: number;
  address: string;
  iconHint: string;
  status: "mock" | "planned" | "online";
  provenance: {
    source: "mock" | "upstream";
    note: string;
  };
};

export function getTokens(): TokenMetadata[] {
  return [
    {
      symbol: "ION",
      name: "Ice Open Network",
      chain: "ION",
      decimals: 9,
      address: "native:ion",
      iconHint: "ion",
      status: "mock",
      provenance: {
        source: "mock",
        note: "ION token metadata is a Phase 3 mock placeholder until official adapter confirmation.",
      },
    },
    {
      symbol: "BNB",
      name: "BNB",
      chain: "BSC",
      decimals: 18,
      address: "native:bsc",
      iconHint: "bnb",
      status: "mock",
      provenance: {
        source: "mock",
        note: "BNB metadata is mock display data for local frontend development.",
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
