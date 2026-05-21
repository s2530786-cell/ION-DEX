import {
  ArrowLeftRight,
  BarChart3,
  Bot,
  Coins,
  Droplets,
  Flame,
  Globe2,
  LayoutGrid,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import type { PageKey } from "@/components/layout/AppShell";
import { IonCandleChart } from "@/components/charts/IonCandleChart";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { DataProvenanceBadge } from "@/components/ui/DataProvenanceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { BridgeTransferPanel } from "@/components/bridge/BridgeTransferPanel";
import { ChartFrame, GlassPanel, MetricTile, PageHero, RiskNotice, StatusPill } from "@/components/ui/glass";
import { useAiDeskData } from "@/hooks/useAiDeskData";
import { useBridgeDeskData } from "@/hooks/useBridgeDeskData";
import { useDomainDeskData } from "@/hooks/useDomainDeskData";
import { useBurnDeskData } from "@/hooks/useBurnDeskData";
import { usePoolDeskData } from "@/hooks/usePoolDeskData";
import { useApiResource, type ApiLoadState } from "@/hooks/useApiResource";
import { useMarketCandles, useMarketOrderBook, useSwapMarketStats } from "@/hooks/useMarketSurface";
import { formatUsdCompact } from "@/lib/poolDeskData";
import { fetchMarketTickers, type MarketTicker } from "@/lib/ionApi";
import {
  fetchBridgeRoutes,
  fetchBurnSummary,
  fetchDomainResolve,
  fetchStakingSummary,
  formatIonAmount,
  type ApiMeta,
  type BridgeRoutesPayload,
  type BurnSummary,
  type DomainResolution,
  type StakingSummary,
} from "@/lib/ionApi";

type BusinessPageConfig = {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof BarChart3;
  primaryAction: string;
  metrics: Array<{ label: string; value: string; tone: "cyan" | "magenta" | "gold" }>;
  checklist: string[];
};

export type BusinessPageKey = Exclude<PageKey, "swap" | "dashboard" | "pool" | "stake">;

const pageConfigs: Record<BusinessPageKey, BusinessPageConfig> = {
  trade: {
    eyebrow: "Professional Trading",
    title: "ION spot order desk",
    description:
      "Market and limit order desk for BNB / ION trading with order book, fee preview, and wallet signing surfaces.",
    icon: BarChart3,
    primaryAction: "Create Limit Order",
    metrics: [
      { label: "Pair", value: "BNB / ION", tone: "gold" },
      { label: "Order Types", value: "Market + Limit", tone: "cyan" },
      { label: "Fee Asset", value: "ION", tone: "magenta" },
    ],
    checklist: ["Order book panel", "Market depth chart", "ION fee quote", "Wallet-safe payload"],
  },
  grid: {
    eyebrow: "Strategy Automation",
    title: "On-chain spot grid",
    description:
      "Strategy desk for neutral, arithmetic, geometric, trailing, and stop-grid modes inspired by OKX Web3 flows.",
    icon: LayoutGrid,
    primaryAction: "Create Grid Strategy",
    metrics: [
      { label: "Strategies", value: "5 modes", tone: "cyan" },
      { label: "Risk Guard", value: "AI Sentinel", tone: "magenta" },
      { label: "Settlement", value: "ION fees", tone: "gold" },
    ],
    checklist: ["Grid bounds", "Take-profit / stop-loss", "Bot defense", "Strategy history"],
  },
  bridge: {
    eyebrow: "Cross-chain",
    title: "BSC <> ION bridge",
    description:
      "Bridge command surface for BSC vault deposits, ION-side release tracking, relayer health, and consistency checks.",
    icon: ArrowLeftRight,
    primaryAction: "Start Bridge",
    metrics: [
      { label: "Route", value: "BSC <> ION", tone: "cyan" },
      { label: "Relayers", value: "Multisig", tone: "gold" },
      { label: "Status", value: "Design", tone: "magenta" },
    ],
    checklist: ["Vault events", "Relayer quorum", "Replay protection", "Bridge audit trail"],
  },
  burn: {
    eyebrow: "Supply",
    title: "Dual-chain burn tracker",
    description:
      "Burn dashboard for BSC burn address, ION mainnet burn source, total burned, and remaining supply.",
    icon: Flame,
    primaryAction: "View Burn Chart",
    metrics: [
      { label: "BSC Burn", value: "dead sink", tone: "magenta" },
      { label: "ION Burn", value: "Official source", tone: "cyan" },
      { label: "Trend", value: "Hourly / Daily", tone: "gold" },
    ],
    checklist: ["BSC burn index", "ION burn source", "Trend charts", "Remaining supply"],
  },
  domain: {
    eyebrow: "ION DNS",
    title: "Domain trading and binding",
    description:
      "ION DNS surface based on official DNS FunC references and the community dns.ice.io ecosystem.",
    icon: Globe2,
    primaryAction: "Search Domain",
    metrics: [
      { label: "Source", value: "dns.ice.io", tone: "cyan" },
      { label: "Binding", value: "Wallet transfer", tone: "gold" },
      { label: "Contracts", value: "Official DNS refs", tone: "magenta" },
    ],
    checklist: ["Domain search API", "Wallet binding", "Domain transfer", "DNS contract review"],
  },
  ai: {
    eyebrow: "AI Signals",
    title: "On-chain AI market analyst",
    description:
      "AI analysis surface for market signals, anomaly detection, anti-bot scoring, and strategy risk alerts.",
    icon: Bot,
    primaryAction: "Run AI Analysis",
    metrics: [
      { label: "Signal", value: "Bullish 63%", tone: "cyan" },
      { label: "Risk", value: "Medium", tone: "magenta" },
      { label: "Sentinel", value: "Armed", tone: "gold" },
    ],
    checklist: ["Price prediction", "MEV alerts", "Anomaly detection", "Strategy recommendations"],
  },
};

const toneClass: Record<BusinessPageConfig["metrics"][number]["tone"], string> = {
  cyan: "text-cyan-200 shadow-neonCyan",
  magenta: "text-fuchsia-200 shadow-neonMagenta",
  gold: "text-amber-200 shadow-neonGold",
};

type MetricCard = { label: string; value: string; tone: "cyan" | "magenta" | "gold" };

function MetricsGrid({ metrics, sourceTestId, meta }: { metrics: MetricCard[]; sourceTestId: string; meta: ApiMeta | null }) {
  return (
    <>
      <DataSourceBadge meta={meta} testId={sourceTestId} />
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCardView key={metric.label} metric={metric} />
        ))}
      </div>
    </>
  );
}

function MetricCardView({ metric }: { metric: MetricCard }) {
  return (
    <div className={`rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4 ${toneClass[metric.tone]}`}>
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/45">{metric.label}</p>
      <p className="mt-2 text-2xl font-black text-white">{metric.value}</p>
    </div>
  );
}

const fallbackBurnSummary: BurnSummary = {
  totalBurnedIon: "12845000",
  bscBurnedIon: "8245000",
  ionMainnetBurnedIon: "4600000",
  remainingSupplyIon: "987155000",
  bscBurnAddress: "",
  ionBurnSource: "ion-mainnet-burn-source-placeholder",
};

