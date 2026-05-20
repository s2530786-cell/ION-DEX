import type { TonProviderLike } from "./ionTypes";

export const ION_WALLET_CHROME_URL =
  "https://chromewebstore.google.com/detail/ion-wallet/hfajfpbjlmembfdlhakjmefnbhjddofb";

export function isIonExtensionInstalled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const ton = window.ton;
  if (!ton) {
    return false;
  }
  return !!(ton.isTonWallet || ton.isOpenMask || ton.isTonProvider);
}

export function waitForIonExtension(timeoutMs = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isIonExtensionInstalled()) {
      resolve(true);
      return;
    }

    let settled = false;
    const finish = (value: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      clearInterval(poll);
      window.removeEventListener("tonready", onReady);
      resolve(value);
    };

    const onReady = () => finish(true);
    window.addEventListener("tonready", onReady, { once: true });

    const poll = window.setInterval(() => {
      if (isIonExtensionInstalled()) {
        finish(true);
      }
    }, 200);

    window.setTimeout(() => finish(isIonExtensionInstalled()), timeoutMs);
  });
}

export function extractTonAddress(response: unknown): string | null {
  if (!response) {
    return null;
  }
  if (Array.isArray(response)) {
    const first = response[0];
    return typeof first === "string" ? first : null;
  }
  if (typeof response === "object" && response !== null && "result" in response) {
    const result = (response as { result: unknown }).result;
    if (Array.isArray(result)) {
      const first = result[0];
      return typeof first === "string" ? first : null;
    }
    return typeof result === "string" ? result : null;
  }
  return typeof response === "string" ? response : null;
}

export async function connectIonExtensionWallet(): Promise<string> {
  const installed = await waitForIonExtension();
  if (!installed || !window.ton) {
    window.open(ION_WALLET_CHROME_URL, "_blank", "noopener,noreferrer");
    throw new Error(
      "未检测到 ION 浏览器钱包扩展。请安装官方扩展后刷新页面（已打开 Chrome 商店页）。",
    );
  }

  let response: unknown;
  try {
    response = await window.ton.send("ton_requestAccounts");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`用户拒绝连接或扩展报错：${message}`);
  }

  const address = extractTonAddress(response);
  if (!address) {
    throw new Error("ION 扩展未返回地址，请在扩展中创建或解锁钱包。");
  }
  return address;
}

export async function readIonExtensionBalance(address: string): Promise<string> {
  const ton = window.ton;
  if (!ton) {
    throw new Error("ION extension not available");
  }
  const response = await ton.send("ton_getBalance", [address]);
  if (typeof response === "string" || typeof response === "number") {
    return String(response);
  }
  if (typeof response === "object" && response !== null && "result" in response) {
    return String((response as { result: unknown }).result);
  }
  throw new Error("Unexpected ton_getBalance response");
}

export function subscribeIonExtensionAccounts(
  onAddress: (address: string | null) => void,
  onDisconnect: () => void,
): (() => void) | null {
  const ton: TonProviderLike | undefined = window.ton;
  if (!ton?.on) {
    return null;
  }

  const onAccountsChanged = (accounts: unknown) => {
    if (Array.isArray(accounts) && typeof accounts[0] === "string") {
      onAddress(accounts[0]);
      return;
    }
    onAddress(null);
  };

  ton.on("accountsChanged", onAccountsChanged);
  ton.on("disconnect", onDisconnect);

  return () => {
    ton.off?.("accountsChanged", onAccountsChanged);
    ton.off?.("disconnect", onDisconnect);
    ton.removeListener?.("accountsChanged", onAccountsChanged);
    ton.removeListener?.("disconnect", onDisconnect);
  };
}
