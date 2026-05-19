import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { fetchIonAddressBalanceNano, formatIonBalanceFromNano } from "@/lib/ionChainRpc";
import { connectIonExtensionWallet, subscribeIonExtensionAccounts } from "@/wallet/ionExtension";
import { connectIonOnlineWallet, readIonOnlineAddressFromUrl } from "@/wallet/ionOnline";
import { connectIonTonConnectWallet } from "@/wallet/ionTonConnect";
import type { IonWalletKind, IonWalletSnapshot } from "@/wallet/ionTypes";
import { isIonExtensionInstalled } from "@/wallet/ionExtension";

export type IonWalletStatus = "disconnected" | "connecting" | "connected" | "error";

type IonWalletContextValue = {
  status: IonWalletStatus;
  snapshot: IonWalletSnapshot | null;
  error: string | null;
  hasIonExtension: boolean;
  connect: (kind: IonWalletKind) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
};

const STORAGE_KEY = "ion_dex_ion_wallet_v1";

const IonWalletContext = createContext<IonWalletContextValue | null>(null);

function persistSnapshot(snapshot: IonWalletSnapshot | null): void {
  if (!snapshot) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ kind: snapshot.kind, address: snapshot.address }),
  );
}

function readPersistedSnapshot(): Pick<IonWalletSnapshot, "kind" | "address"> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { kind?: IonWalletKind; address?: string };
    if (!parsed.kind || !parsed.address) {
      return null;
    }
    return { kind: parsed.kind, address: parsed.address };
  } catch {
    return null;
  }
}

export function IonWalletProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<IonWalletStatus>("disconnected");
  const [snapshot, setSnapshot] = useState<IonWalletSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasIonExtension = useMemo(() => isIonExtensionInstalled(), []);

  const refreshBalance = useCallback(async (address: string, kind: IonWalletKind) => {
    try {
      let nano: string;
      if (kind === "ion-browser" && isIonExtensionInstalled()) {
        const { readIonExtensionBalance } = await import("@/wallet/ionExtension");
        nano = await readIonExtensionBalance(address);
        setSnapshot((current) =>
          current?.address === address
            ? {
                ...current,
                balanceIon: formatIonBalanceFromNano(nano),
                balanceSource: "extension",
              }
            : current,
        );
        return;
      }
      nano = await fetchIonAddressBalanceNano(address);
      setSnapshot((current) =>
        current?.address === address
          ? {
              ...current,
              balanceIon: formatIonBalanceFromNano(nano),
              balanceSource: "rpc",
            }
          : current,
      );
    } catch {
      setSnapshot((current) =>
        current?.address === address
          ? { ...current, balanceIon: null, balanceSource: "unavailable" }
          : current,
      );
    }
  }, []);

  const applyConnected = useCallback(
    async (kind: IonWalletKind, address: string) => {
      const next: IonWalletSnapshot = {
        kind,
        address,
        balanceIon: null,
        balanceSource: "unavailable",
        network: "ION Mainnet",
      };
      setSnapshot(next);
      setStatus("connected");
      setError(null);
      persistSnapshot(next);
      await refreshBalance(address, kind);
    },
    [refreshBalance],
  );

  const connect = useCallback(
    async (kind: IonWalletKind) => {
      setStatus("connecting");
      setError(null);
      try {
        let address: string;
        if (kind === "ion-browser") {
          address = await connectIonExtensionWallet();
        } else if (kind === "online") {
          address = await connectIonOnlineWallet();
        } else {
          address = await connectIonTonConnectWallet();
        }
        await applyConnected(kind, address);
      } catch (connectError) {
        const message =
          connectError instanceof Error ? connectError.message : "ION 钱包连接失败。";
        setStatus("error");
        setError(message);
        setSnapshot(null);
        persistSnapshot(null);
      }
    },
    [applyConnected],
  );

  const disconnect = useCallback(() => {
    setSnapshot(null);
    setStatus("disconnected");
    setError(null);
    persistSnapshot(null);
  }, []);

  useEffect(() => {
    const redirected = readIonOnlineAddressFromUrl();
    if (redirected) {
      void applyConnected("online", redirected);
      return;
    }

    const persisted = readPersistedSnapshot();
    if (!persisted) {
      return;
    }
    if (persisted.kind === "ion-browser" && !isIonExtensionInstalled()) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    void applyConnected(persisted.kind, persisted.address);
  }, [applyConnected]);

  useEffect(() => {
    if (!snapshot || snapshot.kind !== "ion-browser") {
      return;
    }
    const cleanup = subscribeIonExtensionAccounts(
      (address) => {
        if (!address) {
          disconnect();
          return;
        }
        void applyConnected("ion-browser", address);
      },
      () => disconnect(),
    );
    return () => {
      cleanup?.();
    };
  }, [applyConnected, disconnect, snapshot?.address, snapshot?.kind]);

  const value = useMemo<IonWalletContextValue>(
    () => ({
      status,
      snapshot,
      error,
      hasIonExtension,
      connect,
      disconnect,
      refreshBalance: async () => {
        if (!snapshot) {
          return;
        }
        await refreshBalance(snapshot.address, snapshot.kind);
      },
    }),
    [connect, disconnect, error, hasIonExtension, refreshBalance, snapshot, status],
  );

  return <IonWalletContext.Provider value={value}>{children}</IonWalletContext.Provider>;
}

export function useIonWallet(): IonWalletContextValue {
  const context = useContext(IonWalletContext);
  if (!context) {
    throw new Error("useIonWallet must be used within IonWalletProvider");
  }
  return context;
}