const fallbackStakingSummary: StakingSummary = {
  totalStakedIon: "452000000",
  officialStakedIon: "398000000",
  dexStakedIon: "54000000",
  lpStakedUsd: "12800000",
  apr: { officialPct: 18.2, dexPct: 25.5, lpMiningPct: 31.8 },
};

const fallbackBridgePayload: BridgeRoutesPayload = {
  routes: [
    {
      routeId: "bsc-ion-ion",
      fromChain: "BSC",
      toChain: "ION",
      asset: "ION",
      status: "mock",
      minAmountIon: "10.000",
      maxAmountIon: "500000.000",
      estimatedMinutes: 12,
      confirmationsRequired: 15,
      safeguards: ["vault-limit", "relayer-threshold", "replay-protection", "manual-pause"],
    },
    {
      routeId: "ion-bsc-ion",
      fromChain: "ION",
      toChain: "BSC",
      asset: "ION",
      status: "design",
      minAmountIon: "10.000",
      maxAmountIon: "250000.000",
      estimatedMinutes: 18,
      confirmationsRequired: 8,
      safeguards: ["release-limit", "relayer-threshold", "proof-audit-log", "manual-pause"],
    },
  ],
  relayerStatus: "mocked",
  verifier: {
    threshold: "3-of-5 draft",
    replayProtection: true,
    proofStatus: "planned",
  },
};

const fallbackDomainCustodian: DomainResolution = {
  name: "custodian.ion",
  available: true,
  ownerAddress: null,
  resolvedAddress: null,
  expiresAt: null,
  records: [],
  marketplace: {
    listed: true,
    floorIon: "2500.000",
    lastSaleIon: null,
  },
  provenance: {
    source: "mock",
    note: "Offline fallback resolver preview.",
  },
};

function formatTitleCase(word: string) {
  if (!word) {
    return word;
  }
  return `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`;
}

