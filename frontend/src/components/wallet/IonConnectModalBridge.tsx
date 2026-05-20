import { useTonConnectModal } from "@ion-gateway/ui-react";
import { useEffect } from "react";
import { registerIonConnectModalOpener } from "@/lib/wallet/ion-connect-modal.js";

/** Registers TonConnect UI modal open() for Profile Hub walletconnect path. */
export function IonConnectModalBridge() {
  const { open } = useTonConnectModal();

  useEffect(() => registerIonConnectModalOpener(open), [open]);

  return null;
}
