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

function detectOnlinePlus(): WalletProbeResult {
  const ionGlobal =
    typeof window !== "undefined"
      ? window.ionWallet ?? window.iceWallet ?? null
      : null;
  return probe(
    "online",
    Boolean(ionGlobal),
    "window.ionWallet|window.iceWallet",
    ionGlobal,
    ionGlobal
      ? "ION wallet global detected"
      : "Online+ requires official ION injection; profile session available without injector",
  );
}

function detectIonBrowser(): WalletProbeResult {
  const browserWallet = typeof window !== "undefined" ? (window.ionBrowserWallet ?? null) : null;
  return probe(
    "ion-browser",
    Boolean(browserWallet),
    "window.ionBrowserWallet",
    browserWallet,
    browserWallet ? "ION Browser Wallet detected" : "ION Browser Wallet adapter planned",
  );
}

function detectWalletConnect(): WalletProbeResult {
  return probe(
    "walletconnect",
    false,
    "walletconnect.v2",
    null,
    "WalletConnect pairing uses QR flow; install a mobile wallet or enable WC SDK next",
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
    detectOnlinePlus(),
    detectIonBrowser(),
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
