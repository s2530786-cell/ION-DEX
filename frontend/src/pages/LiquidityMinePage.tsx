import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { MetricTile } from "@/components/ui/glass/MetricTile";
import {
  claimLiquidityMineReward,
  fetchLiquidityMinePools,
  stakeLiquidityMine,
  unstakeLiquidityMine,
  type ApiMeta,
  type LiquidityMineSummary,
} from "@/lib/ionApi";

const fallbackSummary: LiquidityMineSummary = {
  myLpShares: "1258.60",
  pendingReward: "96.88",
  pools: [
    {
      id: 0,
      name: "ION / USDT",
      pairLabel: "ION-USDT",
      aprPct: "25.5",
      lockupDays: 7,
      totalStaked: "12580",
      rewardPerBlock: "1000000000000000000",
      userStaked: "0",
      pendingReward: "0",
      canStake: true,
      canUnstake: false,
      canClaim: false,
      lockupActive: false,
    },
    {
      id: 1,
      name: "ION / BNB",
      pairLabel: "ION-BNB",
      aprPct: "22.8",
      lockupDays: 14,
      totalStaked: "8420",
      rewardPerBlock: "800000000000000000",
      userStaked: "0",
      pendingReward: "0",
      canStake: true,
      canUnstake: false,
      canClaim: false,
      lockupActive: false,
    },
  ],
  provenance: {
    source: "local-fallback",
    note: "Liquidity mine API unavailable; showing catalog seed only.",
  },
};

function liquidityProvenanceToMeta(provenance: LiquidityMineSummary["provenance"]): ApiMeta {
  return {
    source: "indexer",
    updatedAt: new Date().toISOString(),
    stale: false,
    requestId: "liquidity-mine-ui",
  };
}

export function LiquidityMinePage() {
  const [summary, setSummary] = useState<LiquidityMineSummary>(fallbackSummary);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyPoolId, setBusyPoolId] = useState<number | null>(null);
  const [stakeAmounts, setStakeAmounts] = useState<Record<number, string>>({ 0: "100", 1: "50" });
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    try {
      const response = await fetchLiquidityMinePools();
      setSummary(response.data);
      setLoadState("ready");
    } catch (error) {
      console.warn("[liquidity-mine] stats fetch failed; using fallback seed.");
      setSummary(fallbackSummary);
      setLoadError(error instanceof Error ? error.message : String(error));
      setLoadState("ready");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const meta = useMemo(() => liquidityProvenanceToMeta(summary.provenance), [summary.provenance]);

  const runAction = useCallback(
    async (poolId: number, action: "stake" | "unstake" | "claim") => {
      setBusyPoolId(poolId);
      setMessage(null);
      try {
        if (action === "stake") {
          const amount = stakeAmounts[poolId] ?? "0";
          const response = await stakeLiquidityMine({ poolId, amount });
          setSummary(response.data);
          setMessage(`已质押 ${amount} LP 到 ${summary.pools.find((p) => p.id === poolId)?.name ?? "pool"}.`);
        } else if (action === "unstake") {
          const pool = summary.pools.find((p) => p.id === poolId);
          const amount = pool?.userStaked ?? "0";
          const response = await unstakeLiquidityMine({ poolId, amount });
          setSummary(response.data);
          setMessage(`已从 ${pool?.name ?? "pool"} 解除质押。`);
        } else {
          const response = await claimLiquidityMineReward(poolId);
          setSummary(response.data);
          setMessage("挖矿奖励已领取。");
        }
        setLoadState("ready");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "操作失败，请稍后重试。");
      } finally {
        setBusyPoolId(null);
      }
    },
    [stakeAmounts, summary.pools],
  );

  return (
    <motion.div className="grid gap-5" data-testid="page-liquidity-mine">
      <GlassPanel eyebrow="Liquidity mining" testId="liquidity-mine-hero" title="Liquidity Mine">
        <p className="text-sm text-white/70">
          质押 ION 流动性池 LP 份额，按区块领取 ION 挖矿奖励。锁定期内可紧急退出，但未领奖励将被清零。
        </p>
        <DataSourceBadge meta={meta} testId="liquidity-mine-source" />
      </GlassPanel>

      <AsyncState error={loadError} onRetry={reload} state={loadState} testId="liquidity-mine-stats">
        <motion.div className="grid gap-4 sm:grid-cols-2">
          <MetricTile
            label="我的 LP 份额"
            testId="liquidity-mine-stat-lp-shares"
            tone="cyan"
            value={`${summary.myLpShares} LP`}
          />
          <MetricTile
            label="待领取挖矿收益"
            testId="liquidity-mine-stat-pending-reward"
            tone="emerald"
            value={`${summary.pendingReward} ION`}
          />
        </motion.div>
      </AsyncState>

      <GlassPanel testId="liquidity-mine-pools" title="可参与资金池">
        <div className="grid gap-3">
          {summary.pools.map((pool) => (
            <div
              key={pool.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
              data-testid={`liquidity-mine-pool-row-${pool.id}`}
            >
              <motion.div>
                <p className="font-semibold text-white">{pool.name}</p>
                <p className="text-sm text-white/55">
                  年化 {pool.aprPct}% · 锁仓 {pool.lockupDays} 天 · 已质押 {pool.userStaked} LP
                </p>
                {pool.pendingReward !== "0" && (
                  <p className="text-xs text-emerald-300/90">待领 {pool.pendingReward} ION</p>
                )}
                {pool.lockupActive && (
                  <p className="text-xs text-amber-300/90" data-testid={`liquidity-mine-lockup-${pool.id}`}>
                    锁定期进行中
                  </p>
                )}
              </motion.div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  aria-label={`Stake amount for ${pool.name}`}
                  className="w-24 rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
                  data-testid={`liquidity-mine-stake-amount-${pool.id}`}
                  inputMode="decimal"
                  onChange={(event) =>
                    setStakeAmounts((prev) => ({ ...prev, [pool.id]: event.target.value }))
                  }
                  value={stakeAmounts[pool.id] ?? ""}
                />
                <NeonButton
                  data-testid={`liquidity-mine-stake-btn-${pool.id}`}
                  disabled={busyPoolId !== null || !pool.canStake}
                  onClick={() => void runAction(pool.id, "stake")}
                  type="button"
                >
                  加入质押
                </NeonButton>
                <NeonButton
                  className="!bg-white/10 !shadow-none"
                  data-testid={`liquidity-mine-unstake-btn-${pool.id}`}
                  disabled={busyPoolId !== null || !pool.canUnstake}
                  onClick={() => void runAction(pool.id, "unstake")}
                  type="button"
                >
                  解除质押
                </NeonButton>
                <NeonButton
                  className="!bg-emerald-500/20 !shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                  data-testid={`liquidity-mine-claim-btn-${pool.id}`}
                  disabled={busyPoolId !== null || !pool.canClaim}
                  onClick={() => void runAction(pool.id, "claim")}
                  type="button"
                >
                  领取奖励
                </NeonButton>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {message && (
        <p className="text-sm text-cyan-200/90" data-testid="liquidity-mine-confirmation">
          {message}
        </p>
      )}
    </motion.div>
  );
}