function BurnMetricsRow() {
  const [summary, setSummary] = useState<BurnSummary>(fallbackBurnSummary);
  const [meta, setMeta] = useState<ApiMeta | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1200);

    fetchBurnSummary(controller.signal)
      .then((response) => {
        setSummary(response.data);
        setMeta(response.meta);
      })
      .catch(() => {
        setSummary(fallbackBurnSummary);
        setMeta(null);
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const metrics: MetricCard[] = [
    { label: "Total Burned", value: `${formatIonAmount(summary.totalBurnedIon)} ION`, tone: "gold" },
    { label: "BSC Burn", value: `${formatIonAmount(summary.bscBurnedIon)} ION`, tone: "magenta" },
    { label: "Remaining", value: `${formatIonAmount(summary.remainingSupplyIon)} ION`, tone: "cyan" },
  ];

  return <MetricsGrid meta={meta} metrics={metrics} sourceTestId="burn-metrics-source" />;
}

function StakeMetricsRow() {
  const [summary, setSummary] = useState<StakingSummary>(fallbackStakingSummary);
  const [meta, setMeta] = useState<ApiMeta | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1200);

    fetchStakingSummary(controller.signal)
      .then((response) => {
        setSummary(response.data);
        setMeta(response.meta);
      })
      .catch(() => {
        setSummary(fallbackStakingSummary);
        setMeta(null);
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const metrics: MetricCard[] = [
    { label: "DEX APR", value: `${summary.apr.dexPct}%`, tone: "gold" },
    { label: "Official Stake", value: `${formatIonAmount(summary.officialStakedIon)} ION`, tone: "cyan" },
    { label: "DEX Stake", value: `${formatIonAmount(summary.dexStakedIon)} ION`, tone: "magenta" },
  ];

  return <MetricsGrid meta={meta} metrics={metrics} sourceTestId="stake-metrics-source" />;
}

function BridgeMetricsRow() {
  const [payload, setPayload] = useState<BridgeRoutesPayload>(fallbackBridgePayload);
  const [meta, setMeta] = useState<ApiMeta | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1200);

    fetchBridgeRoutes(controller.signal)
      .then((response) => {
        setPayload(response.data);
        setMeta(response.meta);
      })
      .catch(() => {
        setPayload(fallbackBridgePayload);
        setMeta(null);
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const primary = payload.routes[0];
  const primaryLeg = primary ? `${primary.fromChain} → ${primary.toChain}` : "—";
  const metrics: MetricCard[] = [
    { label: "Primary Route", value: primaryLeg, tone: "cyan" },
    { label: "Relayers", value: formatTitleCase(payload.relayerStatus), tone: "gold" },
    { label: "Verifier", value: payload.verifier.threshold, tone: "magenta" },
  ];

  return <MetricsGrid meta={meta} metrics={metrics} sourceTestId="bridge-metrics-source" />;
}

function DomainMetricsRow() {
  const previewName = "custodian.ion";
  const [resolution, setResolution] = useState<DomainResolution>(fallbackDomainCustodian);
  const [meta, setMeta] = useState<ApiMeta | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1200);

    fetchDomainResolve(previewName, controller.signal)
      .then((response) => {
        setResolution(response.data);
        setMeta(response.meta);
      })
      .catch(() => {
        setResolution(fallbackDomainCustodian);
        setMeta(null);
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const listingLabel = resolution.available ? "On market" : "Registered";
  const metrics: MetricCard[] = [
    { label: "Resolver Preview", value: resolution.name, tone: "cyan" },
    { label: "Registry", value: listingLabel, tone: "gold" },
    { label: "Floor (mock)", value: `${resolution.marketplace.floorIon} ION`, tone: "magenta" },
  ];

  return <MetricsGrid meta={meta} metrics={metrics} sourceTestId="domain-metrics-source" />;
}

function toPositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function FormField({
  hint,
  label,
  testId,
  value,
  onChange,
  type = "text",
}: {
  hint: string;
  label: string;
  testId: string;
  value: string;
  onChange: (value: string) => void;
  type?: "number" | "text";
}) {
  return (
    <label className="glass-surface block rounded-2xl px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">
        {label}
      </span>
      <input
        className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none"
        data-testid={testId}
        inputMode={type === "number" ? "decimal" : undefined}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
      <span className="mt-1 block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-cyan-100/30">
        {hint}
      </span>
    </label>
  );
}

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  testId,
}: {
  label: string;
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
  testId: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2" data-testid={testId}>
      <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            className={`rounded-xl px-3 py-2 text-sm font-black transition ${
              value === option.value
                ? "bg-cyan-300/20 text-cyan-100 shadow-neonCyan"
                : "bg-white/[0.04] text-cyan-100/55 hover:bg-white/[0.08]"
            }`}
            data-testid={`${testId}-${option.value}`}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TradeOrderPanel() {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [submitted, setSubmitted] = useState(false);

  const validation = useMemo(() => {
    const parsedAmount = toPositiveNumber(amount);
    const parsedPrice = orderType === "market" ? 6.02 : toPositiveNumber(price);
    const parsedSlippage = toPositiveNumber(slippage);
    const slippageValid = parsedSlippage !== null && parsedSlippage >= 0.1 && parsedSlippage <= 5;

    return {
      isValid: parsedAmount !== null && parsedPrice !== null && slippageValid,
      notional: parsedAmount !== null && parsedPrice !== null ? parsedAmount * parsedPrice : 0,
      parsedAmount,
      parsedPrice,
      slippageValid,
    };
  }, [amount, orderType, price, slippage]);

  function submitTrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validation.isValid) {
      setSubmitted(true);
    }
  }

  return (
    <form className="grid gap-4" data-testid="trade-form" onSubmit={submitTrade}>
      <div className="grid gap-3 md:grid-cols-2">
        <SegmentedControl
          label="Side"
          onChange={setSide}
          options={[
            { label: "Buy ION", value: "buy" },
            { label: "Sell ION", value: "sell" },
          ]}
          testId="trade-side"
          value={side}
        />
        <SegmentedControl
          label="Order"
          onChange={setOrderType}
          options={[
            { label: "Limit", value: "limit" },
            { label: "Market", value: "market" },
          ]}
          testId="trade-order-type"
          value={orderType}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <FormField
          label="Amount ION"
          onChange={(value) => {
            setAmount(value);
            setSubmitted(false);
          }}
          hint="Example 1250"
          testId="trade-amount"
          type="number"
          value={amount}
        />
        <FormField
          label={orderType === "market" ? "Market price" : "Limit price"}
          onChange={(value) => {
            setPrice(value);
            setSubmitted(false);
          }}
          hint={orderType === "market" ? "Market reference 6.02" : "Limit reference 6.00"}
          testId="trade-price"
          type="number"
          value={orderType === "market" ? "" : price}
        />
        <FormField
          label="Slippage %"
          onChange={(value) => {
            setSlippage(value);
            setSubmitted(false);
          }}
          hint="Allowed 0.1 to 5"
          testId="trade-slippage"
          type="number"
          value={slippage}
        />
      </div>

      {!validation.slippageValid ? (
        <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100" data-testid="trade-error">
          Slippage must stay between 0.1% and 5% for wallet-safe execution.
        </p>
      ) : null}

      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4 text-sm text-cyan-100/75" data-testid="trade-preview">
        {validation.isValid ? (
          <span>
            {side === "buy" ? "Buying" : "Selling"} {validation.parsedAmount?.toLocaleString()} ION via {orderType} order. Estimated notional: ${validation.notional.toLocaleString(undefined, { maximumFractionDigits: 2 })}.
          </span>
        ) : (
          <span>Enter amount, price, and slippage to preview the wallet-safe order payload.</span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="trade-submit" disabled={!validation.isValid} type="submit">
        Create Limit Order
      </NeonButton>

      {submitted ? (
        <p className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100" data-testid="trade-confirmation">
          Order review ready for wallet signing. Final contract call is gated behind wallet integration.
        </p>
      ) : null}
    </form>
  );
}

function GridStrategyPanel() {
  const [mode, setMode] = useState<"arithmetic" | "geometric">("arithmetic");
  const [lowerPrice, setLowerPrice] = useState("");
  const [upperPrice, setUpperPrice] = useState("");
  const [gridCount, setGridCount] = useState("20");
  const [investment, setInvestment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const validation = useMemo(() => {
    const lower = toPositiveNumber(lowerPrice);
    const upper = toPositiveNumber(upperPrice);
    const grids = Number(gridCount);
    const parsedInvestment = toPositiveNumber(investment);
    const gridValid = Number.isInteger(grids) && grids >= 2 && grids <= 100;
    const boundsValid = lower !== null && upper !== null && upper > lower;
    const step = boundsValid && gridValid ? (upper - lower) / grids : 0;

    return {
      boundsValid,
      gridValid,
      isValid: boundsValid && gridValid && parsedInvestment !== null,
      lower,
      parsedInvestment,
      step,
      upper,
    };
  }, [gridCount, investment, lowerPrice, upperPrice]);

  function submitGrid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validation.isValid) {
      setSubmitted(true);
    }
  }

  return (
    <form className="grid gap-4" data-testid="grid-form" onSubmit={submitGrid}>
      <SegmentedControl
        label="Grid Mode"
        onChange={setMode}
        options={[
          { label: "Arithmetic", value: "arithmetic" },
          { label: "Geometric", value: "geometric" },
        ]}
        testId="grid-mode"
        value={mode}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <FormField
          label="Lower"
          onChange={(value) => {
            setLowerPrice(value);
            setSubmitted(false);
          }}
          hint="Lower range reference 5.20"
          testId="grid-lower"
          type="number"
          value={lowerPrice}
        />
        <FormField
          label="Upper"
          onChange={(value) => {
            setUpperPrice(value);
            setSubmitted(false);
          }}
          hint="Upper range reference 7.40"
          testId="grid-upper"
          type="number"
          value={upperPrice}
        />
        <FormField
          label="Grids"
          onChange={(value) => {
            setGridCount(value);
            setSubmitted(false);
          }}
          hint="Allowed 2 to 100"
          testId="grid-count"
          type="number"
          value={gridCount}
        />
        <FormField
          label="Investment USDT"
          onChange={(value) => {
            setInvestment(value);
            setSubmitted(false);
          }}
          hint="Strategy capital reference 2500"
          testId="grid-investment"
          type="number"
          value={investment}
        />
      </div>

      {!validation.boundsValid && lowerPrice && upperPrice ? (
        <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100" data-testid="grid-error">
          Upper price must be greater than lower price before the strategy can be armed.
        </p>
      ) : null}

      <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/[0.05] p-4 text-sm text-fuchsia-100/75" data-testid="grid-preview">
        {validation.isValid ? (
          <span>
            {mode} grid from ${validation.lower?.toLocaleString()} to ${validation.upper?.toLocaleString()} with {gridCount} levels. Approx step: ${validation.step.toLocaleString(undefined, { maximumFractionDigits: 4 })}.
          </span>
        ) : (
          <span>Set bounds, grid count, and investment to preview AI Sentinel guarded strategy parameters.</span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="grid-submit" disabled={!validation.isValid} type="submit">
        Create Grid Strategy
      </NeonButton>

      {submitted ? (
        <p className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100" data-testid="grid-confirmation">
          Strategy review ready. AI Sentinel checks and wallet execution stay gated for contract integration.
        </p>
      ) : null}
    </form>
  );
}

const DEX_ADVERTISED_APR_PERCENT = 25.5;

function PoolLiquidityPanel() {
  const [bnbAmount, setBnbAmount] = useState("");
  const [ionAmount, setIonAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [submitted, setSubmitted] = useState(false);

  const validation = useMemo(() => {
    const parsedBnb = toPositiveNumber(bnbAmount);
    const parsedIon = toPositiveNumber(ionAmount);
    const parsedSlippage = toPositiveNumber(slippage);
    const slippageValid = parsedSlippage !== null && parsedSlippage >= 0.1 && parsedSlippage <= 5;
    const ratio =
      parsedBnb !== null && parsedIon !== null && parsedIon > 0 ? parsedBnb / parsedIon : null;

    return {
      isValid: parsedBnb !== null && parsedIon !== null && slippageValid,
      parsedBnb,
      parsedIon,
      ratio,
      slippageValid,
    };
  }, [bnbAmount, ionAmount, slippage]);

  function submitPool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validation.isValid) {
      setSubmitted(true);
    }
  }

  return (
    <form className="grid gap-4" data-testid="pool-form" onSubmit={submitPool}>
      <div className="grid gap-3 md:grid-cols-3">
        <FormField
          label="Deposit BNB"
          onChange={(value) => {
            setBnbAmount(value);
            setSubmitted(false);
          }}
          hint="BNB side amount"
          testId="pool-bnb"
          type="number"
          value={bnbAmount}
        />
        <FormField
          label="Deposit ION"
          onChange={(value) => {
            setIonAmount(value);
            setSubmitted(false);
          }}
          hint="ION side amount"
          testId="pool-ion"
          type="number"
          value={ionAmount}
        />
        <FormField
          label="Slippage %"
          onChange={(value) => {
            setSlippage(value);
            setSubmitted(false);
          }}
          hint="Allowed 0.1 to 5"
          testId="pool-slippage"
          type="number"
          value={slippage}
        />
      </div>

      {!validation.slippageValid ? (
        <p
          className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100"
          data-testid="pool-error"
        >
          Slippage must stay between 0.1% and 5% before minting LP shares on-chain.
        </p>
      ) : null}

      <div
        className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4 text-sm text-cyan-100/75"
        data-testid="pool-preview"
      >
        {validation.isValid ? (
          <span>
            Liquidity preview: {bnbAmount} BNB + {ionAmount} ION · ratio{" "}
            {validation.ratio !== null
              ? validation.ratio.toFixed(6)
              : "—"}{" "}
            BNB per ION · max slip {slippage}%
          </span>
        ) : (
          <span>
            Enter paired deposits and slippage to preview wallet-safe mint parameters for BNB / ION.
          </span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="pool-submit" disabled={!validation.isValid} type="submit">
        Add Liquidity
      </NeonButton>

      {submitted ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
          data-testid="pool-confirmation"
        >
          Liquidity review ready for wallet signing. Mint and LP oracle hooks stay gated behind contract integration.
        </p>
      ) : null}
    </form>
  );
}

function StakeHubPanel() {
  const [mode, setMode] = useState<"stake" | "unstake">("stake");
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const validation = useMemo(() => {
    const parsedAmount = toPositiveNumber(amount);
    return {
      isValid: parsedAmount !== null,
      parsedAmount,
    };
  }, [amount]);

  function submitStake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validation.isValid) {
      setSubmitted(true);
    }
  }

  return (
    <form className="grid gap-4" data-testid="stake-form" onSubmit={submitStake}>
      <SegmentedControl
        label="Action"
        onChange={(next) => {
          setMode(next);
          setSubmitted(false);
        }}
        options={[
          { label: "Stake ION", value: "stake" },
          { label: "Unstake ION", value: "unstake" },
        ]}
        testId="stake-mode"
        value={mode}
      />

      <FormField
        label="Amount ION"
        onChange={(value) => {
          setAmount(value);
          setSubmitted(false);
        }}
        hint="Stake amount reference 500"
        testId="stake-amount"
        type="number"
        value={amount}
      />

      <div
        className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] p-4 text-sm text-amber-100/85"
        data-testid="stake-preview"
      >
        {validation.isValid ? (
          <span>
            {mode === "stake" ? "Stake" : "Unstake"} preview: {amount} ION · advertised DEX APR{" "}
            {DEX_ADVERTISED_APR_PERCENT}% · vesting and unstake queue enforced by contracts later.
          </span>
        ) : (
          <span>
            Enter an amount to preview treasury-safe staking payloads and APR assumptions from the hub metrics card.
          </span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="stake-submit" disabled={!validation.isValid} type="submit">
        {mode === "stake" ? "Stake ION" : "Unstake ION"}
      </NeonButton>

      {submitted ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
          data-testid="stake-confirmation"
        >
          {mode === "stake"
            ? "Stake review ready for wallet signing. Reward streams stay gated behind staking contract wiring."
            : "Unstake review ready for wallet signing. Cooldown rules stay gated behind staking contract wiring."}
        </p>
      ) : null}
    </form>
  );
}

function isDomainLikeLabel(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length < 3 || trimmed.length > 253 || !trimmed.includes(".")) {
    return false;
  }
  if (trimmed.startsWith(".") || trimmed.endsWith(".") || trimmed.includes("..")) {
    return false;
  }
  return /^[a-z0-9.-]+$/.test(trimmed);
}

function BurnAnalyticsPanel() {
  const [chain, setChain] = useState<"bsc" | "ion">("bsc");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const validation = useMemo(() => {
    const parsedAmount = toPositiveNumber(amount);
    const memoLen = memo.length;
    const memoValid = memoLen <= 120;
    return {
      isValid: parsedAmount !== null && memoValid,
      memoValid,
      parsedAmount,
    };
  }, [amount, memo]);

  function submitBurn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validation.isValid) {
      setSubmitted(true);
    }
  }

  return (
    <form className="grid gap-4" data-testid="burn-form" onSubmit={submitBurn}>
      <SegmentedControl
        label="Chain Lens"
        onChange={(next) => {
          setChain(next);
          setSubmitted(false);
        }}
        options={[
          { label: "BSC burn ledger", value: "bsc" },
          { label: "ION burn ledger", value: "ion" },
        ]}
        testId="burn-chain"
        value={chain}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <FormField
          label="Observed burn (ION)"
          onChange={(value) => {
            setAmount(value);
            setSubmitted(false);
          }}
          hint="Burn amount reference 125000"
          testId="burn-amount"
          type="number"
          value={amount}
        />
        <FormField
          label="Attestation memo"
          onChange={(value) => {
            setMemo(value);
            setSubmitted(false);
          }}
          hint="Audit note for treasury review"
          testId="burn-memo"
          type="text"
          value={memo}
        />
      </div>

      {!validation.memoValid ? (
        <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100" data-testid="burn-error">
          Memo must stay ≤ 120 chars for sentinel-safe logging overlays.
        </p>
      ) : null}

      <div
        className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-4 text-sm text-amber-100/80"
        data-testid="burn-preview"
      >
        {validation.isValid ? (
          <span>
            Burn preview: {validation.parsedAmount?.toLocaleString()} ION on {chain.toUpperCase()} · dual-chain indexer will reconcile treasury splits once workers land.
          </span>
        ) : (
          <span>Provide a tracked burn magnitude plus optional memo hooks for treasury transparency rails.</span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="burn-submit" disabled={!validation.isValid} type="submit">
        Review Burn Narrative
      </NeonButton>

      {submitted ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
          data-testid="burn-confirmation"
        >
          Burn analytics review ready for dual-chain sentinel playback. No on-chain transaction is sent from this page.
        </p>
      ) : null}
    </form>
  );
}

function DomainTradingPanel() {
  const [mode, setMode] = useState<"search" | "bind">("search");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const validation = useMemo(() => {
    const labelValid = isDomainLikeLabel(query);
    return {
      isValid: labelValid,
      labelValid,
    };
  }, [query]);

  function submitDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validation.isValid) {
      setSubmitted(true);
    }
  }

  return (
    <form className="grid gap-4" data-testid="domain-form" onSubmit={submitDomain}>
      <SegmentedControl
        label="Flow"
        onChange={(next) => {
          setMode(next);
          setSubmitted(false);
        }}
        options={[
          { label: "Search label", value: "search" },
          { label: "Bind alias", value: "bind" },
        ]}
        testId="domain-mode"
        value={mode}
      />

      <FormField
        label="DNS / .ion label"
        onChange={(value) => {
          setQuery(value);
          setSubmitted(false);
        }}
        hint="Domain reference custodian.ion"
        testId="domain-query"
        type="text"
        value={query}
      />

      {query.trim().length > 0 && !validation.labelValid ? (
        <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100" data-testid="domain-error">
          Enter a lowercase label with dotted segments (dns.ice.io compatible) before_FUN wiring.
        </p>
      ) : null}

      <div
        className="rounded-2xl border border-indigo-300/25 bg-indigo-400/[0.07] p-4 text-sm text-indigo-100/80"
        data-testid="domain-preview"
      >
        {validation.isValid ? (
          <span>
            Domain preview: {mode === "search" ? "Lookup" : "Bind"}{" "}
            <span className="font-mono text-white">{query.trim().toLowerCase()}</span> using official DNS FunC schemas + wallet-signed
            payloads for wallet review.
          </span>
        ) : (
          <span>Use dns.ice.io compatible labels to rehearsal wallet proofs without touching validators.</span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="domain-submit" disabled={!validation.isValid} type="submit">
        Compose DNS Payload
      </NeonButton>

      {submitted ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
          data-testid="domain-confirmation"
        >
          Domain handshake ready. Resolver transactions stay blocked until DNS contracts are reachable from this wallet.
        </p>
      ) : null}
    </form>
  );
}

