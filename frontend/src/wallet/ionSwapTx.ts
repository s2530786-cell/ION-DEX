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

/**
 * Encode a text comment into a TON cell BoC (base64).
 * Lightweight implementation — no @ton/core dependency needed.
 * Cell structure: storeUint(0, 32) + storeStringTail(comment).
 */
export function encodeTextCommentPayload(comment: string): string {
  const encoder = new TextEncoder();
  const tail = encoder.encode(comment);
  // Cell: 2 descriptor bytes + 32 bits (4 bytes) of zero uint + tail bytes
  const bitsLen = 32 + tail.length * 8;
  const cellData = new Uint8Array(2 + Math.ceil(bitsLen / 8));
  // d1: refs=0, level=0, hashes=0, is_exotic=0
  // d2: ceil(bits/8) + tail.length*8 bytes
  cellData[0] = Math.ceil(bitsLen / 8);
  cellData[1] = 0; // no refs, d2 zero
  // Zero uint (32 bits = 4 bytes)
  // tail bytes after
  cellData.set(tail, 2 + 4);
  // Build minimal BoC header + cell
  const magic = 0xb5ee9c72;
  const boc = new Uint8Array(4 + 1 + 1 + 2 + 1 + cellData.length + 4);
  const view = new DataView(boc.buffer);
  let off = 0;
  view.setUint32(off, magic, false); off += 4;           // magic
  boc[off++] = 0; boc[off++] = 0;                         // flags
  view.setUint16(off, 1, false); off += 2;                // cell count = 1
  boc[off++] = 1;                                          // root count = 1
  boc[off++] = 0;                                          // absent = 0
  view.setUint16(off, cellData.length, false); off += 2;   // cell size
  boc.set(cellData, off); off += cellData.length;
  view.setUint32(off, 0, false);                          // no crc32
  return btoa(String.fromCharCode(...boc));
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
