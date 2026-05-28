export type BurnReconcileRow = {
  source: "mock" | "bsc-indexer" | "ion-indexer";
  reportedBurnedIon: string;
  indexedBurnedIon: string | null;
  deltaIon: string | null;
  status: "ok" | "pending" | "mismatch";
};

export type BurnReconcileReport = {
  generatedAt: string;
  rows: BurnReconcileRow[];
};

function parseAmount(value: string): number | null {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function delta(reported: string, indexed: string | null): string | null {
  if (indexed === null) {
    return null;
  }
  const a = parseAmount(reported);
  const b = parseAmount(indexed);
  if (a === null || b === null) {
    return null;
  }
  return (b - a).toFixed(3);
}

function rowStatus(reported: string, indexed: string | null): BurnReconcileRow["status"] {
  if (indexed === null) {
    return "pending";
  }
  const a = parseAmount(reported);
  const b = parseAmount(indexed);
  if (a === null || b === null) {
    return "pending";
  }
  return Math.abs(b - a) < 0.001 ? "ok" : "mismatch";
}

export function buildBurnReconcileReport(params: {
  mockTotal: string;
  bscIndexed: string | null;
  ionIndexed: string | null;
  generatedAt?: string;
}): BurnReconcileReport {
  const rows: BurnReconcileRow[] = [
    {
      source: "mock",
      reportedBurnedIon: params.mockTotal,
      indexedBurnedIon: params.mockTotal,
      deltaIon: "0.000",
      status: "ok",
    },
    {
      source: "bsc-indexer",
      reportedBurnedIon: params.mockTotal,
      indexedBurnedIon: params.bscIndexed,
      deltaIon: delta(params.mockTotal, params.bscIndexed),
      status: rowStatus(params.mockTotal, params.bscIndexed),
    },
    {
      source: "ion-indexer",
      reportedBurnedIon: params.mockTotal,
      indexedBurnedIon: params.ionIndexed,
      deltaIon: delta(params.mockTotal, params.ionIndexed),
      status: rowStatus(params.mockTotal, params.ionIndexed),
    },
  ];

  return {
    generatedAt: params.generatedAt ?? new Date().toISOString(),
    rows,
  };
}