function AIMarketPanel() {
  const [symbol, setSymbol] = useState("ION");
  const [horizon, setHorizon] = useState<"1h" | "4h" | "1d">("4h");
  const [depth, setDepth] = useState<"quick" | "standard" | "deep">("standard");
  const [submitted, setSubmitted] = useState(false);

  const validation = useMemo(() => {
    const ticker = symbol.trim().toUpperCase();
    const len = ticker.length;
    const tickerValid = len >= 2 && len <= 12 && /^[A-Z0-9]+$/.test(ticker);
    return {
      confidence: horizon === "1h" ? 58 : horizon === "4h" ? 63 : 71,
      isValid: tickerValid,
      ticker,
      tickerValid,
    };
  }, [horizon, symbol]);

  function submitAi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validation.isValid) {
      setSubmitted(true);
    }
  }

  return (
    <form className="grid gap-4" data-testid="ai-form" onSubmit={submitAi}>
      <FormField
        label="Symbol"
        onChange={(value) => {
          setSymbol(value);
          setSubmitted(false);
        }}
        hint="Ticker reference ION"
        testId="ai-symbol"
        type="text"
        value={symbol}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <SegmentedControl
          label="Horizon"
          onChange={(next) => {
            setHorizon(next);
            setSubmitted(false);
          }}
          options={[
            { label: "Pulse 1h", value: "1h" },
            { label: "Core 4h", value: "4h" },
            { label: "Macro 1d", value: "1d" },
          ]}
          testId="ai-horizon"
          value={horizon}
        />
        <SegmentedControl
          label="Depth"
          onChange={(next) => {
            setDepth(next);
            setSubmitted(false);
          }}
          options={[
            { label: "Quick", value: "quick" },
            { label: "Standard", value: "standard" },
            { label: "Deep", value: "deep" },
          ]}
          testId="ai-depth"
          value={depth}
        />
      </div>

      {symbol.trim().length > 0 && !validation.tickerValid ? (
        <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100" data-testid="ai-error">
          Symbol must be 2–12 alphanumeric characters before AI Sentinel merges on-chain tapes.
        </p>
      ) : null}

      <div
        className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.07] p-4 text-sm text-emerald-100/80"
        data-testid="ai-preview"
      >
        {validation.isValid ? (
          <span>
            AI preview: model confidence {validation.confidence}% on {validation.ticker} ({horizon}, {depth} scan). Uses offline heuristics only—streaming inference lands with ai-market-service.
          </span>
        ) : (
          <span>Set a ticker to preview offline AI Sentinel overlays for risk desks and treasury alerts.</span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="ai-submit" disabled={!validation.isValid} type="submit">
        Stage AI Brief
      </NeonButton>

      {submitted ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
          data-testid="ai-confirmation"
        >
          AI Sentinel brief ready for human review. No outbound model calls are fired from this page.
        </p>
      ) : null}
    </form>
  );
}

