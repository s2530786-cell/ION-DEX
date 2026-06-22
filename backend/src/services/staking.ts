import { enrichStakingSummaryWithIndexer } from "../indexer/index.js";

export type StakingSummary = {
  totalStakedIon: string;
  officialStakedIon: string;
  dexStakedIon: string;
  lpStakedUsd: string;
  apr: {
    officialPct: number;
    dexPct: number;
    lpMiningPct: number;
  };
  rewardAsset: "ION";
  lockOptions: Array<{
    label: string;
    days: number;
    aprBoostPct: number;
  }>;
  provenance: {
    source: "mock" | "upstream";
    note: string;
  };
};

export function getStakingSummary(): StakingSummary {
  return enrichStakingSummaryWithIndexer({
    totalStakedIon: "452000000.000",
    officialStakedIon: "398000000.000",
    dexStakedIon: "54000000.000",
    lpStakedUsd: "12800000.00",
    apr: {
      officialPct: 18.2,
      dexPct: 25.5,
      lpMiningPct: 31.8,
    },
    rewardAsset: "ION",
    lockOptions: [
      { label: "Flexible", days: 0, aprBoostPct: 0 },
      { label: "30 days", days: 30, aprBoostPct: 2.5 },
      { label: "90 days", days: 90, aprBoostPct: 7.5 },
    ],
    provenance: {
      source: "mock",
      note: "Phase 3 mock staking totals; official staking and DEX staking adapters are pending.",
    },
  });
}
