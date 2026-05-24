import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  WagmiProvider,
  createConfig,
  http,
  useAccount,
  useConnect,
  useDisconnect,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { bsc } from "wagmi/chains";
import type { WalletClient } from "viem";
import { fetchBscWalletBalance } from "@/lib/ionApi";
import {
  EVM_WALLET_LABELS,
  evmConnectorList,
  evmWalletConnectors,
  isEvmWalletAvailable,
  type EvmWalletKind,
} from "@/wallet/evmConnectors";
import type { EvmWalletSnapshot } from "@/wallet/types";

export type EvmWalletStatus = "disconnected" | "connecting" | "connected" | "error";

export type EvmWalletContextValue = {
  status: EvmWalletStatus;
  snapshot: EvmWalletSnapshot | null;
  error: string | null;
  activeWallet: EvmWalletKind | null;
  availableWallets: EvmWalletKind[];
  connectWallet: (kind: EvmWalletKind) => Promise<void>;
  connectInjected: () => Promise<void>;
  hasInjectedProvider: boolean;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  publicClient: ReturnType<typeof usePublicClient> | undefined;
  /** Live viem WalletClient when EVM wallet is connected (used by scaffold trade/vault pages). */
  walletClient: WalletClient | undefined;
};

const wagmiConfig = createConfig({
  chains: [bsc],
  connectors: evmConnectorList,
  transports: {
    [bsc.id]: http(
      import.meta.env.VITE_BSC_RPC_URL?.trim() || "https://bsc-dataseed.binance.org/",
    ),
  },
});

const queryClient = new QueryClient();

const EvmWalletBridgeContext = createContext<EvmWalletContextValue | null>(null);

const EVM_WALLET_KINDS: EvmWalletKind[] = [
  "metamask",
  "binance",
  "okx",
  "bitget",
  "trust",
  "coinbase",
  "rabby",
];

function EvmWalletBridgeProvider({ children }: PropsWithChildren) {
  const { address, chainId, connector, status: accountStatus } = useAccount();
  const { connectAsync, isPending, error: connectError } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const publicClient = usePublicClient({ chainId: bsc.id });
  const { data: walletClient } = useWalletClient();

  const [snapshot, setSnapshot] = useState<EvmWalletSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeWallet, setActiveWallet] = useState<EvmWalletKind | null>(null);

  const availableWallets = useMemo(
    () => EVM_WALLET_KINDS.filter((kind) => isEvmWalletAvailable(kind)),
    [],
  );

  const refreshBalance = useCallback(async (walletAddress: string) => {
    try {
      const response = await fetchBscWalletBalance(walletAddress);
      setSnapshot((current) =>
        current && current.address.toLowerCase() === walletAddress.toLowerCase()
          ? {
              ...current,
              balanceBnb: response.data.balanceBnb,
              balanceSource: "backend",
            }
          : current,
      );
    } catch {
      setSnapshot((current) =>
        current
          ? {
              ...current,
              balanceBnb: null,
              balanceSource: "unavailable",
            }
          : current,
      );
    }
  }, []);

  const connectWallet = useCallback(
    async (kind: EvmWalletKind) => {
      if (!isEvmWalletAvailable(kind)) {
        setError(`${EVM_WALLET_LABELS[kind]} is not installed in this browser.`);
        return;
      }
      setError(null);
      try {
        const result = await connectAsync({
          connector: evmWalletConnectors[kind],
          chainId: bsc.id,
        });
        const next: EvmWalletSnapshot = {
          address: result.accounts[0],
          chainId: result.chainId,
          balanceBnb: null,
          balanceSource: "unavailable",
          walletKind: kind,
        };
        setSnapshot(next);
        setActiveWallet(kind);
        await refreshBalance(next.address);
      } catch (walletError) {
        const message =
          walletError instanceof Error ? walletError.message : "EVM wallet connection failed.";
        setError(message);
        setSnapshot(null);
        setActiveWallet(null);
      }
    },
    [connectAsync, refreshBalance],
  );

  const connectInjected = useCallback(async () => {
    const first = availableWallets[0] ?? "metamask";
    await connectWallet(first);
  }, [availableWallets, connectWallet]);

  const disconnect = useCallback(() => {
    void disconnectAsync();
    setSnapshot(null);
    setActiveWallet(null);
    setError(null);
  }, [disconnectAsync]);

  useEffect(() => {
    if (accountStatus === "connected" && address && chainId) {
      const kind =
        activeWallet ??
        (connector?.id && EVM_WALLET_KINDS.includes(connector.id as EvmWalletKind)
          ? (connector.id as EvmWalletKind)
          : null);
      setSnapshot((current) => ({
        address,
        chainId,
        balanceBnb: current?.balanceBnb ?? null,
        balanceSource: current?.balanceSource ?? "unavailable",
        walletKind: kind,
      }));
      if (kind) {
        setActiveWallet(kind);
      }
      void refreshBalance(address);
      return;
    }
    if (accountStatus === "disconnected") {
      setSnapshot(null);
      setActiveWallet(null);
    }
  }, [accountStatus, activeWallet, address, chainId, connector?.id, refreshBalance]);

  useEffect(() => {
    if (connectError) {
      setError(connectError.message);
    }
  }, [connectError]);

  const status: EvmWalletStatus = useMemo(() => {
    if (isPending) {
      return "connecting";
    }
    if (error && !snapshot) {
      return "error";
    }
    if (snapshot && accountStatus === "connected") {
      return "connected";
    }
    return "disconnected";
  }, [accountStatus, error, isPending, snapshot]);

  const value = useMemo<EvmWalletContextValue>(
    () => ({
      status,
      snapshot,
      error,
      activeWallet,
      availableWallets,
      connectWallet,
      connectInjected,
      hasInjectedProvider: availableWallets.length > 0,
      disconnect,
      refreshBalance: async () => {
        if (!snapshot?.address) {
          return;
        }
        await refreshBalance(snapshot.address);
      },
      publicClient,
      walletClient,
    }),
    [
      activeWallet,
      availableWallets,
      connectInjected,
      connectWallet,
      disconnect,
      error,
      publicClient,
      refreshBalance,
      snapshot,
      status,
      walletClient,
    ],
  );

  return <EvmWalletBridgeContext.Provider value={value}>{children}</EvmWalletBridgeContext.Provider>;
}

export function EvmWalletProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <EvmWalletBridgeProvider>{children}</EvmWalletBridgeProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export function useEvmWallet(): EvmWalletContextValue {
  const context = useContext(EvmWalletBridgeContext);
  if (!context) {
    throw new Error("useEvmWallet must be used within EvmWalletProvider");
  }
  return context;
}