function TradeDeskPage() {
  const config = pageConfigs.trade;
  const { stats, loadState: statsState, provenanceLabel: statsProv } = useSwapMarketStats("BNB/ION");
  const { candles, loadState: candleState, provenanceLabel: candleProv } = useMarketCandles("BNB/ION", "15m");

  const heroMetrics = [
    {
      label: "Last price",
      value: statsState === "ready" && stats ? stats.lastPrice : "—",
      tone: "gold" as const,
      testId: "trade-metric-last-price",
    },
    {
      label: "24h volume",
      value: statsState === "ready" && stats ? stats.volume24h : "—",
      tone: "cyan" as const,
      testId: "trade-metric-24h-volume",
    },
    {
      label: "Spread",
      value: statsState === "ready" && stats ? stats.spreadPct : "—",
      tone: "magenta" as const,
      testId: "trade-metric-spread",
    },
    {
      label: "ION fee",
      value: statsState === "ready" && stats ? stats.ionFeePct : "—",
      tone: "gold" as const,
      testId: "trade-metric-ion-fee",
    },
  ];

  return (
    <div className="grid gap-5" data-testid="page-trade">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={heroMetrics}
        metricsState={statsState === "ready" ? "ready" : statsState === "error" ? "error" : "loading"}
        testId="trade-page-hero"
        title={config.title}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        <div className="grid gap-5">
          <ChartFrame
            badge={
              <div className="flex flex-wrap items-center justify-end gap-2">
                <StatusPill label="TWAP guard active" testId="trade-twap-guard" tone="emerald" />
                {candleProv ? <DataProvenanceBadge label={candleProv} testId="trade-chart-provenance" /> : null}
              </div>
            }
            minHeightClass="min-h-[28rem]"
            subtitle={statsState === "ready" && stats ? stats.lastPrice : "BNB / ION"}
            testId="trade-chart"
            title="BNB / ION"
          >
            <div className="relative float-3d h-72 rounded-[1.6rem] border border-cyan-200/15 bg-[#03050f]/62 p-4 shadow-[0_35px_90px_rgba(36,247,255,0.13)]">
              <IonCandleChart candles={candles} loadState={candleState} testId="trade-candle-chart" className="h-full" />
            </div>
            {statsProv ? <DataProvenanceBadge className="mt-2" label={statsProv} testId="trade-stats-provenance" /> : null}
          </ChartFrame>

          <div className="grid gap-5 lg:grid-cols-2">
            <MarketTape />
            <OrderHistoryPanel />
          </div>
        </div>

        <div className="grid gap-5">
          <GlassPanel eyebrow="Order entry" flowBorder testId="trade-limit-order" title="Limit order">
            <TradeOrderPanel />
          </GlassPanel>
          <OrderBookPanel />
        </div>
      </div>
    </div>
  );
}

