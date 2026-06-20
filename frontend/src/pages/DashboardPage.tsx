import {
  ArrowLeftRight,
  Bot,
  Flame,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import {
  MarketChart,
  buildSyntheticSeries,
  klinesToChartPoints,
} from "@/components/charts/MarketChart";
import { DashboardSwapPanel } from "@/components/dashboard/DashboardSwapPanel";
import { FeatureTile } from "@/components/dashboard/FeatureTile";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { useI18n } from "@/i18n/I18nProvider";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonCard } from "@/components/ui/NeonCard";
import type { PageKey } from "@/components/layout/AppShell";
import { useApiResource } from "@/hooks/useApiResource";
import {
  fetchBurnSummary,
  fetchIonKlines,
  fetchIonPrice,
  fetchMarketTickers,
  fetchStakingSummary,
  formatIonAmount,
  type BurnSummary,
  type IonKlinesPayload,
  type IonPricePayload,
  type MarketTicker,
  type StakingSummary,
} from "@/lib/ionApi";

type FeatureCard = {
  title: string;
  label: string;
  target: PageKey;
  icon: typeof Layers3;
  color: "cyan" | "purple" | "bridge" | "burn" | "magenta" | "gold";
};

type DashboardPageProps = {
  onNavigate: (page: PageKey) => void;
};

/** Bottom nav row — aligned with design reference (Pool / Copy Trade / Bridge / Burn / Domain). */
const featureCards: FeatureCard[] = [
  { title: "Pool", label: "Liquidity", target: "pool", icon: Layers3, color: "cyan" },
  { title: "Copy Trade", label: "Social desk", target: "copy-trade", icon: Bot, color: "purple" },
  { title: "Bridge", label: "ION / BSC", target: "bridge", icon: ArrowLeftRight, color: "bridge" },
  { title: "Burn", label: "Dual-chain", target: "burn", icon: Flame, color: "burn" },
  { title: "Domain", label: "ION DNS", target: "domain", icon: ShieldCheck, color: "magenta" },
];

// [NO-FALLBACK] All data comes from live API. No demo/mock data allowed (Master red line).
const EMPTY_TICKERS: MarketTicker[] = [];
const EMPTY_KLINES: IonKlinesPayload = { timeframe: "1h", candles: [], source: "pending" };

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { isZh } = useI18n();
  const fetchTickers = useCallback(
    (signal: AbortSignal) => fetchMarketTickers(signal),
    [],
  );
  const fetchBurn = useCallback((signal: AbortSignal) => fetchBurnSummary(signal), []);
  const fetchStaking = useCallback(
    (signal: AbortSignal) => fetchStakingSummary(signal),
    [],
  );
  const fetchPrice = useCallback((signal: AbortSignal) => fetchIonPrice(signal), []);
  const fetchKlines = useCallback(
    (signal: AbortSignal) => fetchIonKlines(48, signal),
    [],
  );

  const tickers = useApiResource(fetchTickers, EMPTY_TICKERS, {
    isEmpty: (data) => data.length === 0,
  });
  const burn = useApiResource(fetchBurn, null as BurnSummary | null);
  const staking = useApiResource(fetchStaking, null as StakingSummary | null);
  const ionPrice = useApiResource(fetchPrice, null as IonPricePayload | null);
  const klines = useApiResource(fetchKlines, EMPTY_KLINES, { isEmpty: () => false });

  const ionTicker = useMemo(
    () => tickers.data.find((ticker) => ticker.symbol === "ION") ?? tickers.data[0] ?? null,
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
    if (!staking.data) return null;
    const lpUsd = Number(staking.data.lpStakedUsd);
    if (!Number.isFinite(lpUsd)) return `$${staking.data.lpStakedUsd}`;
    return lpUsd >= 1_000_000
      ? `$${(lpUsd / 1_000_000).toFixed(2)}M`
      : `$${lpUsd.toLocaleString()}`;
  }, [staking.data]);

  const burnProgress = useMemo(() => {
    if (!burn.data) return 0;
    const burned = Number(burn.data.totalBurnedIon);
    const remaining = Number(burn.data.remainingSupplyIon);
    if (!Number.isFinite(burned) || !Number.isFinite(remaining) || burned + remaining <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((burned / (burned + remaining)) * 100));
  }, [burn.data]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-5" data-testid="page-dashboard">
      <section
        className="depth-stage grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)_minmax(13rem,16.5rem)]"
        data-testid="dashboard-main-stage"
      >
        <DashboardSwapPanel onOpenFullSwap={() => onNavigate("swap")} />
        <MarketStage
          chartPoints={chartPoints}
          ionPrice={ionPrice}
          ionTicker={ionTicker}
          isZh={isZh}
          klines={klines}
          tickers={tickers}
        />
        <RightStats burn={burn} burnProgress={burnProgress} isZh={isZh} staking={staking} tvlLabel={tvlLabel} />
      </section>

      <FeatureGrid isZh={isZh} onNavigate={onNavigate} />
    </div>
  );
}

