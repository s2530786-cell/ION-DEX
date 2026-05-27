import { injected } from "wagmi/connectors";
import type { CreateConnectorFn } from "wagmi";
import type { EIP1193Provider } from "viem";

function readWindow(): Window & {
  ethereum?: { isMetaMask?: boolean; request: (args: { method: string }) => Promise<unknown> };
  BinanceChain?: { request: (args: { method: string }) => Promise<unknown> };
  okxwallet?: { request: (args: { method: string }) => Promise<unknown> };
  bitkeep?: { ethereum?: { request: (args: { method: string }) => Promise<unknown> } };
  trustwallet?: { request: (args: { method: string }) => Promise<unknown> };
  coinbaseWalletExtension?: { request: (args: { method: string }) => Promise<unknown> };
  rabby?: { request: (args: { method: string }) => Promise<unknown> };
} {
  return window as Window & {
    ethereum?: { isMetaMask?: boolean; request: (args: { method: string }) => Promise<unknown> };
    BinanceChain?: { request: (args: { method: string }) => Promise<unknown> };
    okxwallet?: { request: (args: { method: string }) => Promise<unknown> };
    bitkeep?: { ethereum?: { request: (args: { method: string }) => Promise<unknown> } };
    trustwallet?: { request: (args: { method: string }) => Promise<unknown> };
    coinbaseWalletExtension?: { request: (args: { method: string }) => Promise<unknown> };
    rabby?: { request: (args: { method: string }) => Promise<unknown> };
  };
}

function injectedConnector(
  target: () => { id: string; name: string; provider: EIP1193Provider } | undefined,
): CreateConnectorFn {
  return injected({ target });
}

export type EvmWalletKind =
  | "metamask"
  | "binance"
  | "okx"
  | "bitget"
  | "trust"
  | "coinbase"
  | "rabby";

export const EVM_WALLET_KIND_ORDER: readonly EvmWalletKind[] = [
  "okx",
  "metamask",
  "binance",
  "bitget",
  "rabby",
  "trust",
  "coinbase",
] as const;

export const EVM_WALLET_LABELS: Record<EvmWalletKind, string> = {
  metamask: "MetaMask",
  binance: "Binance Web3",
  okx: "OKX Web3",
  bitget: "Bitget Web3",
  trust: "Trust Wallet",
  coinbase: "Coinbase Wallet",
  rabby: "Rabby",
};

export const evmWalletConnectors: Record<EvmWalletKind, CreateConnectorFn> = {
  metamask: injectedConnector(() => {
    const eth = readWindow().ethereum;
    if (!eth?.isMetaMask) {
      return undefined;
    }
    return { id: "metamask", name: "MetaMask", provider: eth as EIP1193Provider };
  }),
  binance: injectedConnector(() => {
    const provider = readWindow().BinanceChain;
    if (!provider) {
      return undefined;
    }
    return { id: "binance", name: "Binance Web3", provider: provider as EIP1193Provider };
  }),
  okx: injectedConnector(() => {
    const provider = readWindow().okxwallet;
    if (!provider) {
      return undefined;
    }
    return { id: "okx", name: "OKX Web3", provider: provider as EIP1193Provider };
  }),
  bitget: injectedConnector(() => {
    const provider = readWindow().bitkeep?.ethereum;
    if (!provider) {
      return undefined;
    }
    return { id: "bitget", name: "Bitget Web3", provider: provider as EIP1193Provider };
  }),
  trust: injectedConnector(() => {
    const provider = readWindow().trustwallet;
    if (!provider) {
      return undefined;
    }
    return { id: "trust", name: "Trust Wallet", provider: provider as EIP1193Provider };
  }),
  coinbase: injectedConnector(() => {
    const provider = readWindow().coinbaseWalletExtension;
    if (!provider) {
      return undefined;
    }
    return { id: "coinbase", name: "Coinbase Wallet", provider: provider as EIP1193Provider };
  }),
  rabby: injectedConnector(() => {
    const provider = readWindow().rabby;
    if (!provider) {
      return undefined;
    }
    return { id: "rabby", name: "Rabby", provider: provider as EIP1193Provider };
  }),
};

export const evmConnectorList = Object.values(evmWalletConnectors);

export function isEvmWalletAvailable(kind: EvmWalletKind): boolean {
  const target = {
    metamask: () => Boolean(readWindow().ethereum?.isMetaMask),
    binance: () => Boolean(readWindow().BinanceChain),
    okx: () => Boolean(readWindow().okxwallet),
    bitget: () => Boolean(readWindow().bitkeep?.ethereum),
    trust: () => Boolean(readWindow().trustwallet),
    coinbase: () => Boolean(readWindow().coinbaseWalletExtension),
    rabby: () => Boolean(readWindow().rabby),
  }[kind];
  return target();
}
