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
import { IonCandleChart } from "@/components/charts/IonCandleChart";
import { OrderBookPanel } from "@/components/market/OrderBookPanel";
import { SwapPanel } from "@/components/swap/SwapPanel";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { DataProvenanceBadge } from "@/components/ui/DataProvenanceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonGlassCard } from "@/components/ui/NeonGlassCard";
import type { PageKey } from "@/components/layout/AppShell";
import { useApiResource } from "@/hooks/useApiResource";
import { useDashboardMarket } from "@/hooks/useDashboardMarket";
import {
  fetchBurnSummary,
  fetchStakingSummary,
  formatIonAmount,
  type BurnSummary,
  type StakingSummary,
} from "@/lib/ionApi";
import { formatUsdCompact } from "@/lib/poolDeskData";

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

const emptyBurn: BurnSummary = {
  totalBurnedIon: "",
  bscBurnedIon: "",
  ionMainnetBurnedIon: "",
  remainingSupplyIon: "",
  bscBurnAddress: "",
  ionBurnSource: "",
};

const emptyStaking: StakingSummary = {
  totalStakedIon: "",
  officialStakedIon: "",
  dexStakedIon: "",
  lpStakedUsd: "",
  apr: { officialPct: null, dexPct: null, lpMiningPct: 0 },
};

export function DashboardPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const market = useDashboardMarket();

  const fetchBurn = useCallback((signal: AbortSignal) => fetchBurnSummary(signal), []);
  const fetchStaking = useCallback(
    (signal: AbortSignal) => fetchStakingSummary(signal),
    [],
  );

  const burn = useApiResource(fetchBurn, emptyBurn);
  const staking = useApiResource(fetchStaking, emptyStaking);

  const burnProgress = useMemo(() => {
    if (burn.state !== "ready") {
      return 0;
    }
    const burned = Number(burn.data.totalBurnedIon);
    const remaining = Number(burn.data.remainingSupplyIon);
    if (!Number.isFinite(burned) || !Number.isFinite(remaining) || burned + remaining <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((burned / (burned + remaining)) * 100));
  }, [burn.data.remainingSupplyIon, burn.data.totalBurnedIon, burn.state]);

  const tvlLabel = useMemo(() => {
    if (staking.state !== "ready") {
      return "—";
    }
    const lpUsd = Number(staking.data.lpStakedUsd);
    return formatUsdCompact(lpUsd);
  }, [staking.data.lpStakedUsd, staking.state]);

  return (
    <div className="grid gap-5" data-testid="page-dashboard">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0" data-testid="dashboard-swap-stage">
          <SwapPanel compact testIdPrefix="dashboard-swap" variant="cyan" />
        </div>
        <RightStats burn={burn} burnProgress={burnProgress} staking={staking} tvlLabel={tvlLabel} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <MarketStage market={market} onNavigate={onNavigate} />
        <OrderBookPanel
          listTestId="dashboard-orderbook"
          provenanceTestId="dashboard-orderbook-provenance"
          testId="dashboard-orderbook-panel"
        />
      </div>

      <FeatureGrid onNavigate={onNavigate} />
    </div>
  );
}

