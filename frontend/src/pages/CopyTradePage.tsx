import { useCallback, useEffect, useMemo, useState } from "react";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { MetricTile } from "@/components/ui/glass/MetricTile";
import {
  fetchCopyTradeStats,
  formatIonAmount,
  startCopyTradeSession,
  stopCopyTradeSession,
  type ApiMeta,
  type CopyDirection,
  type CopyTradeStats,
} from "@/lib/ionApi";

const fallbackStats: CopyTradeStats = {
  totalCopied: "0",
  totalPnl: "0",
  activeCopies: 0,
  leaderAddress: null,
  isActive: false,
  onlineTraders: 128,
  todayCopiedTotal: "0",
  avgReturnRate: "18.6%",
  myCopyCount: 0,
  leaders: [
    {
      address: "0x1111111111111111111111111111111111111111",
      name: "Top Trader 01",
      monthlyReturnPct: 32.8,
      avatarGradient: "cyan-purple",
    },
    {
      address: "0x2222222222222222222222222222222222222222",
      name: "Swing Hunter",
      monthlyReturnPct: 25.3,
      avatarGradient: "purple-pink",
    },
    {
      address: "0x3333333333333333333333333333333333333333",
      name: "ION Alpha",
      monthlyReturnPct: 19.1,
      avatarGradient: "green-cyan",
    },
  ],
  history: [],
  provenance: {
    source: "local-fallback",
    note: "Copy-trade API unavailable; showing catalog seed only.",
  },
};

const gradientClass: Record<CopyTradeStats["leaders"][number]["avatarGradient"], string> = {
  "cyan-purple": "bg-gradient-to-br from-cyan-400 to-purple-500",
  "purple-pink": "bg-gradient-to-br from-purple-500 to-pink-500",
  "green-cyan": "bg-gradient-to-br from-emerald-400 to-cyan-400",
};

function formatWeiIon(value: string): string {
  try {
    const wei = BigInt(value);
    const ion = Number(wei / 10n ** 15n) / 1000;
    if (!Number.isFinite(ion)) {
      return formatIonAmount(value);
    }
    return ion.toLocaleString(undefined, { maximumFractionDigits: 2 });
  } catch {
    return formatIonAmount(value);
  }
}

function copyProvenanceToMeta(_provenance: CopyTradeStats["provenance"], stale: boolean): ApiMeta {
  return {
    source: "indexer",
    updatedAt: new Date().toISOString(),
    stale,
    requestId: "copy-trade-ui",
  };
}

