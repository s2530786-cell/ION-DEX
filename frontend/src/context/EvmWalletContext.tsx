import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { fetchBscWalletBalance } from "@/lib/ionApi";
import {
  connectInjectedWallet,
  getInjectedProvider,
  readInjectedChainId,
} from "@/wallet/injectedEvm";
import type { EvmWalletSnapshot } from "@/wallet/types";

export type EvmWalletStatus = "disconnected" | "connecting" | "connected" | "error";

type EvmWalletContextValue = {
  status: EvmWalletStatus;
  snapshot: EvmWalletSnapshot | null;
  error: string | null;
  hasInjectedProvider: boolean;
  connectInjected: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
};

const EvmWalletContext = createContext<EvmWalletContextValue | null>(null);

export function EvmWalletProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<EvmWalletStatus>("disconnected");
  const [snapshot, setSnapshot] = useState<EvmWalletSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasInjectedProvider = useMemo(() => getInjectedProvider() !== null, []);

  const refreshBalance = useCallback(async (address: string) => {
    try {
      const response = await fetchBscWalletBalance(address);
      setSnapshot((current) =>
        current && current.address.toLowerCase() === address.toLowerCase()
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

  const connectInjected = useCallback(async () => {
    const provider = getInjectedProvider();
    if (!provider) {
      setStatus("error");
      setError("No injected EVM wallet found. Install MetaMask or OKX Web3, then reload.");
      return;
    }

    setStatus("connecting");
    setError(null);
    try {
      const { address, chainId } = await connectInjectedWallet(provider);
      const next: EvmWalletSnapshot = {
        address,
        chainId,
        balanceBnb: null,
        balanceSource: "unavailable",
      };
      setSnapshot(next);
      setStatus("connected");
      await refreshBalance(address);
    } catch (connectError) {
      const message =
        connectError instanceof Error ? connectError.message : "Wallet connection failed.";
      setStatus("error");
      setError(message);
      setSnapshot(null);
    }
  }, [refreshBalance]);

  const disconnect = useCallback(() => {
    setSnapshot(null);
    setStatus("disconnected");
    setError(null);
  }, []);

  useEffect(() => {
    const provider = getInjectedProvider();
    if (!provider?.on) {
      return;
    }

    const onAccountsChanged = (accounts: unknown) => {
      if (!Array.isArray(accounts) || typeof accounts[0] !== "string") {
        disconnect();
        return;
      }
      void (async () => {
        try {
          const chainId = await readInjectedChainId(provider);
          setSnapshot({
            address: accounts[0],
            chainId,
            balanceBnb: null,
            balanceSource: "unavailable",
          });
          setStatus("connected");
          setError(null);
          await refreshBalance(accounts[0]);
        } catch {
          disconnect();
        }
      })();
    };

    const onChainChanged = () => {
      if (!snapshot?.address) {
        return;
      }
      void connectInjected();
    };

    provider.on("accountsChanged", onAccountsChanged);
    provider.on("chainChanged", onChainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, [connectInjected, disconnect, refreshBalance, snapshot?.address]);

  const value = useMemo<EvmWalletContextValue>(
    () => ({
      status,
      snapshot,
      error,
      hasInjectedProvider,
      connectInjected,
      disconnect,
      refreshBalance: async () => {
        if (!snapshot?.address) {
          return;
        }
        await refreshBalance(snapshot.address);
      },
    }),
    [connectInjected, disconnect, error, hasInjectedProvider, refreshBalance, snapshot, status],
  );

  return <EvmWalletContext.Provider value={value}>{children}</EvmWalletContext.Provider>;
}

export function useEvmWallet(): EvmWalletContextValue {
  const context = useContext(EvmWalletContext);
  if (!context) {
    throw new Error("useEvmWallet must be used within EvmWalletProvider");
  }
  return context;
}
