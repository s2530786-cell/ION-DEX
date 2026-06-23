export type IndexerChain = "ion" | "bsc";

export type IndexerEventKind = "burn" | "staking";

export type IndexerEventCursor = {
  chain: IndexerChain;
  kind: IndexerEventKind;
  lastBlock: number | null;
  lastUpdatedAt: string;
};

export type BurnIndexerSnapshot = {
  chain: IndexerChain;
  totalBurnedIon: string | null;
  note: string;
  cursor: IndexerEventCursor;
};

export type StakingIndexerSnapshot = {
  chain: IndexerChain;
  totalStakedIon: string | null;
  note: string;
  cursor: IndexerEventCursor;
};

export type IndexerReadCache = {
  fetchedAt: string;
  staleAfterMs: number;
  burn: {
    ion: BurnIndexerSnapshot;
    bsc: BurnIndexerSnapshot;
  };
  staking: {
    ion: StakingIndexerSnapshot;
    bsc: StakingIndexerSnapshot;
  };
};
