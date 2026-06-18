import assert from "node:assert/strict";
import test from "node:test";
import { BridgeQuorumRelay, type BridgeReleaseMessage } from "../src/lib/bridge-ion-e2e.js";
import {
  executeProtectedSwap,
  SandwichDefenseError,
  constantProductOutput,
  simulateFrontRunThenVictim,
  type SwapQuote,
} from "../src/lib/sandwich-defense.js";

const ROUNDS = 100;
const RELAYER_A = "0x00000000000000000000000000000000000010a1";
const RELAYER_B = "0x00000000000000000000000000000000000010b2";
const RELAYER_C = "0x00000000000000000000000000000000000010c3";
const ATTACKER = "0x000000000000000000000000000000000000bad1";
const OTHER_USER = "0x0000000000000000000000000000000000007777";
const USER = "0x00000000000000000000000000000000000075e7";
const TOKEN = "0xe1ab61f7b093435204df32f5b3a405de55445ea8";

function releaseMessage(round: number): BridgeReleaseMessage {
  return {
    nonce: `0x${(0x2_0000 + round).toString(16).padStart(64, "0")}`,
    token: TOKEN,
    user: USER,
    amount: 2_000_000_000_000_000_000n + BigInt(round) * 10_000_000_000_000_000n,
  };
}

test("W6 bridge dual-sign: single attestation stays pending, second releases (100 rounds)", () => {
  const relay = new BridgeQuorumRelay(2);
  relay.addRelayer(RELAYER_A);
  relay.addRelayer(RELAYER_B);

  for (let i = 0; i < ROUNDS; i++) {
    const message = releaseMessage(i);

    const first = relay.attest(RELAYER_A, message);
    assert.equal(first.released, false, "first signature must not release");
    assert.equal(first.signatures, 1);
    assert.equal(relay.isReleased(message.nonce), false);

    const second = relay.attest(RELAYER_B, message);
    assert.equal(second.released, true, "quorum reached on second distinct signer");
    assert.equal(second.signatures, 2);
    assert.equal(relay.isReleased(message.nonce), true);
    assert.equal(relay.releasedAmount(message.nonce), message.amount);
  }
});

test("W6 bridge dual-sign: same relayer cannot satisfy quorum alone", () => {
  const relay = new BridgeQuorumRelay(2);
  relay.addRelayer(RELAYER_A);
  const message = releaseMessage(0);

  relay.attest(RELAYER_A, message);
  assert.throws(() => relay.attest(RELAYER_A, message), /ION_BRIDGE_DOUBLE_VOTE/);
  assert.equal(relay.isReleased(message.nonce), false);
});

test("W6 bridge dual-sign: unauthorized relayer rejected", () => {
  const relay = new BridgeQuorumRelay(2);
  relay.addRelayer(RELAYER_A);
  assert.throws(
    () => relay.attest(ATTACKER, releaseMessage(1)),
    /ION_BRIDGE_UNAUTHORIZED_RELAYER/,
  );
});

test("W6 bridge dual-sign: released nonce cannot be replayed", () => {
  const relay = new BridgeQuorumRelay(2);
  relay.addRelayer(RELAYER_A);
  relay.addRelayer(RELAYER_B);
  const message = releaseMessage(2);

  relay.attest(RELAYER_A, message);
  relay.attest(RELAYER_B, message);
  assert.equal(relay.isReleased(message.nonce), true);

  assert.throws(() => relay.attest(RELAYER_A, message), /ION_BRIDGE_DUPLICATE_NONCE/);
});

test("W6 bridge dual-sign: higher quorum needs three distinct signers", () => {
  const relay = new BridgeQuorumRelay(3);
  relay.addRelayer(RELAYER_A);
  relay.addRelayer(RELAYER_B);
  relay.addRelayer(RELAYER_C);
  const message = releaseMessage(3);

  assert.equal(relay.attest(RELAYER_A, message).released, false);
  assert.equal(relay.attest(RELAYER_B, message).released, false);
  assert.equal(relay.attest(RELAYER_C, message).released, true);
  assert.equal(relay.releasedAmount(message.nonce), message.amount);
});

