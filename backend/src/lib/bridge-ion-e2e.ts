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

/** ION → BSC release message awaiting a relayer quorum (dual-sign). */
export type BridgeReleaseMessage = {
  /** Unique release nonce (idempotency key). */
  nonce: string;
  token: string;
  user: string;
  amount: bigint;
};

export type BridgeReleaseResult = {
  nonce: string;
  released: boolean;
  signatures: number;
};

/**
 * BSC-side dual-sign release relay (off-chain mirror of `BridgeRelay.attestInbound`).
 * A release only executes after `quorum` DISTINCT authorized relayers attest the same
 * nonce-bound message; below quorum it stays pending, and a consumed nonce can never be replayed.
 */
export class BridgeQuorumRelay {
  private readonly relayers = new Set<string>();
  private readonly quorum: number;
  private readonly attestations = new Map<string, Set<string>>();
  private readonly attestedMessages = new Map<string, string>();
  private readonly consumed = new Set<string>();
  private readonly released = new Map<string, bigint>();

  constructor(quorum: number) {
    if (!Number.isInteger(quorum) || quorum < 1) {
      throw new Error("ION_BRIDGE_INVALID_QUORUM");
    }
    this.quorum = quorum;
  }

  addRelayer(address: string): void {
    this.relayers.add(address.toLowerCase());
  }

  relayerCount(): number {
    return this.relayers.size;
  }

  isReleased(nonce: string): boolean {
    return this.consumed.has(nonce.toLowerCase());
  }

  signatureCount(nonce: string): number {
    return this.attestations.get(nonce.toLowerCase())?.size ?? 0;
  }

  releasedAmount(nonce: string): bigint {
    return this.released.get(nonce.toLowerCase()) ?? 0n;
  }

  private messageFingerprint(message: BridgeReleaseMessage): string {
    return [
      message.nonce.toLowerCase(),
      message.token.toLowerCase(),
      message.user.toLowerCase(),
      message.amount.toString(),
    ].join("|");
  }

  /**
   * Record one relayer attestation. Returns the release result; `released` is true
   * only on the call that reaches quorum.
   */
  attest(relayer: string, message: BridgeReleaseMessage): BridgeReleaseResult {
    const signer = relayer.toLowerCase();
    if (!this.relayers.has(signer)) {
      throw new Error("ION_BRIDGE_UNAUTHORIZED_RELAYER");
    }
    if (message.token === "" || message.user === "") {
      throw new Error("ION_BRIDGE_ZERO_ADDRESS");
    }
    if (message.amount <= 0n) {
      throw new Error("ION_BRIDGE_ZERO_AMOUNT");
    }
    const nonce = message.nonce.toLowerCase();
    if (nonce === "" || nonce === "0x") {
      throw new Error("ION_BRIDGE_ZERO_NONCE");
    }
    if (this.consumed.has(nonce)) {
      throw new Error("ION_BRIDGE_DUPLICATE_NONCE");
    }

    const fingerprint = this.messageFingerprint(message);
    const attestedMessage = this.attestedMessages.get(nonce);
    if (attestedMessage && attestedMessage !== fingerprint) {
      throw new Error("ION_BRIDGE_MESSAGE_MISMATCH");
    }

    let signers = this.attestations.get(nonce);
    if (!signers) {
      signers = new Set<string>();
      this.attestations.set(nonce, signers);
      this.attestedMessages.set(nonce, fingerprint);
    }
    if (signers.has(signer)) {
      throw new Error("ION_BRIDGE_DOUBLE_VOTE");
    }
    signers.add(signer);

    if (signers.size >= this.quorum) {
      this.consumed.add(nonce);
      this.released.set(nonce, message.amount);
      this.attestations.delete(nonce);
      this.attestedMessages.delete(nonce);
      return { nonce: message.nonce, released: true, signatures: this.quorum };
    }
    return { nonce: message.nonce, released: false, signatures: signers.size };
  }
}
