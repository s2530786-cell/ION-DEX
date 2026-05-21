import TonConnect, { isWalletInfoInjected } from "@tonconnect/sdk";

let tonConnectSingleton: TonConnect | null = null;

function resolveManifestUrl(): string {
  const configured = import.meta.env.VITE_TONCONNECT_MANIFEST_URL?.trim();
  if (configured) {
    return configured;
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "https://ion-dex.local";
  return `${origin}/tonconnect-manifest.json`;
}

export function getTonConnectSdk(): TonConnect {
  if (!tonConnectSingleton) {
    tonConnectSingleton = new TonConnect({ manifestUrl: resolveManifestUrl() });
  }
  return tonConnectSingleton;
}

export async function connectTonConnectSdkWallet(): Promise<string> {
  const tonConnect = getTonConnectSdk();
  if (tonConnect.connected && tonConnect.wallet?.account?.address) {
    return tonConnect.wallet.account.address;
  }

  await tonConnect.restoreConnection();
  if (tonConnect.connected && tonConnect.wallet?.account?.address) {
    return tonConnect.wallet.account.address;
  }

  const wallets = await tonConnect.getWallets();
  const preferred = wallets.find((wallet) => wallet.appName.toLowerCase().includes("tonkeeper"));
  const wallet = preferred ?? wallets[0];
  if (!wallet) {
    throw new Error("未找到可用的 TonConnect 钱包。请安装 Tonkeeper 或 ION 钱包后重试。");
  }

  if ("universalLink" in wallet && wallet.universalLink) {
    await tonConnect.connect({
      universalLink: wallet.universalLink,
      bridgeUrl: wallet.bridgeUrl,
    });
  } else if (isWalletInfoInjected(wallet)) {
    await tonConnect.connect({ jsBridgeKey: wallet.jsBridgeKey });
  } else {
    throw new Error("所选 TonConnect 钱包不支持当前浏览器环境。");
  }

  const address = tonConnect.wallet?.account?.address;
  if (!address) {
    throw new Error("TonConnect 已连接但未返回地址。");
  }
  return address;
}

export async function restoreTonConnectSdkWallet(): Promise<string | null> {
  const tonConnect = getTonConnectSdk();
  await tonConnect.restoreConnection();
  return tonConnect.wallet?.account?.address ?? null;
}

export async function disconnectTonConnectSdkWallet(): Promise<void> {
  const tonConnect = getTonConnectSdk();
  if (tonConnect.connected) {
    await tonConnect.disconnect();
  }
}

export async function sendTonConnectSdkTransaction(input: {
  to: string;
  amountNano: string;
  payloadBase64: string;
  validUntilSec?: number;
}): Promise<string> {
  const tonConnect = getTonConnectSdk();
  if (!tonConnect.connected) {
    throw new Error("TonConnect 未连接。请先选择 TonConnect (QR) 钱包。");
  }

  const validUntil = Math.floor(Date.now() / 1000) + (input.validUntilSec ?? 600);
  const result = await tonConnect.sendTransaction({
    validUntil,
    messages: [
      {
        address: input.to,
        amount: input.amountNano,
        payload: input.payloadBase64,
      },
    ],
  });

  const boc = result?.boc;
  if (!boc || typeof boc !== "string") {
    throw new Error("TonConnect 未返回交易 BOC。");
  }
  return boc;
}

/** Extract address from TonConnect wallet account for restore flows. */
export function readTonConnectSdkAddress(): string | null {
  const tonConnect = getTonConnectSdk();
  return tonConnect.wallet?.account?.address ?? null;
}
