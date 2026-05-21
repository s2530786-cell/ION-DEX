/**
 * Staking summary for gateway. Official LION liquid staking totals require
 * liquid-staking-contract pool/indexer — see docs/ion-official-staking-reference.md.
 */

export type StakingSummary = {
  totalStakedIon: string;
  officialStakedIon: string;
  dexStakedIon: string;
  lpStakedUsd: string;
  apr: {
    /** Official network liquid staking — dynamic until live adapter. */
    officialPct: number | null;
    /** DEX draft fee-reward pool — not LION staking. */
    dexPct: number | null;
    lpMiningPct: number;
  };
  /** Official liquid receipt jetton (LION). DEX draft rewards remain ION. */
  rewardAsset: "ION";
  officialRewardAsset: "LION";
  officialUnstakeRoundHoursApprox: number;
  lockOptions: Array<{
    label: string;
    days: number;
    aprBoostPct: number;
  }>;
  provenance: {
    source: "mock";
    note: string;
    officialRepo: string;
    dexDraftContract: string;
  };
};

export function getStakingSummary(): StakingSummary {
  return {
    totalStakedIon: "452000000.000",
    officialStakedIon: "398000000.000",
    dexStakedIon: "54000000.000",
    lpStakedUsd: "12800000.00",
    apr: {
      officialPct: null,
      dexPct: null,
      lpMiningPct: 31.8,
    },
    rewardAsset: "ION",
    officialRewardAsset: "LION",
    officialUnstakeRoundHoursApprox: 20,
    lockOptions: [
      { label: "Flexible", days: 0, aprBoostPct: 0 },
      { label: "30 days", days: 30, aprBoostPct: 2.5 },
      { label: "90 days", days: 90, aprBoostPct: 7.5 },
    ],
    provenance: {
      source: "mock",
      note:
        "Mock aggregates only. Official retail staking: ice-blockchain/liquid-staking-contract (ION→LION, ~20h round unstake). DEX hub forms target contracts/ion/staking-pool.fc draft — not the official pool.",
      officialRepo: "https://github.com/ice-blockchain/liquid-staking-contract",
      dexDraftContract: "contracts/ion/staking-pool.fc",
    },
  };
}
