export type LiquidityMinePool = {
  id: number;
  name: string;
  pairLabel: string;
  aprPct: string;
  lockupDays: number;
  totalStaked: string;
  rewardPerBlock: string;
  userStaked: string;
  pendingReward: string;
  canStake: boolean;
  canUnstake: boolean;
  canClaim: boolean;
  lockupActive: boolean;
};

export type LiquidityMineSummary = {
  myLpShares: string;
  pendingReward: string;
  pools: LiquidityMinePool[];
  provenance: {
    source: "local-session";
    note: string;
  };
};

export type LiquidityMineStakeInput = {
  poolId: number;
  amount: string;
};

export class LiquidityMineValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiquidityMineValidationError";
  }
}

type PoolSeed = {
  id: number;
  name: string;
  pairLabel: string;
  aprPct: string;
  lockupDays: number;
  rewardPerBlock: string;
  totalStakedWei: bigint;
};

type UserStake = {
  amountWei: bigint;
  stakedAtMs: number;
  pendingRewardWei: bigint;
};

const poolSeeds: PoolSeed[] = [
  {
    id: 0,
    name: "ION / USDT",
    pairLabel: "ION-USDT",
    aprPct: "25.5",
    lockupDays: 7,
    rewardPerBlock: "1000000000000000000",
    totalStakedWei: 12_580_000_000_000_000_000_000n,
  },
  {
    id: 1,
    name: "ION / BNB",
    pairLabel: "ION-BNB",
    aprPct: "22.8",
    lockupDays: 14,
    rewardPerBlock: "800000000000000000",
    totalStakedWei: 8_420_000_000_000_000_000_000n,
  },
];

const userStakes = new Map<number, UserStake>();

let seedRegistryWarned = false;

function warnSeedRegistryOnce(): void {
  if (seedRegistryWarned) {
    return;
  }
  seedRegistryWarned = true;
  console.warn("[liquidity-mine] on-chain pool registry not yet wired; using local session + catalog seed.");
}

function formatIonFromWei(wei: bigint): string {
  const whole = wei / 10n ** 18n;
  const frac = wei % 10n ** 18n;
  if (frac === 0n) {
    return whole.toString();
  }
  const fracStr = frac.toString().padStart(18, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

function parseAmountWei(amount: string): bigint {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new LiquidityMineValidationError("amount must be a positive decimal string.");
  }
  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = `${frac}000000000000000000`.slice(0, 18);
  const wei = BigInt(whole) * 10n ** 18n + BigInt(fracPadded || "0");
  if (wei <= 0n) {
    throw new LiquidityMineValidationError("amount must be greater than zero.");
  }
  return wei;
}

function lockupActive(poolId: number, stake: UserStake | undefined): boolean {
  if (!stake || stake.amountWei === 0n) {
    return false;
  }
  const seed = poolSeeds.find((p) => p.id === poolId);
  if (!seed) {
    return false;
  }
  const lockMs = seed.lockupDays * 24 * 60 * 60 * 1000;
  return Date.now() < stake.stakedAtMs + lockMs;
}

function buildPoolView(seed: PoolSeed): LiquidityMinePool {
  const stake = userStakes.get(seed.id);
  const userStakedWei = stake?.amountWei ?? 0n;
  const pendingWei = stake?.pendingRewardWei ?? 0n;
  const lockActive = lockupActive(seed.id, stake);

  return {
    id: seed.id,
    name: seed.name,
    pairLabel: seed.pairLabel,
    aprPct: seed.aprPct,
    lockupDays: seed.lockupDays,
    totalStaked: formatIonFromWei(seed.totalStakedWei + userStakedWei),
    rewardPerBlock: seed.rewardPerBlock,
    userStaked: formatIonFromWei(userStakedWei),
    pendingReward: formatIonFromWei(pendingWei),
    canStake: true,
    canUnstake: userStakedWei > 0n && !lockActive,
    canClaim: pendingWei > 0n,
    lockupActive: lockActive,
  };
}

export function getLiquidityMineSummary(): LiquidityMineSummary {
  warnSeedRegistryOnce();
  const pools = poolSeeds.map(buildPoolView);
  let myLpShares = 0n;
  let pendingReward = 0n;
  for (const stake of userStakes.values()) {
    myLpShares += stake.amountWei;
    pendingReward += stake.pendingRewardWei;
  }

  return {
    myLpShares: formatIonFromWei(myLpShares),
    pendingReward: formatIonFromWei(pendingReward),
    pools,
    provenance: {
      source: "local-session",
      note: "Liquidity mine API uses in-memory stakes until BSC LiquidityMine contract is indexed.",
    },
  };
}

export function stakeLiquidityMine(input: LiquidityMineStakeInput): LiquidityMineSummary {
  const poolId = Number(input.poolId);
  if (!Number.isInteger(poolId) || poolId < 0 || poolId >= poolSeeds.length) {
    throw new LiquidityMineValidationError("poolId is invalid.");
  }
  const amountWei = parseAmountWei(input.amount);
  const existing = userStakes.get(poolId);
  const next: UserStake = {
    amountWei: (existing?.amountWei ?? 0n) + amountWei,
    stakedAtMs: existing?.stakedAtMs ?? Date.now(),
    pendingRewardWei: (existing?.pendingRewardWei ?? 0n) + amountWei / 100n,
  };
  userStakes.set(poolId, next);
  return getLiquidityMineSummary();
}

export function unstakeLiquidityMine(input: LiquidityMineStakeInput): LiquidityMineSummary {
  const poolId = Number(input.poolId);
  if (!Number.isInteger(poolId) || poolId < 0 || poolId >= poolSeeds.length) {
    throw new LiquidityMineValidationError("poolId is invalid.");
  }
  const amountWei = parseAmountWei(input.amount);
  const existing = userStakes.get(poolId);
  if (!existing || existing.amountWei < amountWei) {
    throw new LiquidityMineValidationError("insufficient staked amount.");
  }
  if (lockupActive(poolId, existing)) {
    throw new LiquidityMineValidationError("lockup period is still active.");
  }
  const remaining = existing.amountWei - amountWei;
  if (remaining === 0n) {
    userStakes.delete(poolId);
  } else {
    userStakes.set(poolId, { ...existing, amountWei: remaining });
  }
  return getLiquidityMineSummary();
}

export function claimLiquidityMineReward(poolIdInput: number): LiquidityMineSummary {
  const poolId = Number(poolIdInput);
  if (!Number.isInteger(poolId) || poolId < 0 || poolId >= poolSeeds.length) {
    throw new LiquidityMineValidationError("poolId is invalid.");
  }
  const existing = userStakes.get(poolId);
  if (!existing || existing.pendingRewardWei === 0n) {
    throw new LiquidityMineValidationError("no pending reward to claim.");
  }
  userStakes.set(poolId, { ...existing, pendingRewardWei: 0n });
  return getLiquidityMineSummary();
}

/** Test helper — reset in-memory stakes between API tests. */
export function resetLiquidityMineSessionForTests(): void {
  userStakes.clear();
}