function OrderBookPanel() {
  const { book, loadState, provenanceLabel } = useMarketOrderBook("BNB/ION");

  return (
    <GlassPanel eyebrow="Depth" testId="trade-orderbook-panel" title="Order book">
      {loadState === "loading" ? <p className="text-xs text-cyan-100/55">Loading order book…</p> : null}
      {loadState === "error" ? <p className="text-xs text-rose-200">Order book unavailable</p> : null}
      <div className="grid gap-2" data-testid="trade-orderbook">
        {loadState === "ready" && book
          ? book.levels.map((row) => (
              <div key={`${row.side}-${row.price}`} className="relative overflow-hidden rounded-2xl bg-white/[0.04] px-4 py-3">
                <span
                  className={`absolute inset-y-0 right-0 ${row.side === "ask" ? "bg-rose-300/[0.08]" : "bg-emerald-300/[0.08]"}`}
                  style={{ width: row.depth }}
                />
                <span className="relative grid grid-cols-3 gap-2 text-sm">
                  <strong className={row.side === "ask" ? "text-rose-200" : "text-emerald-200"}>{row.price}</strong>
                  <span className="text-cyan-100/70">{row.amount}</span>
                  <span className="text-right text-cyan-100/45">{row.depth}</span>
                </span>
              </div>
            ))
          : null}
      </div>
      {provenanceLabel ? <DataProvenanceBadge className="mt-2" label={provenanceLabel} testId="trade-orderbook-provenance" /> : null}
    </GlassPanel>
  );
}

function MarketTape() {
  return (
    <NeonCard variant="cyan">
      <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">Market trades</p>
      <div className="mt-4 grid gap-3" data-testid="trade-market-trades">
        {marketTrades.map(([price, amount, side]) => (
          <div key={`${price}-${amount}`} className="glass-surface grid grid-cols-3 rounded-2xl px-4 py-3 text-sm">
            <span className={side === "Buy" ? "font-black text-emerald-200" : "font-black text-rose-200"}>{price}</span>
            <span className="text-cyan-100/70">{amount}</span>
            <span className="text-right text-cyan-100/50">{side}</span>
          </div>
        ))}
      </div>
    </NeonCard>
  );
}

function OrderHistoryPanel() {
  return (
    <NeonCard variant="gold">
      <p className="text-sm uppercase tracking-[0.28em] text-amber-200/70">Orders and risk</p>
      <div className="mt-4 grid gap-3" data-testid="trade-history">
        {orderHistory.map(([kind, amount, status]) => (
          <div key={`${kind}-${amount}`} className="glass-surface grid grid-cols-3 rounded-2xl px-4 py-3 text-sm">
            <span className="font-black text-white">{kind}</span>
            <span className="text-cyan-100/70">{amount}</span>
            <span className="text-right text-amber-100/80">{status}</span>
          </div>
        ))}
      </div>
    </NeonCard>
  );
}

const gridTemplates = [
  { name: "Neutral grid", apr: "12.4%", status: "Armed" },
  { name: "Arithmetic", apr: "18.1%", status: "Preview" },
  { name: "Trailing grid", apr: "21.6%", status: "AI guarded" },
] as const;

const gridLogs = [
  ["Rebalance #42", "Filled · 420 ION", "2m ago"],
  ["TP guard", "Held · range intact", "14m ago"],
  ["Sentinel", "No MEV flag", "1h ago"],
] as const;

const marketTrades = [
  ["6.12 ION", "1.2 BNB", "Buy"],
  ["6.08 ION", "0.8 BNB", "Sell"],
  ["6.15 ION", "2.1 BNB", "Buy"],
] as const;

const orderHistory = [
  ["Limit · BNB/ION", "1.5 BNB", "Open"],
  ["Market · BNB/ION", "0.4 BNB", "Filled"],
  ["Stop · BNB/ION", "0.9 BNB", "Cancelled"],
] as const;

