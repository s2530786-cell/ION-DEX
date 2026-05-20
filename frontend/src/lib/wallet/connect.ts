import { connectOfficialNativeWallet } from "./ion-bridge.js";
import { openIonConnectWalletModal } from "./ion-connect-modal.js";
import { startTonConnectRemoteSession } from "./ion-connect-sdk.js";
import { chainIdToNetworkLabel, inferAddressFormat, parseChainIdHex } from "./network.js";
import { getProbeForKey, isEvmProviderKey, scanBrowserWallets } from "./detectors.js";
import type {
  Eip1193Provider,
  LiveWalletConnection,
  WalletConnectResult,
  WalletProviderKey,
} from "./types.js";

function parseAccounts(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

async function requestAccounts(provider: Eip1193Provider): Promise<string[]> {
  const result = await provider.request({ method: "eth_requestAccounts" });
  return parseAccounts(result);
}

async function readChainId(provider: Eip1193Provider): Promise<number | null> {
  const result = await provider.request({ method: "eth_chainId" });
  return parseChainIdHex(result);
}

function mapProviderError(error: unknown): WalletConnectResult {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? Number((error as { code: unknown }).code)
      : null;
  if (code === 4001) {
    return { ok: false, code: "user_rejected", message: "Wallet connection was rejected in the extension." };
  }
  const message =
    error instanceof Error ? error.message : "Wallet provider returned an unexpected error.";
  return { ok: false, code: "provider_error", message };
}

export async function connectWalletProvider(key: WalletProviderKey): Promise<WalletConnectResult> {
  const snapshot = scanBrowserWallets();
  const probe = getProbeForKey(snapshot, key);
  if (!probe) {
    return { ok: false, code: "unsupported", message: "Unknown wallet provider." };
  }

  if (key === "online" || key === "ion-browser") {
    return connectOfficialNativeWallet(key);
  }

  if (probe.key === "walletconnect") {
    if (openIonConnectWalletModal()) {
      return {
        ok: false,
        code: "awaiting_wallet",
        message: "Scan the QR code in the connect modal, then return to ION DEX.",
        walletName: "TonConnect",
      };
    }

    const result = await startTonConnectRemoteSession();
    if (result.status === "connected") {
      return { ok: true, connection: result.connection };
    }
    if (result.status === "awaiting") {
      return {
        ok: false,
        code: "awaiting_wallet",
        message: `Approve connection in ${result.walletName}, then return to ION DEX.`,
        universalLink: result.universalLink,
        walletName: result.walletName,
      };
    }
    return { ok: false, code: "provider_error", message: result.message };
  }

  if (!isEvmProviderKey(key)) {
    return { ok: false, code: "unsupported", message: probe.note };
  }

  if (!probe.detected || !probe.provider) {
    return {
      ok: false,
      code: "not_detected",
      message: `${probe.note} Install the extension or use WalletConnect when enabled.`,
    };
  }

  try {
    const accounts = await requestAccounts(probe.provider);
    const address = accounts[0];
    if (!address) {
      return { ok: false, code: "provider_error", message: "Wallet returned no accounts." };
    }
    const chainId = (await readChainId(probe.provider)) ?? 56;
    return {
      ok: true,
      connection: {
        providerKey: key,
        address,
        chainId,
        networkLabel: chainIdToNetworkLabel(chainId),
        addressFormat: inferAddressFormat(address),
        detectionSource: "browser-injected",
      },
    };
  } catch (error) {
    return mapProviderError(error);
  }
}

export type { LiveWalletConnection };
