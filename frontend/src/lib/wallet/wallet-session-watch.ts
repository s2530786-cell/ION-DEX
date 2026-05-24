import { disconnectIonConnect } from "./ion-connect-sdk.js";
import { getProbeForKey, isEvmProviderKey, scanBrowserWallets } from "./detectors.js";
import { resolveIonConnectBridge } from "./ion-bridge.js";
import { getOfficialBridgeSpec, type IonOfficialNativeWalletKey } from "./ion-official.js";
import { chainIdToNetworkLabel, parseChainIdHex } from "./network.js";
import type { LiveWalletConnection } from "./types.js";

function parseAccountsChanged(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  const first = value[0];
  return typeof first === "string" && first.length > 0 ? first : null;
}

function watchEvmProvider(
  connection: LiveWalletConnection,
  onChange: (next: LiveWalletConnection | null) => void,
): () => void {
  const probe = getProbeForKey(scanBrowserWallets(), connection.providerKey);
  const provider = probe?.provider;
  if (!provider?.on) {
    return () => undefined;
  }

  const onAccountsChanged = (accounts: unknown) => {
    const address = parseAccountsChanged(accounts);
    if (!address) {
      onChange(null);
      return;
    }
    onChange({ ...connection, address });
  };

  const onChainChanged = (chainIdHex: unknown) => {
    const chainId = parseChainIdHex(chainIdHex);
    if (chainId === null) {
      return;
    }
    onChange({
      ...connection,
      chainId,
      networkLabel: chainIdToNetworkLabel(chainId),
    });
  };

  const onDisconnect = () => {
    onChange(null);
  };

  provider.on("accountsChanged", onAccountsChanged);
  provider.on("chainChanged", onChainChanged);
  provider.on("disconnect", onDisconnect);

  return () => {
    provider.removeListener?.("accountsChanged", onAccountsChanged);
    provider.removeListener?.("chainChanged", onChainChanged);
    provider.removeListener?.("disconnect", onDisconnect);
  };
}

function watchIonNativeBridge(
  connection: LiveWalletConnection,
  onChange: (next: LiveWalletConnection | null) => void,
): () => void {
  if (connection.providerKey !== "online" && connection.providerKey !== "ion-browser") {
    return () => undefined;
  }
  const spec = getOfficialBridgeSpec(connection.providerKey as IonOfficialNativeWalletKey);
  const resolved = resolveIonConnectBridge(spec.jsBridgeKey);
  if (!resolved) {
    return () => undefined;
  }

  if (!resolved.api.listen) {
    return () => undefined;
  }

  const unsubscribe = resolved.api.listen((event) => {
    const name =
      event && typeof event === "object" && "event" in event
        ? String((event as { event: string }).event)
        : "";
    if (name === "disconnect" || name === "connect_error") {
      onChange(null);
    }
  });

  return () => {
    unsubscribe();
  };
}

/**
 * Subscribe to wallet-side session changes (EVM EIP-1193 events, ION bridge disconnect).
 * TonConnect remote sessions are handled via subscribeIonConnectStatus in AppShell.
 */
export function watchWalletSession(
  connection: LiveWalletConnection,
  onChange: (next: LiveWalletConnection | null) => void,
): () => void {
  if (connection.providerKey === "walletconnect") {
    return () => undefined;
  }

  if (isEvmProviderKey(connection.providerKey)) {
    return watchEvmProvider(connection, onChange);
  }

  return watchIonNativeBridge(connection, onChange);
}

export async function disconnectWalletSession(
  providerKey: string | null,
  _live: LiveWalletConnection | null,
): Promise<void> {
  if (providerKey === "walletconnect") {
    await disconnectIonConnect();
    return;
  }

  if (providerKey === "online" || providerKey === "ion-browser") {
    const spec = getOfficialBridgeSpec(providerKey);
    const resolved = resolveIonConnectBridge(spec.jsBridgeKey);
    try {
      await resolved?.api.disconnect?.();
    } catch {
      // Optional on legacy bridges.
    }
  }
}
