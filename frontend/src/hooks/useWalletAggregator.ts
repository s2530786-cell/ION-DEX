/**
 * Aggregates EVM (wagmi/viem) and ION wallet context for Doubao-derived trade/vault pages.
 * EVM signer/publicClient are live when connected; ION branch uses scaffold chainId until official wiring.
 */
import { useMemo } from "react";
import { ION_CHAIN_ID_SCAFFOLD } from "@/lib/integrationConfig";
import { useEvmWallet } from "@/context/EvmWalletContext";
import { useIonWallet } from "@/context/IonWalletContext";
import type { EvmWalletKind } from "@/wallet/evmConnectors";
import type { IonWalletKind } from "@/wallet/ionTypes";

export type WalletType = "metamask" | "rabby" | "ion" | "okx";

export type AggregatedWalletState = {
  address: string;
  chainId: number;
  walletType: WalletType;
};

export function useWalletAggregator() {
  const evmWallet = useEvmWallet();
  const ionWallet = useIonWallet();

  const state = useMemo<AggregatedWalletState | null>(() => {
    if (evmWallet.status === "connected" && evmWallet.snapshot) {
      const walletType: WalletType =
        evmWallet.activeWallet === "rabby"
          ? "rabby"
          : evmWallet.activeWallet === "okx"
            ? "okx"
            : "metamask";
      return {
        address: evmWallet.snapshot.address,
        chainId: evmWallet.snapshot.chainId,
        walletType,
      };
    }

    if (ionWallet.status === "connected" && ionWallet.snapshot) {
      return {
        address: ionWallet.snapshot.address,
        chainId: ION_CHAIN_ID_SCAFFOLD,
        walletType: "ion",
      };
    }

    return null;
  }, [evmWallet.activeWallet, evmWallet.snapshot, evmWallet.status, ionWallet.snapshot, ionWallet.status]);

  async function connect(type: WalletType) {
    if (type === "ion") {
      const ionKind: IonWalletKind = ionWallet.hasIonExtension ? "ion-browser" : "walletconnect";
      await ionWallet.connect(ionKind);
      return;
    }

    const evmKind: EvmWalletKind = type === "rabby" ? "rabby" : type === "okx" ? "okx" : "metamask";
    await evmWallet.connectWallet(evmKind);
  }

  async function disconnect() {
    evmWallet.disconnect();
    ionWallet.disconnect();
  }

  return {
    connect,
    disconnect,
    provider: evmWallet.publicClient,
    signer: evmWallet.walletClient,
    address: state?.address ?? "",
    chainId: state?.chainId ?? 0,
    walletType: state?.walletType ?? null,
    evmWallet,
    ionWallet,
  };
}
