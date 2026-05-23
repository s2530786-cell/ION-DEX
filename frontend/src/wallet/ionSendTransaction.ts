import type { IonWalletKind } from "./ionTypes";
import { buildIonSendTransactionParams, type IonSendTransactionParams } from "./ionSwapTx";
import { sendTonConnectSdkTransaction } from "./ionTonConnectSdk";

export type IonTransactionResult = {
  kind: "extension" | "tonconnect-sdk";
  /** Extension boolean result or TonConnect BOC id. */
  proof: string;
};

export async function sendIonWalletTransaction(
  walletKind: IonWalletKind,
  params: IonSendTransactionParams,
): Promise<IonTransactionResult> {
  const built = buildIonSendTransactionParams(params);

  if (walletKind === "walletconnect") {
    const boc = await sendTonConnectSdkTransaction({
      to: built.to,
      amountNano: built.value,
      payloadBase64: built.payload,
    });
    return { kind: "tonconnect-sdk", proof: boc };
  }

  if (!window.ton?.send) {
    throw new Error("未检测到 ION 钱包扩展。请安装扩展或使用 TonConnect (QR)。");
  }

  let response: unknown;
  try {
    response = await window.ton.send("ton_sendTransaction", [
      {
        to: built.to,
        value: built.value,
        data: built.data,
      },
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`钱包拒绝或交易失败：${message}`);
  }

  const accepted = response === true || response === "true";
  if (!accepted && response !== false) {
    const serialized = typeof response === "string" ? response : JSON.stringify(response);
    return { kind: "extension", proof: serialized };
  }
  if (response === false) {
    throw new Error("用户取消了链上交易签名。");
  }
  return { kind: "extension", proof: "accepted" };
}
