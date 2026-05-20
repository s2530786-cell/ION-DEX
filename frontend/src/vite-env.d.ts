/// <reference types="vite/client" />

type IonEip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isBraveWallet?: boolean;
  isCoinbaseWallet?: boolean;
};

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
  ionWallet?: IonEip1193Provider;
  iceWallet?: IonEip1193Provider;
  ionBrowserWallet?: IonEip1193Provider;
}