function GridDeskPage() {
  const config = pageConfigs.grid;
  const fetchTickers = useCallback((signal: AbortSignal) => fetchMarketTickers(signal), []);
  const tickers = useApiResource(fetchTickers, [] as MarketTicker[], {
    isEmpty: (data) => data.length === 0,
  });
  const { candles, loadState: candleState, provenanceLabel: candleProv } = useMarketCandles(
    "BNB/ION",
    "15m",
  );

  const heroMetrics = useMemo(() => {
    if (tickers.state !== "ready") {
      return config.metrics.map((m) => ({ ...m, value: "—", testId: `grid-metric-${m.label}` }));
    }
    const ion = tickers.data.find((row) => row.symbol === "ION");
    return [
      {
        label: "ION",
        value: ion?.displayPrice ?? "—",
        tone: "gold" as const,
        testId: "grid-metric-ion",
      },
      {
        label: "24h",
        value: ion?.displayChange ?? "—",
        tone: "cyan" as const,
        testId: "grid-metric-24h",
      },
      {
        label: "Strategies",
        value: config.metrics[0]?.value ?? "5 modes",
        tone: "magenta" as const,
        testId: "grid-metric-strategies",
      },
    ];
  }, [config.metrics, tickers.data, tickers.state]);

  const rangeBars = useMemo(() => {
    if (candleState !== "ready" || candles.length === 0) {
      return [];
    }
    const closes = candles.slice(-12).map((c) => c.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const span = Math.max(max - min, 0.0001);
    return closes.map((close) => Math.round(((close - min) / span) * 100));
  }, [candleState, candles]);

  const rangeSubtitle =
    candleState === "ready" && candles.length > 0
      ? `${candles[0]?.close.toFixed(2)} — ${candles[candles.length - 1]?.close.toFixed(2)} ION`
      : "BNB / ION";

  return (
    <div className="grid gap-5" data-testid="page-grid">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={heroMetrics}
        metricsMeta={tickers.meta}
        metricsState={tickers.state}
        title={config.title}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <div className="grid gap-5">
          <ChartFrame
            badge={<StatusPill label="AI Sentinel armed" testId="grid-sentinel" tone="emerald" />}
            subtitle={rangeSubtitle}
            testId="grid-range-chart"
            title="Range visualization"
          >
            <div className="float-3d flex h-48 items-end gap-2 rounded-[1.4rem] border border-fuchsia-200/15 bg-[#03050f]/55 p-4">
              {rangeBars.length > 0
                ? rangeBars.map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-full bg-gradient-to-t from-fuchsia-500/30 to-cyan-300/80"
                      style={{ height: `${h}%` }}
                    />
                  ))
                : (
                  <span className="text-xs text-cyan-100/55">Loading candle range…</span>
                )}
            </div>
            {candleProv ? (
              <DataProvenanceBadge
                className="mt-3"
                label={candleProv}
                testId="grid-range-provenance"
              />
            ) : (
              <p className="mt-3 text-xs text-cyan-100/55" data-testid="grid-backtest">
                Candle range from markets API — bounds set in the strategy form below.
              </p>
            )}
          </ChartFrame>
          <GlassPanel eyebrow="Strategy log" testId="grid-strategy-log" title="Live bot timeline">
            <div className="grid gap-2">
              {gridLogs.map(([title, detail, time]) => (
                <div key={title} className="grid grid-cols-3 gap-2 rounded-2xl bg-white/[0.04] px-3 py-2 text-sm">
                  <span className="font-black text-white">{title}</span>
                  <span className="text-cyan-100/70">{detail}</span>
                  <span className="text-right text-cyan-100/45">{time}</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
        <div className="grid gap-5">
          <NeonCard variant="magenta">
            <p className="mb-3 text-sm uppercase tracking-[0.28em] text-fuchsia-200/70">Strategy templates</p>
            <div className="grid gap-2" data-testid="grid-templates">
              {gridTemplates.map((t) => (
                <GlassPanel key={t.name} className="!p-3">
                  <p className="font-black text-white">{t.name}</p>
                  <p className="text-xs text-cyan-100/60">
                    APR {t.apr} · {t.status}
                  </p>
                </GlassPanel>
              ))}
            </div>
          </NeonCard>
          <RiskNotice
            body="Grid bounds, investment, and slippage must pass Sentinel before wallet signing. Quotes use backend bigint-floor math."
            testId="grid-ai-suggestion"
            title="AI suggestion"
            tone="fuchsia"
          />
          <NeonCard variant="cyan">
            <GridStrategyPanel />
          </NeonCard>
        </div>
      </div>
    </div>
  );
}

function PoolDeskPage() {
  const desk = usePoolDeskData();
  const config = {
    eyebrow: "Liquidity",
    title: "ION liquidity pools",
    description: "Pool desk for LP positions, fee accrual, and add/remove liquidity flows.",
    icon: Droplets,
  };
  const metricsMeta = desk.staking.meta ?? desk.tickers.meta;

  return (
    <div className="grid gap-5" data-testid="page-pool">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={desk.heroMetrics}
        metricsMeta={metricsMeta}
        metricsState={desk.combinedState}
        title={config.title}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <GlassPanel eyebrow="Pool list" testId="pool-list" title="ION liquidity pools">
          <div className="mb-3 flex flex-wrap gap-2">
            <DataSourceBadge meta={desk.staking.meta} testId="pool-desk-staking-source" />
            <DataSourceBadge meta={desk.tickers.meta} testId="pool-desk-ticker-source" />
          </div>
          <AsyncState
            emptyMessage="Pool metrics unavailable."
            error={desk.combinedError}
            onRetry={desk.reload}
            state={desk.combinedState}
            testId="pool-desk-metrics"
          >
            <div className="grid gap-2">
              {desk.pools.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-4 gap-2 rounded-2xl bg-white/[0.04] px-4 py-3 text-sm"
                >
                  <span className="font-black text-white">{row.pair}</span>
                  <span className="text-cyan-100/70">{formatUsdCompact(row.tvlUsd)}</span>
                  <span className="text-cyan-100/70">
                    {row.volume24hUsd === null ? "—" : formatUsdCompact(row.volume24hUsd)}
                  </span>
                  <span className="text-right text-amber-200">{row.aprPct}%</span>
                </div>
              ))}
            </div>
          </AsyncState>
        </GlassPanel>
        <div className="grid gap-5">
          <ChartFrame subtitle="LP fee APR from staking API" testId="pool-fee-chart" title="Fee growth">
            <div className="h-40 rounded-[1.2rem] border border-amber-200/15 bg-[#03050f]/50 p-4 text-sm text-amber-100/80">
              {desk.ready ? (
                <span>
                  LP mining APR {desk.staking.data.apr.lpMiningPct}% · DEX staking APR{" "}
                  {desk.staking.data.apr.dexPct}%
                </span>
              ) : (
                <span>Loading staking metrics…</span>
              )}
            </div>
          </ChartFrame>
          <NeonCard variant="gold">
            <PoolLiquidityPanel />
          </NeonCard>
          <GlassPanel testId="pool-lp-position" title="LP position">
            <p className="text-sm text-cyan-100/75">0 active positions · connect wallet to load indexer-backed LP cards.</p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

function BridgeDeskPage() {
  const config = pageConfigs.bridge;
  const desk = useBridgeDeskData();
  const riskTone =
    desk.routes.state === "ready" && desk.routes.data.relayerStatus === "online"
      ? "emerald"
      : "amber";

  return (
    <div className="grid gap-5" data-testid="page-bridge">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={desk.heroMetrics}
        metricsMeta={desk.routes.meta}
        metricsState={desk.routes.state}
        title={config.title}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <ChartFrame
          badge={
            <StatusPill
              label={`Relayer ${desk.routes.state === "ready" ? desk.routes.data.relayerStatus : "…"}`}
              testId="bridge-risk"
              tone={riskTone}
            />
          }
          subtitle={desk.etaSubtitle}
          testId="bridge-status-tracker"
          title="Cross-chain status"
        >
          <DataSourceBadge meta={desk.routes.meta} testId="bridge-metrics-source" />
          <AsyncState
            emptyMessage="No bridge routes configured."
            error={desk.routes.error}
            onRetry={desk.routes.reload}
            state={desk.routes.state}
            testId="bridge-desk-routes"
          >
            <div className="mt-3 grid gap-3" data-testid="bridge-steps">
              {desk.steps.map((s) => (
                <div
                  key={s.step}
                  className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3 text-sm"
                >
                  <span className="font-black text-white">{s.step}</span>
                  <span className="text-cyan-100/65">{s.chain}</span>
                  <span className="text-emerald-200">{s.state}</span>
                </div>
              ))}
            </div>
          </AsyncState>
          <p className="mt-4 text-xs text-cyan-100/50">
            Routes and verifier threshold from GET /api/bridge/routes — no static demo steps.
          </p>
        </ChartFrame>
        <NeonCard variant="cyan">
          <BridgeTransferPanel
            routesPayload={desk.routes.state === "ready" ? desk.routes.data : null}
          />
        </NeonCard>
      </div>
    </div>
  );
}

function BurnDeskPage() {
  const config = pageConfigs.burn;
  const desk = useBurnDeskData();

  return (
    <div className="grid gap-5" data-testid="page-burn">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={desk.heroMetrics}
        metricsMeta={desk.burn.meta}
        metricsState={desk.burn.state}
        title={config.title}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartFrame subtitle="Burn window trends" testId="burn-trend-chart" title="Burn analytics">
          <DataSourceBadge meta={desk.burn.meta} testId="burn-metrics-source" />
          <AsyncState
            emptyMessage="Burn trend windows unavailable from API."
            error={desk.burn.error}
            onRetry={desk.burn.reload}
            state={
              desk.burn.state === "loading"
                ? "loading"
                : desk.burn.state === "error"
                  ? "error"
                  : desk.trendBars.length === 0
                    ? "empty"
                    : "ready"
            }
            testId="burn-trend"
          >
            <div className="flex h-44 items-end gap-2">
              {desk.trendBars.map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t-lg bg-gradient-to-t from-rose-500/40 to-amber-300/90"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </AsyncState>
          <p className="mt-3 text-xs text-cyan-100/55" data-testid="burn-chain-split">
            {desk.chainSplitLine}
          </p>
        </ChartFrame>
        <div className="grid gap-5">
          <GlassPanel testId="burn-proof-links" title="Proof links">
            {desk.burn.state === "ready" ? (
              <>
                <p className="font-mono text-xs text-cyan-100/70">BSC: {desk.burn.data.bscBurnAddress}</p>
                <p className="mt-2 font-mono text-xs text-cyan-100/70">ION: {desk.burn.data.ionBurnSource}</p>
              </>
            ) : (
              <p className="text-sm text-cyan-100/55">Loading burn proof endpoints…</p>
            )}
          </GlassPanel>
          <NeonCard variant="magenta">
            <BurnAnalyticsPanel />
          </NeonCard>
        </div>
      </div>
    </div>
  );
}

function DomainDeskPage() {
  const config = pageConfigs.domain;
  const desk = useDomainDeskData();

  return (
    <div className="grid gap-5" data-testid="page-domain">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={desk.heroMetrics}
        metricsMeta={desk.showcase.meta}
        metricsState={desk.showcase.state}
        title={config.title}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <GlassPanel eyebrow="My domains" testId="domain-marketplace" title="Marketplace · gateway resolver">
          <DataSourceBadge meta={desk.showcase.meta} testId="domain-metrics-source" />
          <AsyncState
            emptyMessage="No domain listings returned from showcase API."
            error={desk.showcase.error}
            onRetry={desk.showcase.reload}
            state={desk.showcase.state}
            testId="domain-showcase"
          >
            <div className="mt-3 grid gap-2">
              {desk.listings.map((d) => (
                <div
                  key={d.name}
                  className="flex justify-between rounded-2xl bg-white/[0.04] px-4 py-3 text-sm"
                >
                  <span className="font-black text-cyan-100">{d.name}</span>
                  <span className="text-cyan-100/60">{d.status}</span>
                  <span className="text-amber-200">{d.priceIon}</span>
                </div>
              ))}
            </div>
          </AsyncState>
          <p className="mt-3 text-xs text-cyan-100/50">
            Rows from GET /api/domain/showcase (resolver catalog) — not static UI seeds.
          </p>
        </GlassPanel>
        <div className="grid gap-5">
          <RiskNotice
            body="Homoglyph and phishing checks run before send-to-domain signing. Resolver must match wallet-bound .ion record."
            testId="domain-phishing-warn"
            title="Phishing guard"
            tone="amber"
          />
          <NeonCard variant="cyan">
            <DomainTradingPanel />
          </NeonCard>
          <GlassPanel testId="domain-ion-id" title="ION ID / KYC">
            <p className="text-sm text-cyan-100/75">{desk.kycLine}</p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

function AIDeskPage() {
  const config = pageConfigs.ai;
  const desk = useAiDeskData();
  const riskTone =
    desk.statsState === "ready" && desk.stats?.routeHealth === "stressed" ? "amber" : "emerald";

  return (
    <div className="grid gap-5" data-testid="page-ai">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={desk.heroMetrics}
        metricsState={desk.metricsState}
        title={config.title}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <ChartFrame
          badge={
            <StatusPill
              label={
                desk.statsState === "ready" && desk.stats
                  ? `Route: ${desk.stats.routeHealth}`
                  : "Route: …"
              }
              testId="ai-risk-score"
              tone={riskTone}
            />
          }
          subtitle={desk.statsProv || "BNB / ION · market surface"}
          testId="ai-market-summary"
          title="Market summary"
        >
          {desk.statsProv ? (
            <DataProvenanceBadge className="mb-3" label={desk.statsProv} testId="ai-stats-provenance" />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2" data-testid="ai-signals">
            {desk.signals.map((s) => (
              <MetricTile key={s.label} label={s.label} tone={s.tone ?? "cyan"} value={s.value} />
            ))}
          </div>
          <p className="mt-4 text-[11px] text-cyan-100/45" data-testid="ai-disclaimer">
            Not investment advice · signals from markets/tickers and swap-stats API until dedicated
            ai-market-service ships.
          </p>
        </ChartFrame>
        <div className="grid gap-5">
          <GlassPanel testId="ai-grid-suggestion" title="Grid suggestion">
            <p className="text-sm text-cyan-100/75">{desk.gridSuggestion}</p>
          </GlassPanel>
          <GlassPanel testId="ai-prediction-history" title="Prediction history">
            <p className="text-sm text-cyan-100/75">{desk.predictionHistory}</p>
          </GlassPanel>
          <NeonCard variant="mixed" className="!shadow-neonCyan">
            <AIMarketPanel />
          </NeonCard>
        </div>
      </div>
    </div>
  );
}

function StakeDeskPage() {
  const config = {
    eyebrow: "Staking",
    title: "ION staking hub",
    description: "Stake ION for DEX rewards, lock tiers, and claimable yield with wallet-aware flows.",
    icon: Coins,
    metrics: [
      { label: "APR", value: "18.4%", tone: "gold" as const },
      { label: "Lock", value: "90d tier", tone: "cyan" as const },
      { label: "Rewards", value: "ION", tone: "magenta" as const },
    ],
  };
  return (
    <div className="grid gap-5" data-testid="page-stake">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={config.metrics}
        title={config.title}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <GlassPanel testId="stake-overview" title="Staking overview · indexer seed">
          <p className="text-sm text-cyan-100/75">Official + DEX staking totals merge through staking-service. Claimable rewards and unstake queue shown after wallet connect.</p>
        </GlassPanel>
        <NeonCard variant="gold">
          <StakeHubPanel />
        </NeonCard>
      </div>
    </div>
  );
}

export function BusinessPage({ page }: { page: BusinessPageKey }) {
  if (page === "trade") {
    return <TradeDeskPage />;
  }
  if (page === "grid") {
    return <GridDeskPage />;
  }
  if (page === "bridge") {
    return <BridgeDeskPage />;
  }
  if (page === "burn") {
    return <BurnDeskPage />;
  }
  if (page === "domain") {
    return <DomainDeskPage />;
  }
  if (page === "ai") {
    return <AIDeskPage />;
  }

  return null;
}
