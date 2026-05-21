import {
  ArrowDownUp,
  ArrowLeftRight,
  Bot,
  Flame,
  LayoutGrid,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PageKey } from "@/components/layout/AppShell";
import { fetchTradeQuote, type TradeQuote } from "@/lib/ionApi";
import { IonCandleChart } from "@/components/charts/IonCandleChart";
import { NeonButton } from "@/components/ui/NeonButton";
import { DataProvenanceBadge } from "@/components/ui/DataProvenanceBadge";
import { ChartFrame, GlassPanel, MetricTile } from "@/components/ui/glass";
import {
  depthToneClass,
  useMarketCandles,
  useMarketDepth,
  useMarketOrderBook,
  useSwapMarketStats,
} from "@/hooks/useMarketSurface";

type FeatureCard = {
  title: string;
  label: string;
  page: Exclude<PageKey, "swap">;
  icon: typeof Layers3;
  color: "cyan" | "magenta" | "gold";
};

type DashboardPageProps = {
  onNavigate: (page: PageKey) => void;
};

const featureCards: FeatureCard[] = [
  { title: "Pool", label: "Liquidity depth", page: "pool", icon: Layers3, color: "cyan" },
  { title: "Grid", label: "Spot strategies", page: "grid", icon: LayoutGrid, color: "magenta" },
  { title: "Bridge", label: "ION / BSC route", page: "bridge", icon: ArrowLeftRight, color: "cyan" },
  { title: "Burn", label: "Dual-chain supply", page: "burn", icon: Flame, color: "magenta" },
  { title: "ION ID", label: "Identity risk", page: "domain", icon: ShieldCheck, color: "gold" },
  { title: "AI Market", label: "Signals & risk", page: "ai", icon: Bot, color: "cyan" },
];

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[22rem_1fr_19rem]" data-testid="page-swap">
      <SwapPanel />
      <MarketStage />
      <RightStats />
      <div className="xl:col-span-3">
        <FeatureGrid onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function SwapPanel() {
  const [payAmount, setPayAmount] = useState("2.50");
  const [slippage, setSlippage] = useState("0.50");
  const [quote, setQuote] = useState<TradeQuote | null>(null);
  const [quoteState, setQuoteState] = useState<"loading" | "ready" | "error">("loading");

  const slippageBps = useMemo(() => {
    const slip = Number(slippage);
    return Number.isFinite(slip) ? Math.round(slip * 100) : Number.NaN;
  }, [payAmount, slippage]);

  const inputValid =
    Number.isFinite(Number(payAmount)) &&
    Number(payAmount) > 0 &&
    Number.isInteger(slippageBps) &&
    slippageBps >= 10 &&
    slippageBps <= 500;

  useEffect(() => {
    if (!inputValid) {
      setQuote(null);
      setQuoteState("error");
      return;
    }

    const controller = new AbortController();
    setQuoteState("loading");
    fetchTradeQuote(
      {
        inputToken: "BNB",
        outputToken: "ION",
        amountIn: payAmount,
        slippageBps,
      },
      controller.signal,
    )
      .then((response) => {
        setQuote(response.data);
        setQuoteState("ready");
      })
      .catch(() => {
        setQuote(null);
        setQuoteState("error");
      });

    return () => controller.abort();
  }, [inputValid, payAmount, slippageBps]);

  return (
    <GlassPanel
      className="depth-stage min-h-[31rem]"
      eyebrow="swap.ion"
      flowBorder
      testId="swap-panel"
      title="ION Chain Swap"
      action={<ArrowDownUp className="text-cyan-200" />}
    >
      <p className="-mt-2 mb-4 text-sm text-cyan-100/60">Native route for BNB / ION execution</p>

      <div className="flow-border mb-4 flex items-center justify-between rounded-3xl p-px">
        <div className="glass-surface flex w-full items-center justify-between rounded-3xl p-3">
          <TokenBadge symbol="BNB" accent="bg-yellow-300 text-black" />
          <ArrowDownUp className="text-cyan-200/60" size={18} />
          <TokenBadge
            symbol="ION"
            accent="bg-gradient-to-br from-yellow-200 to-amber-500 text-slate-950"
          />
        </div>
      </div>

      <div className="space-y-3">
        <AmountField label="Pay BNB" onChange={setPayAmount} testId="swap-pay" value={payAmount} />
        <Readout
          label="Receive ION"
          value={quoteState === "ready" && quote ? quote.estimatedOutput : "Calculating route"}
        />
        <AmountField label="Slippage %" onChange={setSlippage} testId="swap-slippage" value={slippage} />
      </div>

      <div className="mt-5 grid gap-2 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4 text-xs text-cyan-100/75 backdrop-blur-xl">
        <QuoteRow
          label="Minimum received"
          testId="swap-min-received"
          value={quoteState === "ready" && quote ? `${quote.minimumReceived} ION` : "Waiting for quote"}
        />
        <QuoteRow
          label="Protocol fee"
          testId="swap-protocol-fee"
          value={quoteState === "ready" && quote ? `${quote.protocolFee} ION (${quote.protocolFeeBps} bps)` : "Waiting for quote"}
        />
        <QuoteRow label="Price impact" value={quoteState === "ready" && quote ? `${quote.priceImpactBps} bps` : "Waiting for quote"} />
        <QuoteRow label="Precision" value={quoteState === "ready" && quote ? `${quote.precision.math} / ${quote.outputToken} ${quote.precision.outputDecimals}d` : "Waiting for quote"} />
        <QuoteRow label="Execution route" value={quoteState === "ready" && quote ? quote.route.join(" -> ") : "Waiting for quote"} />
      </div>

      {quoteState === "error" ? (
        <p className="mt-3 rounded-2xl border border-rose-300/25 bg-rose-300/[0.08] px-4 py-3 text-xs text-rose-100" data-testid="swap-quote-error">
          Quote unavailable. Check amount, slippage, and backend quote service.
        </p>
      ) : null}

      <NeonButton className="mt-5 w-full" data-testid="swap-submit" disabled={quoteState !== "ready" || !quote} type="button">
        Review ION Swap
      </NeonButton>
    </GlassPanel>
  );
}

