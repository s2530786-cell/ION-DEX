import { connectIonExtensionWallet, extractTonAddress, isIonExtensionInstalled } from "./ionExtension";

/**
 * TonConnect via official extension bridge (`window.tonwallet.tonconnect`).
 * Falls back to ton_requestAccounts when bridge restore is unavailable.
 */
export async function connectIonTonConnectWallet(): Promise<string> {
  if (!isIonExtensionInstalled() || !window.ton) {
    throw new Error(
      "TonConnect 需要已安装的 ION 浏览器钱包扩展（window.ton / window.tonwallet.tonconnect）。",
    );
  }

  const bridge = window.tonwallet?.tonconnect;
  if (bridge?.restoreConnection) {
    try {
      const restored = await bridge.restoreConnection();
      const fromPayload = extractTonConnectAddress(restored);
      if (fromPayload) {
        return fromPayload;
      }
    } catch {
      // restore may fail when no prior session — continue to connect
    }
  }

  if (bridge?.connect) {
    try {
      const connected = await bridge.connect(2, { manifestUrl: window.location.origin });
      const fromConnect = extractTonConnectAddress(connected);
      if (fromConnect) {
        return fromConnect;
      }
    } catch {
      // bridge notify-style errors — fall through
    }
  }

  return connectIonExtensionWallet();
}

function extractTonConnectAddress(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const record = payload as {
    payload?: { items?: Array<{ name?: string; address?: string }> };
    items?: Array<{ name?: string; address?: string }>;
  };
  const items = record.payload?.items ?? record.items;
  if (!Array.isArray(items)) {
    return null;
  }
  const tonAddr = items.find((item) => item.name === "ton_addr" || item.address);
  return tonAddr?.address ?? null;
}
