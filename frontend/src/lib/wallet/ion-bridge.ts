import { getOfficialBridgeSpec, type IonOfficialNativeWalletKey } from "./ion-official.js";
import { formatAddressPreview, inferAddressFormat } from "./network.js";
import type { LiveWalletConnection, WalletConnectResult } from "./types.js";

/** Minimal TonConnect bridge surface from ice-blockchain/ion-gateway InjectedWalletApi */
export type IonConnectBridgeApi = {
  protocolVersion: number;
  walletInfo?: {
    name: string;
    app_name: string;
    image: string;
    about_url: string;
    platforms: string[];
  };
  connect: (
    protocolVersion: number,
    message: { manifestUrl: string; return: string; items: Array<{ name: string }> },
  ) => Promise<IonConnectWalletEvent>;
  restoreConnection: () => Promise<IonConnectWalletEvent>;
  listen?: (callback: (event: IonConnectWalletEvent) => void) => () => void;
  disconnect?: () => void | Promise<void>;
};

type IonConnectWalletEvent =
  | {
      event: "connect";
      payload: {
        items: Array<{
          name: string;
          address?: string;
          network?: string;
          error?: { code: number; message?: string };
        }>;
      };
    }
  | {
      event: "connect_error";
      payload: { code: number; message: string };
    };

type BridgeSlot = {
  ionconnect?: IonConnectBridgeApi;
  tonconnect?: IonConnectBridgeApi;
};

const TON_MAINNET_CHAIN_ID = -239;
const TON_TESTNET_CHAIN_ID = -3;

function hasIonConnectMetadata(bridge: unknown): bridge is IonConnectBridgeApi {
  if (!bridge || typeof bridge !== "object") {
    return false;
  }
  const api = bridge as IonConnectBridgeApi;
  const info = api.walletInfo;
  return (
    typeof api.connect === "function" &&
    typeof api.restoreConnection === "function" &&
    (!info ||
      (typeof info.name === "string" &&
        typeof info.app_name === "string" &&
        typeof info.image === "string" &&
        typeof info.about_url === "string" &&
        Array.isArray(info.platforms)))
  );
}

export function readBridgeSlot(jsBridgeKey: string): BridgeSlot | null {
  if (typeof window === "undefined") {
    return null;
  }
  const slot = (window as unknown as Record<string, unknown>)[jsBridgeKey];
  if (!slot || typeof slot !== "object") {
    return null;
  }
  return slot as BridgeSlot;
}

export function resolveIonConnectBridge(jsBridgeKey: string): {
  api: IonConnectBridgeApi;
  field: "ionconnect" | "tonconnect";
} | null {
  const slot = readBridgeSlot(jsBridgeKey);
  if (!slot) {
    return null;
  }
  if (hasIonConnectMetadata(slot.ionconnect)) {
    return { api: slot.ionconnect, field: "ionconnect" };
  }
  if (hasIonConnectMetadata(slot.tonconnect)) {
    return { api: slot.tonconnect, field: "tonconnect" };
  }
  return null;
}

export function isOfficialNativeBridgeInjected(profileKey: IonOfficialNativeWalletKey): boolean {
  const spec = getOfficialBridgeSpec(profileKey);
  return resolveIonConnectBridge(spec.jsBridgeKey) !== null;
}

function tonNetworkToChainId(network: string | undefined): number {
  const value = network?.trim();
  if (value === "-3" || value === TON_TESTNET_CHAIN_ID.toString()) {
    return TON_TESTNET_CHAIN_ID;
  }
  return TON_MAINNET_CHAIN_ID;
}

function tonNetworkLabel(chainId: number): string {
  if (chainId === TON_TESTNET_CHAIN_ID) {
    return "ION Testnet";
  }
  return "ION Mainnet";
}

function parseTonAddressFromEvent(event: IonConnectWalletEvent): string | null {
  if (event.event !== "connect") {
    return null;
  }
  const item = event.payload.items.find((entry) => entry.name === "ton_addr" && entry.address);
  return item?.address ?? null;
}

function defaultManifestUrl(): string {
  if (typeof window === "undefined") {
    return "https://ion.dex/ionconnect-manifest.json";
  }
  return `${window.location.origin}/ionconnect-manifest.json`;
}

export async function connectOfficialNativeWallet(
  profileKey: IonOfficialNativeWalletKey,
): Promise<WalletConnectResult> {
  const spec = getOfficialBridgeSpec(profileKey);
  const resolved = resolveIonConnectBridge(spec.jsBridgeKey);
  if (!resolved) {
    return {
      ok: false,
      code: "not_detected",
      message: `${spec.productName} requires ${spec.officialRepo} injection at window.${spec.jsBridgeKey}.ionconnect`,
    };
  }

  const { api } = resolved;
  const protocolVersion = api.protocolVersion > 0 ? api.protocolVersion : 2;
  const request = {
    manifestUrl: defaultManifestUrl(),
    return: "back" as const,
    items: [{ name: "ton_addr" }],
  };

  try {
    let event = await api.restoreConnection();
    if (event.event !== "connect") {
      event = await api.connect(protocolVersion, request);
    }

    if (event.event === "connect_error") {
      const code = event.payload.code;
      if (code === 300 || code === 100) {
        return {
          ok: false,
          code: "user_rejected",
          message: event.payload.message || "Wallet connection was rejected.",
        };
      }
      return {
        ok: false,
        code: "provider_error",
        message: event.payload.message || "TonConnect bridge returned an error.",
      };
    }

    const address = parseTonAddressFromEvent(event);
    if (!address) {
      return {
        ok: false,
        code: "provider_error",
        message: "Wallet connected but did not return a ton_addr item.",
      };
    }

    const tonItem = event.payload.items.find((entry) => entry.name === "ton_addr");
    const chainId = tonNetworkToChainId(tonItem?.network);

    const connection: LiveWalletConnection = {
      providerKey: profileKey,
      address,
      chainId,
      networkLabel: tonNetworkLabel(chainId),
      addressFormat: inferAddressFormat(address),
      detectionSource: "browser-injected",
      bridgeKey: spec.jsBridgeKey,
      bridgeField: resolved.field,
    };

    return { ok: true, connection };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Official ION wallet bridge returned an unexpected error.";
    return { ok: false, code: "provider_error", message };
  }
}

export function formatOfficialDetectorLabel(profileKey: IonOfficialNativeWalletKey): string {
  const spec = getOfficialBridgeSpec(profileKey);
  const resolved = resolveIonConnectBridge(spec.jsBridgeKey);
  if (resolved) {
    return `${spec.productName} injected via window.${spec.jsBridgeKey}.${resolved.field}`;
  }
  return `${spec.productName} not detected — install ${spec.officialRepo} or use profile seed session`;
}