function MarketStage() {
  const { rows, loadState: depthState, provenanceLabel: depthProv } = useMarketDepth();
  const { candles, loadState: candleState, provenanceLabel: candleProv } = useMarketCandles("BNB/ION", "15m");
  const { stats, loadState: statsState } = useSwapMarketStats("BNB/ION");

  const routeLabel =
    statsState === "ready" && stats
      ? `Route health: ${stats.routeHealth}`
      : statsState === "loading"
        ? "Route health: syncing"
        : "Route health: unavailable";

  return (
    <ChartFrame
      badge={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-2 text-xs font-bold text-emerald-100">
            {routeLabel}
          </span>
          {candleProv ? <DataProvenanceBadge label={candleProv} testId="swap-chart-provenance" /> : null}
        </div>
      }
      minHeightClass="min-h-[31rem]"
      subtitle="Galaxy market surface · lightweight-charts"
      testId="swap-market-stage"
      title="swap.ion"
    >
      <div className="relative min-h-[22rem] overflow-hidden rounded-[1.8rem] border border-cyan-200/20 bg-[#03050f]/70 shadow-[0_35px_90px_rgba(0,0,0,0.42)]">
        <div className="absolute inset-0 aurora-noise opacity-80" />
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_20deg,rgba(36,247,255,0.1),rgba(255,59,212,0.28),rgba(141,77,255,0.18),rgba(36,247,255,0.1))] blur-2xl [animation:ionSpinSlow_160s_linear_infinite]" />
        <div className="absolute inset-x-4 top-4 grid grid-cols-1 gap-3 sm:inset-x-8 sm:top-8 sm:grid-cols-3">
          {depthState === "loading" ? (
            <p className="col-span-full text-center text-xs text-cyan-100/55">Loading depth pairs…</p>
          ) : null}
          {depthState === "ready"
            ? rows.map((row) => (
                <div key={row.label} className="glass-surface rounded-2xl px-4 py-3">
                  <p className="text-xs text-cyan-100/55">{row.label}</p>
                  <p className="mt-1 text-xl font-black">{row.price}</p>
                  <p className={`text-xs font-bold ${depthToneClass(row.tone)}`}>{row.change}</p>
                </div>
              ))
            : null}
          {depthProv ? (
            <div className="col-span-full flex justify-end">
              <DataProvenanceBadge label={depthProv} testId="swap-depth-provenance" />
            </div>
          ) : null}
        </div>
        <div className="float-3d absolute bottom-8 left-5 right-5 h-48 rounded-[2rem] border border-fuchsia-300/20 bg-slate-950/55 p-4 shadow-[0_28px_80px_rgba(255,59,212,0.18)] backdrop-blur-2xl sm:left-8 sm:right-8">
          <IonCandleChart candles={candles} loadState={candleState} testId="swap-candle-chart" className="h-full min-h-[10rem]" />
        </div>
        <p className="absolute bottom-6 left-6 rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-2 text-xs font-bold text-emerald-100">
          Slippage guard active
        </p>
      </div>
    </ChartFrame>
  );
}

