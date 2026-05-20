let openModalImpl: (() => void) | null = null;

export function registerIonConnectModalOpener(open: () => void): () => void {
  openModalImpl = open;
  return () => {
    if (openModalImpl === open) {
      openModalImpl = null;
    }
  };
}

export function openIonConnectWalletModal(): boolean {
  if (!openModalImpl) {
    return false;
  }
  openModalImpl();
  return true;
}
