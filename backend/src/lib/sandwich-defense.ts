/**
 * Off-chain mirror of the on-chain sandwich (slippage) defense enforced by
 * `IonSwapRouter.swapExactIn` and `SecurityMatrix.t.sol::test_Security_3c_SandwichMinOutput`.
 *
 * A swap MUST revert when the pool output (after an attacker front-run shifts price)
 * falls below the user-supplied `minOut` floor. This module models that invariant so
 * the W6 functional gate is runnable without Foundry.
 */

export type SwapQuote = {
  /** Tokens the user puts in. */
  amountIn: bigint;
  /** Pool output for `amountIn` at current reserves (post any front-run). */
  poolOutput: bigint;
  /** User slippage floor; swap reverts below this. */
  minOut: bigint;
};

export class SandwichDefenseError extends Error {
  constructor(
    readonly code: "ION_SWAP_SLIPPAGE" | "ION_SWAP_ZERO_AMOUNT" | "ION_SWAP_ZERO_MIN_OUT",
    detail: string,
  ) {
    super(`${code}: ${detail}`);
    this.name = "SandwichDefenseError";
  }
}

/**
 * Execute a swap under min-output protection. Returns the realized output when the
 * pool clears at or above `minOut`; throws `SandwichDefenseError` otherwise.
 */
export function executeProtectedSwap(quote: SwapQuote): bigint {
  if (quote.amountIn <= 0n) {
    throw new SandwichDefenseError("ION_SWAP_ZERO_AMOUNT", "amountIn must be positive");
  }
  if (quote.minOut <= 0n) {
    throw new SandwichDefenseError("ION_SWAP_ZERO_MIN_OUT", "minOut must be positive");
  }
  if (quote.poolOutput < quote.minOut) {
    throw new SandwichDefenseError(
      "ION_SWAP_SLIPPAGE",
      `pool output ${quote.poolOutput} below minOut ${quote.minOut}`,
    );
  }
  return quote.poolOutput;
}

/**
 * Constant-product output for `amountIn` against `(reserveIn, reserveOut)`.
 * `feeBps` is the swap fee in basis points (e.g. 30 = 0.3%).
 */
export function constantProductOutput(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps: bigint,
): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) {
    return 0n;
  }
  const amountInWithFee = amountIn * (10_000n - feeBps);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 10_000n + amountInWithFee;
  return numerator / denominator;
}

/**
 * Simulate an attacker front-run that buys `attackerIn` ahead of the victim, then
 * returns the victim's degraded pool output for `victimIn`. Used to prove the
 * defense rejects the sandwiched trade when it drops below the victim's floor.
 */
export function simulateFrontRunThenVictim(
  reserveIn: bigint,
  reserveOut: bigint,
  attackerIn: bigint,
  victimIn: bigint,
  feeBps: bigint,
): bigint {
  const attackerOut = constantProductOutput(attackerIn, reserveIn, reserveOut, feeBps);
  // Pool reserves shift after the attacker's buy.
  const postReserveIn = reserveIn + attackerIn;
  const postReserveOut = reserveOut - attackerOut;
  return constantProductOutput(victimIn, postReserveIn, postReserveOut, feeBps);
}
