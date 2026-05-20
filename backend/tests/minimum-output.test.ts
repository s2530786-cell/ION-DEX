import assert from "node:assert/strict";
import test from "node:test";
import {
  assertMinimumOutput,
  computeMinimumOutputUnits,
  PROTOCOL_FEE_BPS,
} from "../src/lib/minimum-output.js";

test("computeMinimumOutputUnits matches quote service golden values", () => {
  const grossOutputUnits = 106677740863n;
  const { estimatedOutputUnits, minimumOutputUnits, protocolFeeUnits } =
    computeMinimumOutputUnits(grossOutputUnits, 100, PROTOCOL_FEE_BPS);

  assert.equal(protocolFeeUnits, 266694352n);
  assert.equal(estimatedOutputUnits, 106411046511n);
  assert.equal(minimumOutputUnits, 105346936045n);
});

test("assertMinimumOutput rejects underfilled swaps", () => {
  assert.throws(() => assertMinimumOutput(99n, 100n), /ION_DEX_MIN_OUTPUT/);
  assert.doesNotThrow(() => assertMinimumOutput(100n, 100n));
});
