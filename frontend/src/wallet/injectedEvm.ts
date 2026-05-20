import type { Eip1193Provider, InjectedEthereum } from "./types";

export function getInjectedProvider(): InjectedEthereum | null {
  if (typeof window === "undefined") {
    return null;
  }
  const candidate = window.ethereum;
  if (!candidate || typeof candidate.request !== "function") {
    return null;
  }
  return candidate;
}

function parseChainIdHex(value: unknown): number {
  if (typeof value !== "string") {
    throw new Error("Wallet returned an invalid chain id.");
  }
  const normalized = value.startsWith("0x") ? value : `0x${value}`;
  const parsed = Number.parseInt(normalized, 16);
  if (!Number.isFinite(parsed)) {
    throw new Error("Wallet returned an invalid chain id.");
  }
  return parsed;
}

export async function connectInjectedWallet(provider: Eip1193Provider): Promise<{
  address: string;
  chainId: number;
}> {
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as unknown;
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string") {
    throw new Error("Wallet did not return an account address.");
  }
  const chainIdRaw = await provider.request({ method: "eth_chainId" });
  return {
    address: accounts[0],
    chainId: parseChainIdHex(chainIdRaw),
  };
}

export async function readInjectedChainId(provider: Eip1193Provider): Promise<number> {
  const chainIdRaw = await provider.request({ method: "eth_chainId" });
  return parseChainIdHex(chainIdRaw);
}

export function shortenAddress(address: string): string {
  if (address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
