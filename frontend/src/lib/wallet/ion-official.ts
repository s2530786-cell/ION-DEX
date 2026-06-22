/**
 * Official ION wallet injection keys — sourced from ice-blockchain repos (not guessed globals).
 *
 * - Online+ / ION Chrome extension: ice-blockchain/ion-chrome-wallet → window.ionmask.ionconnect
 * - ION Browser Wallet extension: ice-blockchain/ion-browser-wallet → window.tonwallet.tonconnect (legacy field name)
 * - Detection contract: ice-blockchain/ion-gateway InjectedProvider (window[key].ionconnect + walletInfo)
 */

export type IonOfficialNativeWalletKey = "online" | "ion-browser";

export type IonOfficialBridgeSpec = {
  profileKey: IonOfficialNativeWalletKey;
  productName: string;
  jsBridgeKey: string;
  officialRepo: string;
  /** Legacy JSON-RPC provider global (window.ion / window.ton) */
  legacyProviderGlobal: "ion" | "ton";
  /** ion-gateway standard bridge field */
  connectField: "ionconnect";
  /** ion-browser-wallet still exposes tonconnect on window.tonwallet */
  legacyConnectField: "tonconnect";
  readyEvent: "ionready" | "tonready";
  ionGatewayAppName: string;
};

export const ION_OFFICIAL_NATIVE_BRIDGES: Record<IonOfficialNativeWalletKey, IonOfficialBridgeSpec> = {
  online: {
    profileKey: "online",
    productName: "Online+ Wallet",
    jsBridgeKey: "ionmask",
    officialRepo: "ice-blockchain/ion-chrome-wallet",
    legacyProviderGlobal: "ion",
    connectField: "ionconnect",
    legacyConnectField: "tonconnect",
    readyEvent: "ionready",
    ionGatewayAppName: "ionmask",
  },
  "ion-browser": {
    profileKey: "ion-browser",
    productName: "ION Browser Wallet",
    jsBridgeKey: "tonwallet",
    officialRepo: "ice-blockchain/ion-browser-wallet",
    legacyProviderGlobal: "ton",
    connectField: "ionconnect",
    legacyConnectField: "tonconnect",
    readyEvent: "tonready",
    ionGatewayAppName: "tonwallet",
  },
};

export function getOfficialBridgeSpec(
  profileKey: IonOfficialNativeWalletKey,
): IonOfficialBridgeSpec {
  return ION_OFFICIAL_NATIVE_BRIDGES[profileKey];
}