export function CopyTradePage() {
  const [stats, setStats] = useState<CopyTradeStats>(fallbackStats);
  const [meta, setMeta] = useState(fallbackStats.provenance);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [leaderAddress, setLeaderAddress] = useState(fallbackStats.leaders[0]?.address ?? "");
  const [maxCopyAmount, setMaxCopyAmount] = useState<bigint>(1_000_000_000_000_000_000n);
  const [minProfitBps, setMinProfitBps] = useState(50);
  const [stopLossBps, setStopLossBps] = useState(200);
  const [copySlippageBps, setCopySlippageBps] = useState(30);
  const [copyDirection, setCopyDirection] = useState<CopyDirection>("same");
  const isActive = stats.isActive;

  const reload = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    try {
      const response = await fetchCopyTradeStats();
      setStats(response.data);
      setMeta(response.data.provenance);
      setLoadState("ready");
    } catch (error) {
      console.warn("[copy-trade] stats fetch failed; using fallback seed.");
      setStats(fallbackStats);
      setMeta(fallbackStats.provenance);
      setLoadError(error instanceof Error ? error.message : String(error));
      setLoadState("ready");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const formValid = useMemo(() => {
    return (
      /^0x[a-fA-F0-9]{40}$/.test(leaderAddress) &&
      maxCopyAmount > 0n &&
      minProfitBps >= 1 &&
      minProfitBps <= 1000 &&
      stopLossBps >= 1 &&
      stopLossBps <= 2000 &&
      copySlippageBps >= 1 &&
      copySlippageBps <= 500
    );
  }, [copySlippageBps, leaderAddress, maxCopyAmount, minProfitBps, stopLossBps]);

  async function handleStart() {
    if (!formValid || busy) {
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const response = await startCopyTradeSession({
        leaderAddress,
        maxCopyAmount: maxCopyAmount.toString(),
        minProfitBps,
        stopLossBps,
        copySlippageBps,
        copyDirection,
      });
      setStats(response.data);
      setMeta(response.data.provenance);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    if (busy) {
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const response = await stopCopyTradeSession();
      setStats(response.data);
      setMeta(response.data.provenance);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  function selectLeader(address: string) {
    setLeaderAddress(address);
  }

  return (
    <div className="grid gap-5" data-testid="page-copy-trade">
      <GlassPanel eyebrow="Social trading" testId="copy-trade-hero" title="Copy Trade desk">
        <p className="text-sm text-cyan-100/60">
          Mirror curated leader wallets with bounded slippage, profit targets, and stop-loss guardrails.
        </p>
        <DataSourceBadge
          meta={copyProvenanceToMeta(meta, loadState === "error")}
          testId="copy-trade-source"
        />
      </GlassPanel>

      <AsyncState error={loadError} onRetry={reload} state={loadState} testId="copy-trade-stats">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Online traders"
            testId="copy-trade-stat-online-traders"
            tone="cyan"
            value={String(stats.onlineTraders)}
          />
          <MetricTile
            label="Today copied total"
            testId="copy-trade-stat-today-total"
            tone="magenta"
            value={`${formatWeiIon(stats.todayCopiedTotal)} ION`}
          />
          <MetricTile
            label="Avg return rate"
            testId="copy-trade-stat-avg-return"
            tone="emerald"
            value={stats.avgReturnRate}
          />
          <MetricTile
            label="My copy positions"
            testId="copy-trade-stat-my-count"
            tone="gold"
            value={`${stats.myCopyCount}`}
          />
        </div>
      </AsyncState>

      <GlassPanel testId="copy-trade-trader-list" title="Featured leaders">
        <div className="grid gap-3">
          {stats.leaders.map((leader, index) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-3"
              data-testid={`copy-trade-trader-row-${index}`}
              key={leader.address}
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full ${gradientClass[leader.avatarGradient]}`} />
                <div>
                  <p className="font-semibold text-white">{leader.name}</p>
                  <p className="text-xs text-cyan-100/55">Monthly +{leader.monthlyReturnPct}%</p>
                </div>
              </div>
              <NeonButton
                className="px-4 py-2 text-xs"
                data-testid="copy-trade-copy-btn"
                onClick={() => selectLeader(leader.address)}
                type="button"
              >
                Copy
              </NeonButton>
            </div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel testId="copy-trade-form-panel" title="Copy configuration">
        <form
          className="grid gap-4 md:grid-cols-2"
          data-testid="copy-trade-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleStart();
          }}
        >
          <label className="grid gap-1 text-sm text-cyan-100/70">
            Leader address
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              data-testid="copy-trade-leader-address"
              onChange={(event) => setLeaderAddress(event.target.value.trim())}
              value={leaderAddress}
            />
          </label>
          <label className="grid gap-1 text-sm text-cyan-100/70">
            Max copy amount (wei)
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              data-testid="copy-trade-max-amount"
              onChange={(event) => {
                try {
                  setMaxCopyAmount(BigInt(event.target.value || "0"));
                } catch {
                  setMaxCopyAmount(0n);
                }
              }}
              value={maxCopyAmount.toString()}
            />
          </label>
          <label className="grid gap-1 text-sm text-cyan-100/70">
            Min profit (bps)
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              data-testid="copy-trade-min-profit-bps"
              max={1000}
              min={1}
              onChange={(event) => setMinProfitBps(Number(event.target.value))}
              type="number"
              value={minProfitBps}
            />
          </label>
          <label className="grid gap-1 text-sm text-cyan-100/70">
            Stop loss (bps)
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              data-testid="copy-trade-stop-loss-bps"
              max={2000}
              min={1}
              onChange={(event) => setStopLossBps(Number(event.target.value))}
              type="number"
              value={stopLossBps}
            />
          </label>
          <label className="grid gap-1 text-sm text-cyan-100/70">
            Slippage (bps)
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              data-testid="copy-trade-slippage-bps"
              max={500}
              min={1}
              onChange={(event) => setCopySlippageBps(Number(event.target.value))}
              type="number"
              value={copySlippageBps}
            />
          </label>
          <div className="grid gap-2 text-sm text-cyan-100/70">
            Direction
            <div className="flex flex-wrap gap-2">
              <button
                className={`rounded-full px-4 py-2 text-xs font-black ${copyDirection === "same" ? "bg-white/15 text-white" : "text-cyan-100/60"}`}
                data-testid="copy-trade-direction-same"
                onClick={() => setCopyDirection("same")}
                type="button"
              >
                Same side
              </button>
              <button
                className={`rounded-full px-4 py-2 text-xs font-black ${copyDirection === "reverse" ? "bg-white/15 text-white" : "text-cyan-100/60"}`}
                data-testid="copy-trade-direction-reverse"
                onClick={() => setCopyDirection("reverse")}
                type="button"
              >
                Reverse
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <NeonButton data-testid="copy-trade-start-btn" disabled={!formValid || busy || isActive} type="submit">
              Start copy
            </NeonButton>
            <NeonButton
              className="bg-white/10 shadow-none"
              data-testid="copy-trade-stop-btn"
              disabled={!isActive || busy}
              onClick={() => void handleStop()}
              type="button"
            >
              Stop copy
            </NeonButton>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${isActive ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-cyan-100/60"}`}
              data-active={isActive ? "true" : "false"}
              data-testid="copy-trade-toggle-active"
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </form>
        {actionError ? <p className="mt-3 text-sm text-rose-300">{actionError}</p> : null}
        {isActive ? (
          <p
            className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
            data-testid="copy-trade-confirmation"
          >
            Copy session live for {stats.leaderAddress?.slice(0, 10)}… — direction {copyDirection}, cap{" "}
            {formatWeiIon(maxCopyAmount.toString())} ION.
          </p>
        ) : null}
      </GlassPanel>

      <GlassPanel testId="copy-trade-history" title="Trade history">
        {stats.history.length === 0 ? (
          <p className="text-sm text-cyan-100/55">No mirrored trades yet. Start a copy session to populate history.</p>
        ) : (
          <div className="grid gap-2">
            {stats.history.map((row) => (
              <div
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm"
                data-testid={`copy-trade-history-row-${row.id}`}
                key={row.id}
              >
                <span className="text-white">{row.leaderName}</span>
                <span className="text-cyan-100/70">
                  {row.side.toUpperCase()} {row.pair}
                </span>
                <span className="text-emerald-200">{formatWeiIon(row.amountIon)} ION</span>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
