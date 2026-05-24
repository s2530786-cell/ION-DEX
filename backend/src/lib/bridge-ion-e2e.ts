import { createHash } from "node:crypto";

/** BSC `Locked` event payload (orchestration layer). */
export type BscLockPayload = {
  user: string;
  token: string;
  amount: bigint;
  /** 0x-prefixed 32-byte hex (bytes32 ionRecipient). */
  ionRecipient: string;
};

export type IonBridgeCredit = {
  messageId: string;
  ionRecipient: string;
  amount: bigint;
  bscUser: string;
  token: string;
};

const MESSAGE_PREFIX = "ion-bridge-lock";

/**
 * Deterministic message id aligned with `BridgeIonE2E.t.sol` (`keccak256(abi.encodePacked(...))`).
 * TS uses SHA-256 over packed fields for orchestration tests without an on-chain keccak dependency.
 */
export function deriveMessageId(payload: BscLockPayload, lockIndex: bigint): string {
  const packed = [
    MESSAGE_PREFIX,
    payload.user.toLowerCase(),
    payload.token.toLowerCase(),
    payload.amount.toString(),
    payload.ionRecipient.toLowerCase(),
    lockIndex.toString(),
  ].join("|");
  return `0x${createHash("sha256").update(packed).digest("hex")}`;
}

export class IonBridgeSimulator {
  private readonly consumed = new Set<string>();
  private readonly balances = new Map<string, bigint>();
  private readonly relayers = new Set<string>();

  addRelayer(address: string): void {
    this.relayers.add(address.toLowerCase());
  }

  creditFromBscLock(relayer: string, credit: IonBridgeCredit): void {
    if (!this.relayers.has(relayer.toLowerCase())) {
      throw new Error("ION_BRIDGE_UNAUTHORIZED_RELAYER");
    }
    const id = credit.messageId.toLowerCase();
    if (this.consumed.has(id)) {
      throw new Error("ION_BRIDGE_DUPLICATE_MESSAGE");
    }
    if (credit.amount <= 0n) {
      throw new Error("ION_BRIDGE_ZERO_AMOUNT");
    }
    this.consumed.add(id);
    const recipient = credit.ionRecipient.toLowerCase();
    this.balances.set(recipient, (this.balances.get(recipient) ?? 0n) + credit.amount);
  }

  getIonBalance(ionRecipient: string): bigint {
    return this.balances.get(ionRecipient.toLowerCase()) ?? 0n;
  }

  isConsumed(messageId: string): boolean {
    return this.consumed.has(messageId.toLowerCase());
  }
}

/** One BSC lock → ION credit round for off-chain orchestration tests. */
export function simulateBscToIonRound(
  simulator: IonBridgeSimulator,
  relayer: string,
  payload: BscLockPayload,
  lockIndex: bigint,
): IonBridgeCredit {
  const messageId = deriveMessageId(payload, lockIndex);
  const credit: IonBridgeCredit = {
    messageId,
    ionRecipient: payload.ionRecipient,
    amount: payload.amount,
    bscUser: payload.user,
    token: payload.token,
  };
  simulator.creditFromBscLock(relayer, credit);
  return credit;
}
