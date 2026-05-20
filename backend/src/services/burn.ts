export type BurnSummary = {
  totalBurnedIon: string;
  bscBurnedIon: string;
  ionMainnetBurnedIon: string;
  remainingSupplyIon: string;
  bscBurnAddress: string;
  /** ION mainnet burn wallet (user-friendly), validated via Indexer v3. */
  ionBurnAddress: string;
  ionBurnSource: string;
  windows: Array<{
    label: "24h" | "7d" | "30d";
    burnedIon: string;
    trendPct: number;
  }>;
  provenance: Array<{
    source: "mock" | "bsc-indexer" | "ion-indexer";
    status: "mocked" | "planned" | "online";
    note: string;
  }>;
};

export function getBurnSummary(): BurnSummary {
  return {
    totalBurnedIon: "12845000.000",
    bscBurnedIon: "8245000.000",
    ionMainnetBurnedIon: "4600000.000",
    remainingSupplyIon: "987155000.000",
    bscBurnAddress: "0x000000000000000000000000000000000000dEaD",
    ionBurnAddress: "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ",
    ionBurnSource: "mock:ion-mainnet-burn-placeholder",
    windows: [
      { label: "24h", burnedIon: "12500.000", trendPct: 8.4 },
      { label: "7d", burnedIon: "74200.000", trendPct: 12.1 },
      { label: "30d", burnedIon: "321000.000", trendPct: 18.9 },
    ],
    provenance: [
      {
        source: "mock",
        status: "mocked",
        note: "Phase 3 mock values only; indexer reconciliation is pending.",
      },
      {
        source: "bsc-indexer",
        status: "planned",
        note: "Later reads BSC burn address transfers and vault burn events.",
      },
      {
        source: "ion-indexer",
        status: "planned",
        note: "Later reads official ION mainnet burn source.",
      },
    ],
  };
}
