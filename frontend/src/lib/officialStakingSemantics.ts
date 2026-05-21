/**
 * Official ION network staking semantics (product + ice-blockchain references).
 *
 * Retail liquid staking (stake ION → receive LION):
 * - https://github.com/ice-blockchain/liquid-staking-contract
 *   Pool + Controller + pool jetton; `pool::deposit` forwards stake to elector via controller.
 * - Public product copy: https://ice.io/staking — rewards compound into LION; unstake releases at next
 *   validation round (~20 hours, not a fixed 7-day DEX lock).
 *
 * Validator election (not the DEX Stake desk form):
 * - `ice-blockchain/ion` → `crypto/smartcont/elector-code.fc` (system elector).
 *
 * Large nominator pools (TON-style, not retail):
 * - https://github.com/ice-blockchain/nominator-pool
 *
 * ION DEX draft only (do NOT label as official user staking):
 * - `contracts/ion/staking-pool.fc` — `stake_deposit` / `stake_withdraw` / `stake_claim` for fee-reward pool UX.
 * - BSC `FeeReceiver` routes a share of fees to `stakingRewards` (separate from LION liquid staking).
 */

export const OFFICIAL_STAKING_REPOS = {
  liquidStaking: "https://github.com/ice-blockchain/liquid-staking-contract",
  ionNode: "https://github.com/ice-blockchain/ion",
  nominatorPool: "https://github.com/ice-blockchain/nominator-pool",
  stakingProduct: "https://ice.io/staking",
  ionChromeWallet: "https://github.com/ice-blockchain/ion-chrome-wallet",
} as const;

/** Pool jetton brand for official liquid staking (Liquid ION). */
export const OFFICIAL_LIQUID_STAKE_RECEIPT = "LION";

/** Product-documented unstake delay: next validation round (~20h). */
export const OFFICIAL_UNSTAKE_ROUND_HOURS_APPROX = 20;

/** Minimum stake per ice.io public docs (1 ION). */
export const OFFICIAL_MIN_STAKE_ION = 1;

/**
 * Opcodes from ice-blockchain/liquid-staking-contract `PoolConstants.ts` (main).
 * Use for indexer/wallet integration — not for inventing new stake flows in the DEX UI.
 */
export const OFFICIAL_LIQUID_STAKING_OPCODES = {
  poolDeposit: "0x47d54391",
  poolWithdraw: "0x319B0CDC",
  poolWithdrawal: "0x0a77535c",
  electorNewStake: "0x4e73744b",
  electorRecoverStake: "0x47657424",
  controllerRecoverStake: "0xeb373a05",
} as const;

/** User-facing steps for official liquid staking (ION Wallet / staking.ice.io style). */
export const OFFICIAL_LIQUID_STAKE_STEPS = [
  "Connect ION Chrome Wallet on desktop (official staking UI).",
  "Send a Pool deposit — stake ION; receive LION (liquid receipt jetton) in the same round flow.",
  "Rewards accrue each validation round (~20h) and compound into your staked balance / LION.",
  "Unstake: request withdrawal; ION is released after the next validation round (not instant).",
] as const;

/** DEX draft staking — clearly separated from official LION staking. */
export const DEX_DRAFT_STAKE_NOTE =
  "ION DEX `staking-pool.fc` and hub forms are draft fee-reward staking — not the official LION liquid-staking pool.";

export function formatStakingAprLabel(pct: number | null | undefined, emptyLabel: string) {
  if (pct === null || pct === undefined) {
    return emptyLabel;
  }
  return `${pct}%`;
}
