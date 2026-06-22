const ONLINE_CONNECT_BASE = "https://wallet.ice.io/dapp/connect";

function isValidIonAddress(addr: string): boolean {
  const trimmed = addr.trim();
  return trimmed.length >= 10 && trimmed.length <= 70 && /^[A-Za-z0-9\-_]+$/.test(trimmed);
}

function listenForWalletMessage(timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Online+ 连接超时，请重试。"));
    }, timeoutMs);

    const handler = (event: MessageEvent) => {
      const data = event.data as { type?: string; address?: string } | null;
      if (!data || data.type !== "ion_connect") {
        return;
      }
      const address = data.address?.trim() ?? "";
      if (isValidIonAddress(address)) {
        cleanup();
        resolve(address);
      }
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", handler);
    };

    window.addEventListener("message", handler);
  });
}

function pollAddressFromUrl(timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const params = new URL(window.location.href).searchParams;
      const walletParam = params.get("wallet");
      if (walletParam && walletParam !== "connect" && isValidIonAddress(walletParam)) {
        window.clearInterval(timer);
        const url = new URL(window.location.href);
        url.searchParams.delete("wallet");
        window.history.replaceState({}, "", url);
        resolve(walletParam.trim());
        return;
      }
      if (attempts > 120) {
        window.clearInterval(timer);
        reject(new Error("Online+ 连接超时，请重试。"));
      }
    }, 500);
  });
}

/** Official Online+ / wallet.ice.io flow (ion-dex-frontend wallet-connect.js). */
export async function connectIonOnlineWallet(): Promise<string> {
  const returnUrl = `${window.location.origin}${window.location.pathname}?wallet=connect`;
  const connectUrl = `${ONLINE_CONNECT_BASE}?return=${encodeURIComponent(returnUrl)}`;

  const popup = window.open(connectUrl, "ion-wallet-popup", "width=480,height=700");

  if (!popup || popup.closed) {
    const proceed = window.confirm(
      "弹窗被拦截。是否在当前页打开 wallet.ice.io 完成 Online+ 连接？",
    );
    if (!proceed) {
      throw new Error("已取消 Online+ 连接。");
    }
    window.location.assign(connectUrl);
    return pollAddressFromUrl(60_000);
  }

  try {
    const address = await Promise.race([
      listenForWalletMessage(60_000),
      pollAddressFromUrl(60_000),
    ]);
    if (!popup.closed) {
      popup.close();
    }
    return address;
  } catch (error) {
    if (!popup.closed) {
      popup.close();
    }
    throw error;
  }
}

/** Resume address when user returns from wallet.ice.io redirect (?wallet=EQ...). */
export function readIonOnlineAddressFromUrl(): string | null {
  const walletParam = new URL(window.location.href).searchParams.get("wallet");
  if (!walletParam || walletParam === "connect") {
    return null;
  }
  if (!isValidIonAddress(walletParam)) {
    return null;
  }
  const address = walletParam.trim();
  const url = new URL(window.location.href);
  url.searchParams.delete("wallet");
  window.history.replaceState({}, "", url);
  return address;
}
