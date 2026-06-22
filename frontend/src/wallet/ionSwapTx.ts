import { beginCell } from "@ton/core";

/** Minimum self-transfer (nanoION) to attach an on-chain swap intent comment. */
export const SWAP_INTENT_AMOUNT_NANO = "1000000";

export type IonSwapIntent = {
  fromToken: string;
  toToken: string;
  payAmount: string;
  slippagePct: string;
  receiveEstimate: string;
};

export function buildSwapIntentComment(intent: IonSwapIntent): string {
  return [
    "ION_DEX_SWAP:v1",
    `from=${intent.fromToken}`,
    `to=${intent.toToken}`,
    `pay=${intent.payAmount}`,
    `slip=${intent.slippagePct}`,
    `recv=${intent.receiveEstimate}`,
  ].join("|");
}

export function encodeTextCommentPayload(comment: string): string {
  return beginCell().storeUint(0, 32).storeStringTail(comment).endCell().toBoc().toString("base64");
}

export type IonSendTransactionParams = {
  fromAddress: string;
  amountNano: string;
  comment: string;
  /** Defaults to self-transfer (intent signature without routing to router yet). */
  toAddress?: string;
};

export function buildIonSendTransactionParams(input: IonSendTransactionParams): {
  to: string;
  value: string;
  data: string;
  payload: string;
} {
  const to = input.toAddress?.trim() || input.fromAddress;
  const comment = input.comment;
  return {
    to,
    value: input.amountNano,
    data: comment,
    payload: encodeTextCommentPayload(comment),
  };
}
