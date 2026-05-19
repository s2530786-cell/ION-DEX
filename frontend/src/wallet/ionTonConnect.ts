import { connectTonConnectSdkWallet } from "./ionTonConnectSdk";

/** Standalone TonConnect v2 (QR / mobile wallet) via `@tonconnect/sdk`. */
export async function connectIonTonConnectWallet(): Promise<string> {
  return connectTonConnectSdkWallet();
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