function RightStats() {
  const { stats, loadState: statsState, provenanceLabel: statsProv } = useSwapMarketStats("BNB/ION");
  const { book, loadState: bookState, provenanceLabel: bookProv } = useMarketOrderBook("BNB/ION");

  return (
    <div className="grid gap-5">
      <GlassPanel testId="swap-stat-liquidity" title="Native liquidity">
        <MetricTile
          label="TVL"
          tone="cyan"
          value={statsState === "ready" && stats ? stats.tvlUsd : "—"}
        />
        <p className="mt-2 text-xs text-emerald-300">
          {statsState === "ready" && stats ? stats.tvlChangePct : "Syncing liquidity…"}
        </p>
        {statsProv ? <DataProvenanceBadge className="mt-2" label={statsProv} testId="swap-stats-provenance" /> : null}
      </GlassPanel>
      <GlassPanel testId="swap-stat-protection" title="Swap protection">
        <MetricTile
          label="Price impact"
          tone="magenta"
          value={statsState === "ready" && stats ? stats.priceImpactLabel : "—"}
        />
        <p className="mt-2 text-xs text-cyan-200">current route impact</p>
      </GlassPanel>
      <GlassPanel eyebrow="Depth" testId="swap-orderbook" title="Order book">
        {bookState === "loading" ? (
          <p className="text-xs text-cyan-100/55">Loading order book…</p>
        ) : null}
        {bookState === "error" ? (
          <p className="text-xs text-rose-200">Order book unavailable</p>
        ) : null}
        <div className="grid gap-2 text-xs">
          {bookState === "ready" && book
            ? book.levels.map((row) => (
                <div
                  key={`${row.side}-${row.price}`}
                  className="relative overflow-hidden rounded-xl bg-white/[0.04] px-3 py-2"
                >
                  <span
                    className={`absolute inset-y-0 right-0 ${row.side === "ask" ? "bg-rose-300/[0.08]" : "bg-emerald-300/[0.08]"}`}
                    style={{ width: row.depth }}
                  />
                  <span className="relative flex justify-between gap-3">
                    <strong className={row.side === "ask" ? "text-rose-200" : "text-emerald-200"}>
                      {row.price}
                    </strong>
                    <span className="text-cyan-100/60">{row.amount}</span>
                  </span>
                </div>
              ))
            : null}
        </div>
        {bookProv ? <DataProvenanceBadge className="mt-2" label={bookProv} testId="swap-orderbook-provenance" /> : null}
      </GlassPanel>
    </div>
  );
}

function FeatureGrid({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" data-testid="swap-feature-grid">
      {featureCards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.title}
            className="group text-left"
            data-testid={`feature-${card.page}`}
            onClick={() => onNavigate(card.page)}
            type="button"
          >
            <GlassPanel className="min-h-[11rem] transition group-hover:-translate-y-1" flowBorder testId={`feature-card-${card.page}`}>
              <div className="flex h-full flex-col justify-between gap-5">
                <div className="float-3d grid h-14 w-14 place-items-center rounded-2xl border border-cyan-200/20 bg-white/[0.07] text-cyan-200 shadow-neonCyan">
                  <Icon size={28} />
                </div>
                <div>
                  <p className="text-2xl font-black">{card.title}</p>
                  <p className="text-sm text-cyan-100/55">{card.label}</p>
                </div>
              </div>
            </GlassPanel>
          </button>
        );
      })}
    </div>
  );
}

function TokenBadge({ symbol, accent }: { symbol: string; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-black ${accent}`}
      >
        {symbol.slice(0, 2)}
      </span>
      <span className="font-black">{symbol}</span>
    </div>
  );
}

function AmountField({
  label,
  onChange,
  testId,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  testId: string;
  value: string;
}) {
  return (
    <label className="glass-surface block rounded-2xl px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">
        {label}
      </span>
      <input
        className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none"
        data-testid={testId}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-surface rounded-2xl px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function QuoteRow({ label, testId, value }: { label: string; testId?: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4" data-testid={testId}>
      <span>{label}</span>
      <span className="font-black text-white">{value}</span>
    </div>
  );
}
