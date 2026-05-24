import assert from "node:assert/strict";
import test from "node:test";
import {
  IonBridgeSimulator,
  simulateBscToIonRound,
  type BscLockPayload,
} from "../src/lib/bridge-ion-e2e.js";

const ROUNDS = 100;
const RELAYER = "0x00000000000000000000000000000000000010ad";
const USER = "0x00000000000000000000000000000000000075e7";
const TOKEN = "0xe1ab61f7b093435204df32f5b3a405de55445ea8";

test("P0-1c: BSC lock → ION credit orchestration (100 rounds)", () => {
  const simulator = new IonBridgeSimulator();
  simulator.addRelayer(RELAYER);

  for (let i = 0; i < ROUNDS; i++) {
    const amount = 1_000_000_000_000_000_000n + BigInt(i) * 10_000_000_000_000_000n;
    const ionRecipient = `0x${(0x1_0000n + BigInt(i)).toString(16).padStart(64, "0")}`;
    const payload: BscLockPayload = {
      user: USER,
      token: TOKEN,
      amount,
      ionRecipient,
    };
    const credit = simulateBscToIonRound(simulator, RELAYER, payload, BigInt(i));
    assert.equal(simulator.getIonBalance(ionRecipient), amount);
    assert.ok(simulator.isConsumed(credit.messageId));
  }
});

test("P0-1c: duplicate message id rejected", () => {
  const simulator = new IonBridgeSimulator();
  simulator.addRelayer(RELAYER);
  const payload: BscLockPayload = {
    user: USER,
    token: TOKEN,
    amount: 1n,
    ionRecipient: `0x${"01".repeat(32)}`,
  };
  simulateBscToIonRound(simulator, RELAYER, payload, 0n);
  assert.throws(
    () => simulateBscToIonRound(simulator, RELAYER, payload, 0n),
    /ION_BRIDGE_DUPLICATE_MESSAGE/,
  );
});

test("P0-1c: unauthorized relayer rejected", () => {
  const simulator = new IonBridgeSimulator();
  const payload: BscLockPayload = {
    user: USER,
    token: TOKEN,
    amount: 1n,
    ionRecipient: `0x${"02".repeat(32)}`,
  };
  assert.throws(
    () => simulateBscToIonRound(simulator, "0x000000000000000000000000000000000000bad1", payload, 0n),
    /ION_BRIDGE_UNAUTHORIZED_RELAYER/,
  );
});
