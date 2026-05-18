export type TokenMetadata = {
  symbol: string;
  name: string;
  chain: "ION" | "BSC" | "EVM";
  decimals: number;
  address: string;
  iconHint: string;
  status: "native" | "mock" | "planned";
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
      status: "native",
    },
    {
      symbol: "BNB",
      name: "BNB",
      chain: "BSC",
      decimals: 18,
      address: "native:bsc",
      iconHint: "bnb",
      status: "mock",
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      chain: "BSC",
      decimals: 18,
      address: "0x0000000000000000000000000000000000000000",
      iconHint: "usdt",
      status: "mock",
    },
  ];
}
