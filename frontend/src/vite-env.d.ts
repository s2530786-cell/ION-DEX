/// <reference types="vite/client" />

type IonEip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isBraveWallet?: boolean;
  isCoinbaseWallet?: boolean;
};

type IonConnectBridgeApi = {
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
  ) => Promise<unknown>;
  restoreConnection: () => Promise<unknown>;
};

/** ice-blockchain/ion-chrome-wallet — provider.ts */
type IonLegacyProvider = IonEip1193Provider & {
  isOpenMask?: boolean;
};

/** ice-blockchain/ion-browser-wallet — extension/provider.js */
type TonLegacyProvider = IonEip1193Provider;

interface Window {
  ethereum?: IonEip1193Provider;
  rabby?: IonEip1193Provider;
  okxwallet?: IonEip1193Provider;
  BinanceChain?: IonEip1193Provider;
  trustwallet?: IonEip1193Provider;
  coinbaseWalletExtension?: IonEip1193Provider;
  bitkeep?: {
    ethereum?: IonEip1193Provider;
  };
  /** Online+ / ION Chrome Wallet (ion-chrome-wallet) */
  ion?: IonLegacyProvider;
  ionProtocolVersion?: number;
  ionmask?: {
    provider: IonLegacyProvider;
    ionconnect: IonConnectBridgeApi;
  };
  /** ION Browser Wallet (ion-browser-wallet) */
  ton?: TonLegacyProvider;
  tonProtocolVersion?: number;
  tonwallet?: {
    provider: TonLegacyProvider;
    tonconnect: IonConnectBridgeApi;
    ionconnect?: IonConnectBridgeApi;
  };
}
