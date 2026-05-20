import {
  formatOfficialDetectorLabel,
  isOfficialNativeBridgeInjected,
  resolveIonConnectBridge,
} from "./ion-bridge.js";
import { isTonConnectSdkAvailable } from "./ion-connect-sdk.js";
import { getOfficialBridgeSpec, type IonOfficialNativeWalletKey } from "./ion-official.js";
import {
  WALLET_PROVIDER_KEYS,
  type Eip1193Provider,
  type WalletDetectionSnapshot,
  type WalletProbeResult,
  type WalletProviderKey,
} from "./types.js";

function getWindowEthereum(): Eip1193Provider | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.ethereum;
}

function probe(
  key: WalletProviderKey,
  detected: boolean,
  detector: string,
  provider: Eip1193Provider | null,
  note: string,
): WalletProbeResult {
  return { key, detected, detector, provider, note };
}

function detectOfficialNative(profileKey: IonOfficialNativeWalletKey): WalletProbeResult {
  const spec = getOfficialBridgeSpec(profileKey);
  const resolved = resolveIonConnectBridge(spec.jsBridgeKey);
  const detected = resolved !== null;
  const detector = detected
    ? `window.${spec.jsBridgeKey}.${resolved!.field} (${spec.officialRepo})`
    : `window.${spec.jsBridgeKey}.ionconnect|${spec.jsBridgeKey}.tonconnect (${spec.officialRepo})`;

  return probe(profileKey, detected, detector, null, formatOfficialDetectorLabel(profileKey));
}

function detectRabby(): WalletProbeResult {
  const provider = typeof window !== "undefined" ? window.rabby ?? null : null;
  const ethereum = getWindowEthereum();
  const detected = Boolean(provider) || Boolean(ethereum?.isRabby);
  const resolved = provider ?? (ethereum?.isRabby ? ethereum : null);
  return probe(
    "rabby",
    detected,
    "window.rabby",
    resolved,
    detected ? "Rabby injector available" : "Rabby extension not detected",
  );
}

function detectMetaMask(rabbyDetected: boolean): WalletProbeResult {
  const ethereum = getWindowEthereum();
  const detected =
    Boolean(ethereum?.isMetaMask) &&
    !rabbyDetected &&
    !ethereum?.isRabby &&
    !ethereum?.isBraveWallet &&
    !ethereum?.isCoinbaseWallet;
  return probe(
    "metamask",
    detected,
    "window.ethereum.isMetaMask",
    detected ? ethereum ?? null : null,
    detected ? "MetaMask injector available" : "MetaMask extension not detected",
  );
}

function detectOkx(): WalletProbeResult {
  const provider = typeof window !== "undefined" ? window.okxwallet ?? null : null;
  return probe(
    "okx-web3",
    Boolean(provider),
    "window.okxwallet",
    provider,
    provider ? "OKX Web3 injector available" : "OKX wallet extension not detected",
  );
}

function detectBinance(): WalletProbeResult {
  const provider = typeof window !== "undefined" ? window.BinanceChain ?? null : null;
  return probe(
    "binance-web3",
    Boolean(provider),
    "window.BinanceChain",
    provider,
    provider ? "Binance Web3 injector available" : "Binance Web3 wallet not detected",
  );
}

function detectTrust(): WalletProbeResult {
  const provider = typeof window !== "undefined" ? window.trustwallet ?? null : null;
  return probe(
    "trust-wallet",
    Boolean(provider),
    "window.trustwallet",
    provider,
    provider ? "Trust Wallet injector available" : "Trust Wallet extension not detected",
  );
}

function detectCoinbase(): WalletProbeResult {
  const provider =
    typeof window !== "undefined" ? window.coinbaseWalletExtension ?? null : null;
  return probe(
    "coinbase-wallet",
    Boolean(provider),
    "window.coinbaseWalletExtension",
    provider,
    provider ? "Coinbase Wallet injector available" : "Coinbase Wallet extension not detected",
  );
}

function detectBitget(): WalletProbeResult {
  const provider =
    typeof window !== "undefined" ? (window.bitkeep?.ethereum ?? null) : null;
  return probe(
    "bitget-web3",
    Boolean(provider),
    "window.bitkeep.ethereum",
    provider,
    provider ? "Bitget Web3 injector available" : "Bitget wallet extension not detected",
  );
}

function detectWalletConnect(): WalletProbeResult {
  const available = isTonConnectSdkAvailable();
  return probe(
    "walletconnect",
    available,
    "@ion-gateway/sdk TonConnect bridge",
    null,
    available
      ? "TonConnect remote bridge ready — opens mobile / universal wallet link"
      : "TonConnect SDK unavailable during SSR",
  );
}

export function scanBrowserWallets(): WalletDetectionSnapshot {
  if (typeof window === "undefined") {
    const probes = WALLET_PROVIDER_KEYS.map((key) =>
      probe(key, false, "ssr", null, "Browser scan unavailable during SSR"),
    );
    return {
      scannedAt: new Date(0).toISOString(),
      probes,
      installedCount: 0,
    };
  }

  const rabby = detectRabby();
  const probes: WalletProbeResult[] = [
    detectOfficialNative("online"),
    detectOfficialNative("ion-browser"),
    detectWalletConnect(),
    detectMetaMask(rabby.detected),
    detectBinance(),
    detectOkx(),
    detectBitget(),
    detectTrust(),
    detectCoinbase(),
    rabby,
  ];

  return {
    scannedAt: new Date().toISOString(),
    probes,
    installedCount: probes.filter((item) => item.detected).length,
  };
}

export function getProbeForKey(
  snapshot: WalletDetectionSnapshot,
  key: WalletProviderKey,
): WalletProbeResult | undefined {
  return snapshot.probes.find((probeResult) => probeResult.key === key);
}

export function isEvmProviderKey(key: WalletProviderKey): boolean {
  return !["online", "ion-browser", "walletconnect"].includes(key);
}

export { isOfficialNativeBridgeInjected };