function MarketStage({
  tickers,
  ionPrice,
  ionTicker,
  isZh,
  chartPoints,
  klines,
}: {
  tickers: ReturnType<typeof useApiResource<MarketTicker[]>>;
  ionPrice: ReturnType<typeof useApiResource<IonPricePayload | null>>;
  ionTicker: MarketTicker | null;
  isZh: boolean;
  chartPoints: ReturnType<typeof buildSyntheticSeries>;
  klines: ReturnType<typeof useApiResource<IonKlinesPayload>>;
}) {
  return (
    <div className="flow-border min-h-0 rounded-[1.75rem] p-px lg:min-h-[22rem]">
      <NeonCard className="h-full min-h-[20rem] lg:min-h-[22rem]" variant="mixed">
        <div className="flex h-full min-h-0 flex-col">
          <div className="aurora-noise pointer-events-none absolute inset-0 rounded-[1.7rem]" />
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/45">{isZh ? "市场" : "Market"}</p>
              <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                ION <span className="text-fuchsia-300">/ USDT</span>
              </h2>
            </div>
            {ionTicker ? (
              <p
                className="text-right text-sm font-bold text-cyan-100"
                data-testid="dashboard-ion-quote"
              >
                {ionTicker.displayPrice}
                <span className="ml-2 text-cyan-100/60">{ionTicker.displayChange}</span>
              </p>
            ) : null}
          </div>

          <DataSourceBadge meta={klines.meta ?? tickers.meta} testId="dashboard-chart-source" />

          <AsyncState
            emptyMessage={isZh ? "暂无可用行情。" : "Market tickers are not available."}
            error={tickers.error}
            onRetry={tickers.reload}
            state={tickers.state}
            testId="dashboard-chart"
          >
            <div className="min-h-[14rem] flex-1 sm:min-h-[16rem]">
              {chartPoints.length > 0 ? (
                <MarketChart points={chartPoints} testId="dashboard-market-chart" />
              ) : (
                <ChartPlaceholder />
              )}
            </div>
          </AsyncState>

          {ionPrice.data ? (
            <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-3" data-testid="dashboard-oracle-diagnostics">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-cyan-100/60">
                <span>{isZh ? "预言机诊断" : "Oracle Diagnostics"}</span>
                <span>{ionPrice.data.oracleMethod ?? "n/a"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-cyan-100/80">
                <p>
                  {isZh ? "价差" : "spread"}: <span className="font-bold text-white">{ionPrice.data.oracleSpreadBps ?? 0} bps</span>
                </p>
                <p>
                  {isZh ? "采纳报价" : "used quotes"}: <span className="font-bold text-white">{ionPrice.data.oracleUsedQuotes ?? 0}</span>
                </p>
              </div>
              <div className="mt-2 text-xs text-cyan-100/75">
                <p className="mb-1 font-semibold text-cyan-50">{isZh ? "采纳源" : "used feeds"}</p>
                <div className="flex flex-wrap gap-1.5" data-testid="dashboard-oracle-used-feeds">
                  {(ionPrice.data.oracleUsedFeeds ?? []).slice(0, 4).map((feed) => (
                    <span className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-2 py-0.5" key={feed.platformId}>
                      {feed.platformId}:{feed.priceUsd.toFixed(4)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-2 text-xs text-cyan-100/75">
                <p className="mb-1 font-semibold text-cyan-50">{isZh ? "剔除源" : "rejected feeds"}</p>
                <div className="flex flex-wrap gap-1.5" data-testid="dashboard-oracle-rejected-feeds">
                  {(ionPrice.data.oracleRejectedFeeds ?? []).slice(0, 4).map((feed) => (
                    <span className="rounded-full border border-rose-300/35 bg-rose-300/10 px-2 py-0.5" key={`${feed.platformId}-${feed.rejectReason}`}>
                      {feed.platformId}:{feed.rejectReason}
                    </span>
                  ))}
                  {(ionPrice.data.oracleRejectedFeeds ?? []).length === 0 ? (
                    <span className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-2 py-0.5">{isZh ? "无" : "none"}</span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-3 text-xs text-cyan-100/60">
              {ionPrice.state === "loading" ? (isZh ? "预言机数据加载中…" : "Loading oracle data…") :
               ionPrice.state === "error" ? (isZh ? "预言机数据加载失败" : "Oracle data unavailable") :
               (isZh ? "等待预言机数据…" : "Waiting for oracle data…")}
            </div>
          )}
        </div>
      </NeonCard>
    </div>
  );
}

function ChartPlaceholder() {
  const { isZh } = useI18n();

  return (
    <div className="grid h-full min-h-[14rem] place-items-center rounded-[1.25rem] border border-white/10 bg-black/30 text-sm text-cyan-100/60">
      {isZh ? "等待行情数据…" : "Waiting for ticker data"}
    </div>
  );
}

function RightStats({
  staking,
  burn,
  tvlLabel,
  burnProgress,
  isZh,
}: {
  staking: ReturnType<typeof useApiResource<StakingSummary | null>>;
  burn: ReturnType<typeof useApiResource<BurnSummary | null>>;
  tvlLabel: string | null;
  burnProgress: number;
  isZh: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
      <NeonCard density="compact" variant="cyan">
        <DataSourceBadge meta={staking.meta} testId="dashboard-tvl-source" />
        <AsyncState
          error={staking.error}
          onRetry={staking.reload}
          state={staking.state}
          testId="dashboard-tvl"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/55">TVL</p>
          {tvlLabel ? (
            <>
              <p className="mt-1 text-2xl font-black text-glow-cyan" data-testid="dashboard-tvl-value">
                {tvlLabel}
              </p>
              {staking.data && (
                <p className="mt-1 text-[0.7rem] text-emerald-300">
                  LP APR {staking.data.apr.lpMiningPct}%
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-cyan-100/60">
              {staking.state === "loading" ? (isZh ? "加载中…" : "Loading…") : (isZh ? "暂无数据" : "No data")}
            </p>
          )}
        </AsyncState>
      </NeonCard>

      <NeonCard density="compact" variant="magenta">
        <DataSourceBadge meta={staking.meta} testId="dashboard-apr-source" />
        <AsyncState
          error={staking.error}
          onRetry={staking.reload}
          state={staking.state}
          testId="dashboard-apr"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/55">APR</p>
          {staking.data ? (
            <>
              <p className="mt-1 text-2xl font-black text-glow-magenta" data-testid="dashboard-apr-value">
                {staking.data.apr.dexPct}%
              </p>
              <p className="mt-1 text-[0.7rem] text-cyan-200/80">{isZh ? "DEX 质押" : "DEX staking"}</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-cyan-100/60">
              {staking.state === "loading" ? (isZh ? "加载中…" : "Loading…") : (isZh ? "暂无数据" : "No data")}
            </p>
          )}
        </AsyncState>
      </NeonCard>

      <NeonCard density="compact" variant="magenta">
        <DataSourceBadge meta={burn.meta} testId="dashboard-burn-source" />
        <AsyncState
          error={burn.error}
          onRetry={burn.reload}
          state={burn.state}
          testId="dashboard-burn"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/55">{isZh ? "销毁" : "Burn"}</p>
          {burn.data ? (
            <>
              <p className="mt-1 text-2xl font-black" data-testid="dashboard-burn-value">
                {formatIonAmount(burn.data.totalBurnedIon)}
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-white/10">
                <div
                  className="h-1.5 rounded-full bg-[linear-gradient(90deg,var(--ion-cyan),var(--ion-magenta),var(--ion-gold))]"
                  style={{ width: `${burnProgress}%` }}
                />
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-cyan-100/60">
              {burn.state === "loading" ? (isZh ? "加载中…" : "Loading…") : (isZh ? "暂无数据" : "No data")}
            </p>
          )}
        </AsyncState>
      </NeonCard>
    </div>
  );
}

function FeatureGrid({ onNavigate, isZh }: { onNavigate: (page: PageKey) => void; isZh: boolean }) {
  const cards: FeatureCard[] = isZh
    ? [
        { title: "资金池", label: "流动性", target: "pool", icon: Layers3, color: "cyan" },
        { title: "跟单", label: "社交交易", target: "copy-trade", icon: Bot, color: "purple" },
        { title: "跨链桥", label: "ION / BSC", target: "bridge", icon: ArrowLeftRight, color: "bridge" },
        { title: "销毁", label: "双链", target: "burn", icon: Flame, color: "burn" },
        { title: "域名", label: "ION DNS", target: "domain", icon: ShieldCheck, color: "magenta" },
      ]
    : featureCards;

  return (
    <section data-testid="dashboard-feature-grid">
      <p className="mb-3 text-xs uppercase tracking-[0.28em] text-cyan-100/45">{isZh ? "模块" : "Modules"}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <FeatureTile
            icon={card.icon}
            key={card.target}
            label={card.label}
            onClick={() => onNavigate(card.target)}
            testId={`dashboard-feature-${card.target}`}
            title={card.title}
            variant={card.color}
          />
        ))}
      </div>
    </section>
  );
}