function MarketStage({
  market,
  onNavigate,
}: {
  market: ReturnType<typeof useDashboardMarket>;
  onNavigate: (page: PageKey) => void;
}) {
  const chartState =
    market.candleState === "loading"
      ? "loading"
      : market.candleState === "error"
        ? "error"
        : market.candles.length === 0
          ? "empty"
          : "ready";

  return (
    <NeonGlassCard className="min-h-[24rem]" testId="dashboard-market-stage">
      <div className="flex h-full flex-col">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-cyan-200/70">
              Professional Trading Surface
            </p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              Market <span className="text-glow-magenta text-fuchsia-300">BNB / ION</span>
            </h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Sparkles className="text-cyan-200" />
            <NeonButton
              className="px-4 py-2 text-xs"
              data-testid="dashboard-open-trade"
              onClick={() => onNavigate("trade")}
              type="button"
            >
              Open Trade
            </NeonButton>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <DataSourceBadge meta={market.tickers.meta} testId="dashboard-chart-source" />
          {market.quote.meta ? (
            <DataSourceBadge meta={market.quote.meta} testId="dashboard-quote-source" />
          ) : null}
          {market.candleProv ? (
            <DataProvenanceBadge label={market.candleProv} testId="dashboard-candles-provenance" />
          ) : null}
        </div>

        <AsyncState
          emptyMessage="Market candles are not available."
          error={market.tickers.error ?? (market.candleState === "error" ? "Candles unavailable" : null)}
          onRetry={() => {
            market.tickers.reload();
            market.quote.reload();
          }}
          state={chartState}
          testId="dashboard-chart"
        >
          {market.candles.length > 0 ? (
            <IonCandleChart
              candles={market.candles}
              className="h-[17.5rem]"
              loadState="ready"
              testId="dashboard-market-chart"
            />
          ) : (
            <ChartPlaceholder />
          )}
          {market.quoteLine ? (
            <p className="mt-3 text-sm text-cyan-100/75" data-testid="dashboard-ion-quote">
              {market.quoteLine.ticker}
              <br />
              <span className="text-cyan-100/60">{market.quoteLine.swap}</span>
            </p>
          ) : market.tickers.state === "loading" || market.quote.state === "loading" ? (
            <p className="mt-3 text-sm text-cyan-100/55">Loading market quote…</p>
          ) : null}
        </AsyncState>
      </div>
    </NeonGlassCard>
  );
}

function ChartPlaceholder() {
  return (
    <div className="grid h-[17.5rem] place-items-center rounded-[1.25rem] border border-white/10 bg-black/30 text-sm text-cyan-100/60">
      Waiting for market data
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
      <NeonGlassCard testId="dashboard-stat-tvl">
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
      </NeonGlassCard>

      <NeonGlassCard testId="dashboard-stat-apr">
        <DataSourceBadge meta={staking.meta} testId="dashboard-apr-source" />
        <AsyncState
          error={staking.error}
          onRetry={staking.reload}
          state={staking.state}
          testId="dashboard-apr"
        >
          <p className="text-sm text-cyan-100/55">APR</p>
          <p className="mt-1 text-3xl font-black" data-testid="dashboard-apr-value">
            {staking.data.apr.lpMiningPct}%
          </p>
          <p className="mt-1 text-xs text-cyan-200">LP mining APR (DEX draft stake APR not wired)</p>
        </AsyncState>
      </NeonGlassCard>

      <NeonGlassCard testId="dashboard-stat-burn">
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
              className="h-2 rounded-full bg-[linear-gradient(90deg,#00ffff,#ff00ff,#ffd166)]"
              style={{ width: `${burnProgress}%` }}
            />
          </div>
        </AsyncState>
      </NeonGlassCard>
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
            <NeonGlassCard
              className={`min-h-[11rem] transition hover:scale-[1.01] ${
                card.color === "magenta"
                  ? "drop-shadow-[0_0_32px_rgba(255,59,212,0.22)]"
                  : card.color === "gold"
                    ? "drop-shadow-[0_0_28px_rgba(255,209,102,0.2)]"
                    : ""
              }`}
              testId={`dashboard-feature-card-${card.target}`}
            >
              <div className="flex h-full flex-col justify-between">
                <div
                  className={`grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.07] shadow-neonCyan ${
                    card.color === "magenta"
                      ? "text-fuchsia-200"
                      : card.color === "gold"
                        ? "text-amber-200"
                        : "text-cyan-200"
                  }`}
                >
                  <Icon size={28} />
                </div>
                <div>
                  <p className="text-2xl font-black">{card.title}</p>
                  <p className="text-sm text-cyan-100/55">{card.label}</p>
                </div>
              </div>
            </NeonGlassCard>
          </button>
        );
      })}
    </div>
  );
}
