const CHAIN_LABELS: Record<number, string> = {
  [-239]: "ION Mainnet",
  [-3]: "ION Testnet",
  1: "Ethereum Mainnet",
  56: "BNB Smart Chain",
  97: "BNB Smart Chain Testnet",
  42161: "Arbitrum One",
  10: "Optimism",
  137: "Polygon",
};

export function chainIdToNetworkLabel(chainId: number): string {
  return CHAIN_LABELS[chainId] ?? `EVM chain ${chainId}`;
}

export function formatAddressPreview(address: string): string {
  const trimmed = address.trim();
  if (trimmed.length <= 12) {
    return trimmed;
  }
  if (trimmed.includes(":")) {
    return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
  }
  if (trimmed.startsWith("0x") && trimmed.length > 10) {
    return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
  }
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

export function inferAddressFormat(address: string): string {
  if (address.startsWith("0x")) {
    return "EVM checksummed";
  }
  if (address.includes(":")) {
    return "ION / TON-style";
  }
  if (address.startsWith("UQ") || address.startsWith("EQ")) {
    return "ION user-friendly";
  }
  return "Unknown";
}

export function parseChainIdHex(value: unknown): number | null {
  if (typeof value !== "string" || !value.startsWith("0x")) {
    return null;
  }
  const parsed = Number.parseInt(value, 16);
  return Number.isFinite(parsed) ? parsed : null;
}
