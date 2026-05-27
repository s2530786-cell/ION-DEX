export type CopyDirection = "same" | "reverse";

export type CopyTradeStartInput = {
  leaderAddress: string;
  maxCopyAmount: string;
  minProfitBps: number;
  stopLossBps: number;
  copySlippageBps: number;
  copyDirection: CopyDirection;
};

export type CopyLeader = {
  address: string;
  name: string;
  monthlyReturnPct: number;
  avatarGradient: "cyan-purple" | "purple-pink" | "green-cyan";
};

export type CopyTradeHistoryRow = {
  id: string;
  leaderName: string;
  side: "buy" | "sell";
  pair: string;
  amountIon: string;
  pnlIon: string;
  copiedAt: string;
};

export type CopyTradeStats = {
  totalCopied: string;
  totalPnl: string;
  activeCopies: number;
  leaderAddress: string | null;
  isActive: boolean;
  onlineTraders: number;
  todayCopiedTotal: string;
  avgReturnRate: string;
  myCopyCount: number;
  leaders: CopyLeader[];
  history: CopyTradeHistoryRow[];
  provenance: {
    source: "local-session";
    note: string;
  };
};

type Session = CopyTradeStartInput & {
  isActive: boolean;
  startedAt: string;
};

const evmAddressPattern = /^0x[a-fA-F0-9]{40}$/;

const catalogLeaders: CopyLeader[] = [
  { address: "0x1111111111111111111111111111111111111111", name: "Top Trader 01", monthlyReturnPct: 32.8, avatarGradient: "cyan-purple" },
  { address: "0x2222222222222222222222222222222222222222", name: "Swing Hunter", monthlyReturnPct: 25.3, avatarGradient: "purple-pink" },
  { address: "0x3333333333333333333333333333333333333333", name: "ION Alpha", monthlyReturnPct: 19.1, avatarGradient: "green-cyan" },
];

let session: Session | null = null;
let totalCopiedWei = 0n;
let totalPnlIon = 0;
let myCopyCount = 0;

console.warn("[copy-trade] on-chain leader registry not yet wired; using local session + catalog seed.");

function validateStart(input: CopyTradeStartInput): string | null {
  if (!evmAddressPattern.test(input.leaderAddress)) {
    return "leaderAddress must be a valid EVM address.";
  }
  let maxAmount: bigint;
  try {
    maxAmount = BigInt(input.maxCopyAmount);
  } catch {
    return "maxCopyAmount must be a valid integer string.";
  }
  if (maxAmount <= 0n) {
    return "maxCopyAmount must be greater than zero.";
  }
  if (input.minProfitBps < 1 || input.minProfitBps > 1000) {
    return "minProfitBps must be between 1 and 1000.";
  }
  if (input.stopLossBps < 1 || input.stopLossBps > 2000) {
    return "stopLossBps must be between 1 and 2000.";
  }
  if (input.copySlippageBps < 1 || input.copySlippageBps > 500) {
    return "copySlippageBps must be between 1 and 500.";
  }
  if (input.copyDirection !== "same" && input.copyDirection !== "reverse") {
    return "copyDirection must be same or reverse.";
  }
  return null;
}

function buildHistory(): CopyTradeHistoryRow[] {
  if (!session?.isActive) {
    return [];
  }
  const active = session;
  const leader = catalogLeaders.find((row) => row.address.toLowerCase() === active.leaderAddress.toLowerCase());
  return [
    {
      id: "copy-1",
      leaderName: leader?.name ?? active.leaderAddress.slice(0, 10),
      side: active.copyDirection === "same" ? "buy" : "sell",
      pair: "ION/USDT",
      amountIon: active.maxCopyAmount,
      pnlIon: "0",
      copiedAt: active.startedAt,
    },
  ];
}

export function startCopyTrade(input: CopyTradeStartInput): CopyTradeStats {
  const validationError = validateStart(input);
  if (validationError) {
    throw new CopyTradeValidationError(validationError);
  }
  session = {
    ...input,
    isActive: true,
    startedAt: new Date().toISOString(),
  };
  myCopyCount += 1;
  totalCopiedWei += BigInt(input.maxCopyAmount);
  return getCopyTradeStats();
}

export function stopCopyTrade(): CopyTradeStats {
  if (session) {
    session.isActive = false;
  }
  return getCopyTradeStats();
}

export function getCopyTradeStats(): CopyTradeStats {
  const active = Boolean(session?.isActive);
  return {
    totalCopied: totalCopiedWei.toString(),
    totalPnl: totalPnlIon.toFixed(4),
    activeCopies: active ? 1 : 0,
    leaderAddress: session?.leaderAddress ?? null,
    isActive: active,
    onlineTraders: catalogLeaders.length + 125,
    todayCopiedTotal: totalCopiedWei.toString(),
    avgReturnRate: "18.6%",
    myCopyCount,
    leaders: catalogLeaders,
    history: buildHistory(),
    provenance: {
      source: "local-session",
      note: "Copy-trade session is in-memory until on-chain leader registry is wired.",
    },
  };
}

export class CopyTradeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CopyTradeValidationError";
  }
}

export function resetCopyTradeForTests(): void {
  session = null;
  totalCopiedWei = 0n;
  totalPnlIon = 0;
  myCopyCount = 0;
}
