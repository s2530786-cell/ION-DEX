import TonConnect, {
  CHAIN,
  isWalletInfoRemote,
  type Wallet,
  type WalletInfo,
} from "@ion-gateway/sdk";
import { ionConnectManifestUrl } from "./ion-connect-manifest.js";
import { inferAddressFormat } from "./network.js";
import type { LiveWalletConnection } from "./types.js";

let connector: TonConnect | null = null;

export function getIonConnect(): TonConnect {
  if (!connector) {
    connector = new TonConnect({ manifestUrl: ionConnectManifestUrl() });
  }
  return connector;
}

export function subscribeIonConnectStatus(
  onWallet: (wallet: Wallet | null) => void,
  onError?: (error: unknown) => void,
): () => void {
  return getIonConnect().onStatusChange(onWallet, onError);
}

export function liveConnectionFromTonWallet(wallet: Wallet): LiveWalletConnection {
  const chainId = wallet.account.chain === CHAIN.TESTNET ? -3 : -239;
  const networkLabel = chainId === -3 ? "ION Testnet" : "ION Mainnet";
  return {
    providerKey: "walletconnect",
    address: wallet.account.address,
    chainId,
    networkLabel,
    addressFormat: inferAddressFormat(wallet.account.address),
    detectionSource: "tonconnect-remote",
  };
}

function pickRemoteWallet(wallets: WalletInfo[]): WalletInfo | undefined {
  const remotes = wallets.filter(isWalletInfoRemote).filter((w) => w.bridgeUrl);
  return (
    remotes.find((w) => w.appName === "mytonwallet") ??
    remotes.find((w) => w.appName === "tonkeeper") ??
    remotes[0]
  );
}

export async function startTonConnectRemoteSession(): Promise<
  | { status: "connected"; connection: LiveWalletConnection }
  | { status: "awaiting"; universalLink: string; walletName: string }
  | { status: "error"; message: string }
> {
  if (typeof window === "undefined") {
    return { status: "error", message: "TonConnect is only available in the browser." };
  }

  try {
    const tc = getIonConnect();
    if (tc.connected) {
      await tc.disconnect();
    }

    await tc.restoreConnection({ openingDeadlineMS: 8_000 });
    if (tc.connected && tc.wallet) {
      return { status: "connected", connection: liveConnectionFromTonWallet(tc.wallet) };
    }

    const wallets = await TonConnect.getWallets();
    const remote = pickRemoteWallet(wallets);
    if (!remote || !isWalletInfoRemote(remote) || !remote.bridgeUrl) {
      return {
        status: "error",
        message: "No TonConnect remote wallet entry returned from ion-gateway wallet list.",
      };
    }

    const universalLink = tc.connect({
      universalLink: remote.universalLink,
      bridgeUrl: remote.bridgeUrl,
    });

    if (typeof universalLink !== "string" || universalLink.length === 0) {
      return { status: "error", message: "TonConnect did not return a wallet universal link." };
    }

    return { status: "awaiting", universalLink, walletName: remote.name };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "TonConnect remote session failed unexpectedly.";
    return { status: "error", message };
  }
}

export async function disconnectIonConnect(): Promise<void> {
  try {
    const tc = getIonConnect();
    if (tc.connected) {
      await tc.disconnect();
    }
  } catch {
    // User may already be disconnected.
  }
}

export function isTonConnectSdkAvailable(): boolean {
  return typeof window !== "undefined";
}
