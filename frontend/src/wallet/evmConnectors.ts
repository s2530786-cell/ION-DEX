import { injected } from "wagmi/connectors";
import type { CreateConnectorFn } from "wagmi";

type InjectedTarget = {
  id: string;
  name: string;
  provider: unknown;
};

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

function injectedConnector(target: () => InjectedTarget | undefined): CreateConnectorFn {
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
    return { id: "metamask", name: "MetaMask", provider: eth };
  }),
  binance: injectedConnector(() => {
    const provider = readWindow().BinanceChain;
    if (!provider) {
      return undefined;
    }
    return { id: "binance", name: "Binance Web3", provider };
  }),
  okx: injectedConnector(() => {
    const provider = readWindow().okxwallet;
    if (!provider) {
      return undefined;
    }
    return { id: "okx", name: "OKX Web3", provider };
  }),
  bitget: injectedConnector(() => {
    const provider = readWindow().bitkeep?.ethereum;
    if (!provider) {
      return undefined;
    }
    return { id: "bitget", name: "Bitget Web3", provider };
  }),
  trust: injectedConnector(() => {
    const provider = readWindow().trustwallet;
    if (!provider) {
      return undefined;
    }
    return { id: "trust", name: "Trust Wallet", provider };
  }),
  coinbase: injectedConnector(() => {
    const provider = readWindow().coinbaseWalletExtension;
    if (!provider) {
      return undefined;
    }
    return { id: "coinbase", name: "Coinbase Wallet", provider };
  }),
  rabby: injectedConnector(() => {
    const provider = readWindow().rabby;
    if (!provider) {
      return undefined;
    }
    return { id: "rabby", name: "Rabby", provider };
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
