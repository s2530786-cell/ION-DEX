import {
  ArrowLeftRight,
  Bot,
  Flame,
  LayoutGrid,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import {
  MarketChart,
  buildSyntheticSeries,
  klinesToChartPoints,
} from "@/components/charts/MarketChart";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import type { PageKey } from "@/components/layout/AppShell";
import { useApiResource } from "@/hooks/useApiResource";
import {
  DEMO_TICKER_FALLBACK,
  ION_MAINNET_BURN_SOURCE_PENDING,
  OFFICIAL_BSC_BURN_ADDRESS,
} from "@/lib/integrationConfig";
import {
  fetchBurnSummary,
  fetchIonKlines,
  fetchMarketTickers,
  fetchStakingSummary,
  formatIonAmount,
  type BurnSummary,
  type IonKlinesPayload,
  type MarketTicker,
  type StakingSummary,
} from "@/lib/ionApi";

type FeatureCard = {
  title: string;
  label: string;
  target: PageKey;
  icon: typeof Layers3;
  color: "cyan" | "magenta" | "gold";
};

type DashboardPageProps = {
  onNavigate: (page: PageKey) => void;
};

const featureCards: FeatureCard[] = [
  { title: "Pool", label: "Liquidity", target: "pool", icon: Layers3, color: "cyan" },
  { title: "Grid", label: "Spot strategies", target: "grid", icon: LayoutGrid, color: "magenta" },
  { title: "Bridge", label: "ION / BSC", target: "bridge", icon: ArrowLeftRight, color: "cyan" },
  { title: "Burn", label: "Dual-chain tracker", target: "burn", icon: Flame, color: "magenta" },
  { title: "ION ID", label: "KYC Pass", target: "domain", icon: ShieldCheck, color: "gold" },
  { title: "AI Market", label: "Signals & risk", target: "ai", icon: Bot, color: "cyan" },
];

const fallbackTickers: MarketTicker[] = DEMO_TICKER_FALLBACK.filter((row) => row.symbol === "ION");

const fallbackBurn: BurnSummary = {
  totalBurnedIon: "12845000",
  bscBurnedIon: "8245000",
  ionMainnetBurnedIon: "4600000",
  remainingSupplyIon: "987155000",
  bscBurnAddress: OFFICIAL_BSC_BURN_ADDRESS,
  ionBurnSource: ION_MAINNET_BURN_SOURCE_PENDING,
};

const fallbackStaking: StakingSummary = {
  totalStakedIon: "452000000",
  officialStakedIon: "398000000",
  dexStakedIon: "54000000",
  lpStakedUsd: "12800000",
  apr: { officialPct: 18.2, dexPct: 25.5, lpMiningPct: 31.8 },
};

export function DashboardPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const fetchTickers = useCallback(
    (signal: AbortSignal) => fetchMarketTickers(signal),
    [],
  );
  const fetchBurn = useCallback((signal: AbortSignal) => fetchBurnSummary(signal), []);
  const fetchStaking = useCallback(
    (signal: AbortSignal) => fetchStakingSummary(signal),
    [],
  );
  const fetchKlines = useCallback(
    (signal: AbortSignal) => fetchIonKlines(48, signal),
    [],
  );

  const tickers = useApiResource(fetchTickers, fallbackTickers, {
    isEmpty: (data) => data.length === 0,
  });
  const burn = useApiResource(fetchBurn, fallbackBurn);
  const staking = useApiResource(fetchStaking, fallbackStaking);
  const emptyKlines: IonKlinesPayload = { timeframe: "1h", candles: [], source: "pending" };
  const klines = useApiResource(fetchKlines, emptyKlines, { isEmpty: () => false });

  const ionTicker = useMemo(
    () => tickers.data.find((ticker) => ticker.symbol === "ION") ?? tickers.data[0],
    [tickers.data],
  );

  const chartPoints = useMemo(() => {
    if (klines.data.candles.length > 0) {
      return klinesToChartPoints(klines.data.candles);
    }
    if (!ionTicker) {
      return [];
    }
    return buildSyntheticSeries(ionTicker.priceUsd, ionTicker.change24hPct);
  }, [ionTicker, klines.data.candles]);

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
        klines={klines}
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
  klines,
  onNavigate,
}: {
  tickers: ReturnType<typeof useApiResource<MarketTicker[]>>;
  ionTicker: MarketTicker | undefined;
  chartPoints: ReturnType<typeof buildSyntheticSeries>;
  klines: ReturnType<typeof useApiResource<IonKlinesPayload>>;
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <NeonCard className="min-h-[28rem]" variant="cyan">
      <div className="flex h-full flex-col">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-cyan-200/70">
              Professional Trading Surface
            </p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
              swap.ion <span className="text-glow-magenta text-fuchsia-300">Galaxy</span>
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

        <DataSourceBadge meta={klines.meta ?? tickers.meta} testId="dashboard-chart-source" />

        <AsyncState
          emptyMessage="Market tickers are not available."
          error={tickers.error}
          onRetry={tickers.reload}
          state={tickers.state}
          testId="dashboard-chart"
        >
          {chartPoints.length > 0 ? (
            <MarketChart points={chartPoints} testId="dashboard-market-chart" />
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
  staking: ReturnType<typeof useApiResource<StakingSummary>>;
  burn: ReturnType<typeof useApiResource<BurnSummary>>;
  tvlLabel: string;
  burnProgress: number;
}) {
  return (
    <div className="grid gap-5">
      <NeonCard variant="cyan">
        <DataSourceBadge meta={staking.meta} testId="dashboard-tvl-source" />
        <AsyncState
          error={staking.error}
          onRetry={staking.reload}
          state={staking.state}
          testId="dashboard-tvl"
        >
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
        <AsyncState
          error={staking.error}
          onRetry={staking.reload}
          state={staking.state}
          testId="dashboard-apr"
        >
          <p className="text-sm text-cyan-100/55">APR</p>
          <p className="mt-1 text-3xl font-black" data-testid="dashboard-apr-value">
            {staking.data.apr.dexPct}%
          </p>
          <p className="mt-1 text-xs text-cyan-200">Dynamic DEX staking rate</p>
        </AsyncState>
      </NeonCard>

      <NeonCard variant="gold">
        <DataSourceBadge meta={burn.meta} testId="dashboard-burn-source" />
        <AsyncState
          error={burn.error}
          onRetry={burn.reload}
          state={burn.state}
          testId="dashboard-burn"
        >
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
