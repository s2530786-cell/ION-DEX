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
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import type { WalletClient } from "viem";
import { BSC_CHAIN_ID } from "@/lib/integrationConfig";
import { fetchBscWalletBalance } from "@/lib/ionApi";
import { startEip6963Discovery, sortEvmWalletKinds } from "@/wallet/eip6963";
import { bsc, ionScaffoldChain } from "@/wallet/evmChains";
import {
  EVM_WALLET_KIND_ORDER,
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
  switchChain: (chainId: number) => Promise<void>;
  targetChainId: number;
  publicClient: ReturnType<typeof usePublicClient> | undefined;
  /** Live viem WalletClient when EVM wallet is connected (used by scaffold trade/vault pages). */
  walletClient: WalletClient | undefined;
};

const wagmiConfig = createConfig({
  chains: [bsc, ionScaffoldChain],
  connectors: evmConnectorList,
  multiInjectedProviderDiscovery: true,
  transports: {
    [bsc.id]: http(
      import.meta.env.VITE_BSC_RPC_URL?.trim() || "https://bsc-dataseed.binance.org/",
    ),
    [ionScaffoldChain.id]: http(ionScaffoldChain.rpcUrls.default.http[0]),
  },
});

const queryClient = new QueryClient();

const EvmWalletBridgeContext = createContext<EvmWalletContextValue | null>(null);

function EvmWalletBridgeProvider({ children }: PropsWithChildren) {
  const { address, chainId, connector, status: accountStatus } = useAccount();
  const { connectAsync, isPending, error: connectError } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [targetChainId, setTargetChainId] = useState<number>(BSC_CHAIN_ID);
  const publicClient = usePublicClient({ chainId: targetChainId });
  const { data: walletClient } = useWalletClient();

  const [snapshot, setSnapshot] = useState<EvmWalletSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeWallet, setActiveWallet] = useState<EvmWalletKind | null>(null);

  useEffect(() => {
    startEip6963Discovery();
  }, []);

  const availableWallets = useMemo(
    () => sortEvmWalletKinds(EVM_WALLET_KIND_ORDER, isEvmWalletAvailable),
    [],
  );

  const ensureTargetChain = useCallback(
    async (connectedChainId: number) => {
      if (connectedChainId === targetChainId) {
        return;
      }
      try {
        await switchChainAsync({ chainId: targetChainId });
      } catch (switchError) {
        const message =
          switchError instanceof Error
            ? switchError.message
            : "Wallet rejected chain switch. Add BSC or ION scaffold network in the wallet.";
        setError(message);
      }
    },
    [switchChainAsync, targetChainId],
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
          chainId: targetChainId,
        });
        await ensureTargetChain(result.chainId);
        const next: EvmWalletSnapshot = {
          address: result.accounts[0],
          chainId: targetChainId,
          balanceBnb: null,
          balanceSource: "unavailable",
          walletKind: kind,
        };
        setSnapshot(next);
        setActiveWallet(kind);
        if (targetChainId === BSC_CHAIN_ID) {
          await refreshBalance(next.address);
        }
      } catch (walletError) {
        const message =
          walletError instanceof Error ? walletError.message : "EVM wallet connection failed.";
        setError(message);
        setSnapshot(null);
        setActiveWallet(null);
      }
    },
    [connectAsync, ensureTargetChain, refreshBalance, targetChainId],
  );

  const switchChain = useCallback(
    async (nextChainId: number) => {
      setTargetChainId(nextChainId);
      if (accountStatus !== "connected") {
        return;
      }
      await switchChainAsync({ chainId: nextChainId });
      if (address) {
        setSnapshot((current) =>
          current
            ? {
                ...current,
                chainId: nextChainId,
              }
            : current,
        );
        if (nextChainId === BSC_CHAIN_ID) {
          await refreshBalance(address);
        }
      }
    },
    [accountStatus, address, refreshBalance, switchChainAsync],
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
        (connector?.id && EVM_WALLET_KIND_ORDER.includes(connector.id as EvmWalletKind)
          ? (connector.id as EvmWalletKind)
          : null);
      setSnapshot((current) => ({
        address,
        chainId: chainId ?? targetChainId,
        balanceBnb: current?.balanceBnb ?? null,
        balanceSource: current?.balanceSource ?? "unavailable",
        walletKind: kind,
      }));
      if (kind) {
        setActiveWallet(kind);
      }
      if (chainId !== targetChainId) {
        void ensureTargetChain(chainId);
      }
      if (targetChainId === BSC_CHAIN_ID) {
        void refreshBalance(address);
      }
      return;
    }
    if (accountStatus === "disconnected") {
      setSnapshot(null);
      setActiveWallet(null);
    }
  }, [
    accountStatus,
    activeWallet,
    address,
    chainId,
    connector?.id,
    ensureTargetChain,
    refreshBalance,
    targetChainId,
  ]);

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
      switchChain,
      targetChainId,
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
      switchChain,
      targetChainId,
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