test("W6 bridge dual-sign: same nonce cannot bind conflicting release payloads", () => {
  const relay = new BridgeQuorumRelay(2);
  relay.addRelayer(RELAYER_A);
  relay.addRelayer(RELAYER_B);
  const message = releaseMessage(4);

  relay.attest(RELAYER_A, message);
  assert.throws(
    () => relay.attest(RELAYER_B, { ...message, user: OTHER_USER }),
    /ION_BRIDGE_MESSAGE_MISMATCH/,
  );
  assert.equal(relay.isReleased(message.nonce), false);
});

test("W6 bridge dual-sign: zero amount and zero nonce rejected", () => {
  const relay = new BridgeQuorumRelay(2);
  relay.addRelayer(RELAYER_A);
  assert.throws(
    () => relay.attest(RELAYER_A, { nonce: `0x${"03".repeat(32)}`, token: TOKEN, user: USER, amount: 0n }),
    /ION_BRIDGE_ZERO_AMOUNT/,
  );
  assert.throws(
    () => relay.attest(RELAYER_A, { nonce: "0x", token: TOKEN, user: USER, amount: 1n }),
    /ION_BRIDGE_ZERO_NONCE/,
  );
});

test("W6 sandwich defense: degraded output below minOut reverts (100 rounds)", () => {
  for (let i = 0; i < ROUNDS; i++) {
    const quote: SwapQuote = {
      amountIn: 1_000_000_000_000_000_000n,
      poolOutput: 80n + BigInt(i),
      minOut: 100n + BigInt(i),
    };
    assert.throws(
      () => executeProtectedSwap(quote),
      (err: unknown) => {
        assert.ok(err instanceof SandwichDefenseError);
        assert.equal(err.code, "ION_SWAP_SLIPPAGE");
        return true;
      },
    );
  }
});

test("W6 sandwich defense: output at or above minOut clears (100 rounds)", () => {
  for (let i = 0; i < ROUNDS; i++) {
    const minOut = 40_000n + BigInt(i) * 400n;
    const quote: SwapQuote = {
      amountIn: 100_000n + BigInt(i) * 1000n,
      poolOutput: 50_000n + BigInt(i) * 500n,
      minOut,
    };
    const out = executeProtectedSwap(quote);
    assert.ok(out >= minOut);
  }
});

test("W6 sandwich defense: front-run shifts price and triggers victim slippage revert", () => {
  const reserveIn = 1_000_000n * 10n ** 18n;
  const reserveOut = 1_000_000n * 10n ** 18n;
  const feeBps = 30n;
  const victimIn = 10_000n * 10n ** 18n;

  const fairOut = constantProductOutput(victimIn, reserveIn, reserveOut, feeBps);
  const minOut = (fairOut * 995n) / 1000n;

  const sandwichedOut = simulateFrontRunThenVictim(
    reserveIn,
    reserveOut,
    50_000n * 10n ** 18n,
    victimIn,
    feeBps,
  );

  assert.ok(sandwichedOut < minOut, "attacker front-run must degrade victim output below floor");
  assert.throws(
    () => executeProtectedSwap({ amountIn: victimIn, poolOutput: sandwichedOut, minOut }),
    /ION_SWAP_SLIPPAGE/,
  );
});

test("W6 sandwich defense: zero amount and zero minOut guarded", () => {
  assert.throws(
    () => executeProtectedSwap({ amountIn: 0n, poolOutput: 1n, minOut: 1n }),
    /ION_SWAP_ZERO_AMOUNT/,
  );
  assert.throws(
    () => executeProtectedSwap({ amountIn: 1n, poolOutput: 1n, minOut: 0n }),
    /ION_SWAP_ZERO_MIN_OUT/,
  );
});
