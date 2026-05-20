export { connectWalletProvider, type LiveWalletConnection } from "./connect.js";
export {
  getProbeForKey,
  isEvmProviderKey,
  isOfficialNativeBridgeInjected,
  scanBrowserWallets,
} from "./detectors.js";
export { connectOfficialNativeWallet, resolveIonConnectBridge } from "./ion-bridge.js";
export { getOfficialBridgeSpec, ION_OFFICIAL_NATIVE_BRIDGES } from "./ion-official.js";
export { chainIdToNetworkLabel, formatAddressPreview } from "./network.js";
export {
  WALLET_PROVIDER_KEYS,
  type WalletConnectResult,
  type WalletDetectionSnapshot,
  type WalletProbeResult,
  type WalletProviderKey,
} from "./types.js";
