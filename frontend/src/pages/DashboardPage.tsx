import {
  ArrowLeftRight,
  Bot,
  Flame,
  LayoutGrid,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";
import { MarketChart, buildSyntheticSeries } from "@/components/charts/MarketChart";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import type { PageKey } from "@/components/layout/AppShell";
import { usePreviewResource } from "@/hooks/usePreviewResource";
import type { ApiResource } from "@/hooks/useApiResource";
import { formatIonAmount, type BurnSummary, type MarketTicker, type StakingSummary } from "@/lib/ionApi";

type FeatureCard = {
  title: string;
  label: string;
  target: PageKey;
  icon: typeof Layers3;
  color: "cyan" | "magenta" | "gold";
};

const featureCards: FeatureCard[] = [
  { title: "Pool", label: "Liquidity", target: "pool", icon: Layers3, color: "cyan" },
  { title: "Grid", label: "Spot strategies", target: "grid", icon: LayoutGrid, color: "magenta" },
  { title: "Bridge", label: "ION / BSC", target: "bridge", icon: ArrowLeftRight, color: "cyan" },
  { title: "Burn", label: "Dual-chain tracker", target: "burn", icon: Flame, color: "magenta" },
  { title: "ION ID", label: "KYC Pass", target: "domain", icon: ShieldCheck, color: "gold" },
  { title: "AI Market", label: "Signals & risk", target: "ai", icon: Bot, color: "cyan" },
];

export function DashboardPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const tickers = usePreviewResource((m) => m.marketTickers, {
    isEmpty: (data) => data.length === 0,
    metaKey: "markets/tickers",
  });
  const burn = usePreviewResource((m) => m.burnSummary, { metaKey: "burn/summary" });
  const staking = usePreviewResource((m) => m.stakingSummary, { metaKey: "staking/summary" });

  const ionTicker = useMemo(
    () => tickers.data.find((ticker) => ticker.symbol === "ION") ?? tickers.data[0],
    [tickers.data],
  );

  const chartPoints = useMemo(() => {
    if (!ionTicker) {
      return [];
    }
    return buildSyntheticSeries(ionTicker.priceUsd, ionTicker.change24hPct);
  }, [ionTicker]);

  const tvlLabel = useMemo(() => {
    const lpUsd = Number(staking.data.lpStakedUsd);
    if (!Number.isFinite(lpUsd)) {
      return `$${staking.data.lpStakedUsd}`;
    }
    return lpUsd >= 1_000_000
      ? `$${(lpUsd / 1_000_000).toFixed(2)}M`
      : `$${lpUsd.toLocaleString()}`;
  }, [staking.data.lpStakedUsd]);

  const burnProgress = useMemo(() => {
    const burned = Number(burn.data.totalBurnedIon);
    const remaining = Number(burn.data.remainingSupplyIon);
    if (!Number.isFinite(burned) || !Number.isFinite(remaining) || burned + remaining <= 0) {
      return 62;
    }
    return Math.min(100, Math.round((burned / (burned + remaining)) * 100));
  }, [burn.data.remainingSupplyIon, burn.data.totalBurnedIon]);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_18rem]" data-testid="page-dashboard">
      <MarketStage
        chartPoints={chartPoints}
        ionTicker={ionTicker}
        onNavigate={onNavigate}
        tickers={tickers}
      />
      <RightStats burn={burn} burnProgress={burnProgress} staking={staking} tvlLabel={tvlLabel} />
      <div className="xl:col-span-2">
        <FeatureGrid onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function MarketStage({
  tickers,
  ionTicker,
  chartPoints,
  onNavigate,
}: {
  tickers: ApiResource<MarketTicker[]>;
  ionTicker: MarketTicker | undefined;
  chartPoints: ReturnType<typeof buildSyntheticSeries>;
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <NeonCard className="min-h-[28rem]" variant="cyan">
      <div className="flex h-full flex-col">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-cyan-200/70">
              Professional Chart
            </p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
              ION Market <span className="text-glow-magenta text-fuchsia-300">Galaxy</span>
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Sparkles className="text-cyan-200" />
            <NeonButton
              className="px-4 py-2 text-xs"
              data-testid="dashboard-open-swap"
              onClick={() => onNavigate("swap")}
              type="button"
            >
              Open Swap
            </NeonButton>
          </div>
        </div>

        <DataSourceBadge meta={tickers.meta} testId="dashboard-chart-source" />

        <AsyncState
          error={tickers.error}
          skeletonChart
          state={tickers.state}
          testId="dashboard-chart"
        >
          {chartPoints.length > 0 ? (
            <MarketChart candles={chartPoints} mode="candle" testId="dashboard-market-chart" />
          ) : (
            <ChartPlaceholder />
          )}
          {ionTicker ? (
            <p className="mt-3 text-sm text-cyan-100/75" data-testid="dashboard-ion-quote">
              ION {ionTicker.displayPrice} · {ionTicker.displayChange} · AI Signal:{" "}
              {ionTicker.change24hPct >= 0 ? "Bullish" : "Cautious"}{" "}
              {Math.abs(ionTicker.change24hPct).toFixed(1)}%
            </p>
          ) : null}
        </AsyncState>
      </div>
    </NeonCard>
  );
}

function ChartPlaceholder() {
  return (
    <div className="grid h-[17.5rem] place-items-center rounded-[1.25rem] border border-white/10 bg-black/30 text-sm text-cyan-100/60">
      Waiting for ticker data
    </div>
  );
}

function RightStats({
  staking,
  burn,
  tvlLabel,
  burnProgress,
}: {
  staking: ApiResource<StakingSummary>;
  burn: ApiResource<BurnSummary>;
  tvlLabel: string;
  burnProgress: number;
}) {
  return (
    <div className="grid gap-5">
      <NeonCard variant="cyan">
        <DataSourceBadge meta={staking.meta} testId="dashboard-tvl-source" />
        <AsyncState error={staking.error} state={staking.state} testId="dashboard-tvl">
          <p className="text-sm text-cyan-100/55">TVL</p>
          <p className="mt-1 text-3xl font-black" data-testid="dashboard-tvl-value">
            {tvlLabel}
          </p>
          <p className="mt-1 text-xs text-emerald-300">
            LP mining APR {staking.data.apr.lpMiningPct}%
          </p>
        </AsyncState>
      </NeonCard>

      <NeonCard variant="magenta">
        <DataSourceBadge meta={staking.meta} testId="dashboard-apr-source" />
        <AsyncState error={staking.error} state={staking.state} testId="dashboard-apr">
          <p className="text-sm text-cyan-100/55">APR</p>
          <p className="mt-1 text-3xl font-black" data-testid="dashboard-apr-value">
            {staking.data.apr.dexPct}%
          </p>
          <p className="mt-1 text-xs text-cyan-200">Dynamic DEX staking rate</p>
        </AsyncState>
      </NeonCard>

      <NeonCard variant="gold">
        <DataSourceBadge meta={burn.meta} testId="dashboard-burn-source" />
        <AsyncState error={burn.error} state={burn.state} testId="dashboard-burn">
          <p className="text-sm text-cyan-100/55">Burn</p>
          <p className="mt-1 text-3xl font-black" data-testid="dashboard-burn-value">
            {formatIonAmount(burn.data.totalBurnedIon)}
          </p>
          <div className="mt-4 h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-[linear-gradient(90deg,#24f7ff,#ff3bd4,#ffd166)]"
              style={{ width: `${burnProgress}%` }}
            />
          </div>
        </AsyncState>
      </NeonCard>
    </div>
  );
}

function FeatureGrid({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {featureCards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            className="text-left"
            data-testid={`dashboard-feature-${card.target}`}
            key={card.title}
            onClick={() => onNavigate(card.target)}
            type="button"
          >
            <NeonCard variant={card.color} className="min-h-[11rem] transition hover:scale-[1.01]">
              <div className="flex h-full flex-col justify-between">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.07] text-cyan-200 shadow-neonCyan">
                  <Icon size={28} />
                </div>
                <div>
                  <p className="text-2xl font-black">{card.title}</p>
                  <p className="text-sm text-cyan-100/55">{card.label}</p>
                </div>
              </div>
            </NeonCard>
          </button>
        );
      })}
    </div>
  );
}
