import {
  ArrowLeftRight,
  BarChart3,
  Bot,
  Flame,
  Globe2,
  LayoutGrid,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import { Fragment, useMemo, useState, useEffect, type FormEvent } from "react";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import type { PageKey } from "@/components/layout/AppShell";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { CryptoPanel } from "@/components/ai/CryptoSentimentPanel";
import { DefenseShield } from "@/components/ai/DefenseShield";
import { SmartMoneyPanel } from "@/components/ai/SmartMoneyPanel";
import { TokenAuditPanel } from "@/components/ai/TokenAuditPanel";
import { TwitterFeedPanel } from "@/components/ai/TwitterFeedPanel";
import { useMockData } from "@/context/MockDataContext";
import { mockPreviewMeta } from "@/lib/MOCK_DATA";
import {
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
      "Market and limit order shell for BNB / ION trading, with later hooks for order book, fee preview, and wallet signing.",
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
      "Strategy shell for neutral, arithmetic, geometric, trailing, and stop-grid modes inspired by OKX Web3 flows.",
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
      "Bridge shell for BSC vault deposits, ION-side release tracking, relayer health, and consistency checks.",
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
      "Burn dashboard shell for BSC burn address, ION mainnet burn source, total burned, and remaining supply.",
    icon: Flame,
    primaryAction: "View Burn Chart",
    metrics: [
      { label: "BSC Burn", value: "0x...dEaD", tone: "magenta" },
      { label: "ION Burn", value: "Official source", tone: "cyan" },
      { label: "Trend", value: "Hourly / Daily", tone: "gold" },
    ],
    checklist: ["BSC burn index", "ION burn source", "Trend charts", "Remaining supply"],
  },
  domain: {
    eyebrow: "ION DNS",
    title: "Domain trading and binding",
    description:
      "ION DNS shell based on official DNS FunC references and the community dns.ice.io ecosystem surface.",
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
      "AI analysis shell for market signals, anomaly detection, anti-bot scoring, and strategy risk alerts.",
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
  const variantMap: Record<string, "cyan" | "magenta" | "violet" | "gold"> = {
    cyan: "cyan",
    magenta: "magenta",
    gold: "gold",
  };
  return (
    <GlassPanel variant={variantMap[metric.tone] ?? "cyan"} noAurora padding="sm">
      <p className={`text-xs uppercase tracking-[0.22em] text-cyan-100/45 ${toneClass[metric.tone]}`}>
        {metric.label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{metric.value}</p>
    </GlassPanel>
  );
}

const fallbackBurnSummary: BurnSummary = {
  totalBurnedIon: "12845000",
  bscBurnedIon: "8245000",
  ionMainnetBurnedIon: "4600000",
  remainingSupplyIon: "987155000",
  bscBurnAddress: "0x000000000000000000000000000000000000dEaD",
  ionBurnAddress: "ion-mainnet-burn-address-placeholder",
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
  const { burnSummary: summary } = useMockData();
  const meta: ApiMeta = mockPreviewMeta("burn/summary");

  const metrics: MetricCard[] = [
    { label: "Total Burned", value: `${formatIonAmount(summary.totalBurnedIon)} ION`, tone: "gold" },
    { label: "BSC Burn", value: `${formatIonAmount(summary.bscBurnedIon)} ION`, tone: "magenta" },
    { label: "Remaining", value: `${formatIonAmount(summary.remainingSupplyIon)} ION`, tone: "cyan" },
  ];

  return <MetricsGrid meta={meta} metrics={metrics} sourceTestId="burn-metrics-source" />;
}

function StakeMetricsRow() {
  const { stakingSummary: summary } = useMockData();
  const meta: ApiMeta = mockPreviewMeta("staking/summary");

  const metrics: MetricCard[] = [
    { label: "DEX APR", value: `${summary.apr.dexPct}%`, tone: "gold" },
    { label: "Official Stake", value: `${formatIonAmount(summary.officialStakedIon)} ION`, tone: "cyan" },
    { label: "DEX Stake", value: `${formatIonAmount(summary.dexStakedIon)} ION`, tone: "magenta" },
  ];

  return <MetricsGrid meta={meta} metrics={metrics} sourceTestId="stake-metrics-source" />;
}

function BridgeMetricsRow() {
  const { bridgeRoutes: payload } = useMockData();
  const meta: ApiMeta = mockPreviewMeta("bridge/routes");

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
  const { domainResolution: resolution } = useMockData();
  const meta: ApiMeta = mockPreviewMeta("domain/resolve");

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

export function FormField(props: {
  label: string;
  testId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "number" | "text";
}) {
  return <GlassInput {...props} />;
}

export function SegmentedControl<T extends string>({
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
    <GlassPanel noAurora padding="sm" variant="mixed">
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
                : "bg-white/[0.06] text-cyan-100/55 hover:bg-white/[0.12]"
            }`}
            data-testid={`${testId}-${option.value}`}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </GlassPanel>
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
          placeholder="1250"
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
          placeholder={orderType === "market" ? "6.02" : "6.00"}
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
          placeholder="0.5"
          testId="trade-slippage"
          type="number"
          value={slippage}
        />
      </div>

      {!validation.slippageValid ? (
        <GlassPanel variant="magenta" noAurora padding="sm">
          <p className="text-sm text-rose-100" data-testid="trade-error">Slippage must stay between 0.1% and 5% for wallet-safe execution.</p>
        </GlassPanel>
      ) : null}

      <GlassPanel variant="cyan" noAurora padding="sm">
        {validation.isValid ? (
          <span>
            {side === "buy" ? "Buying" : "Selling"} {validation.parsedAmount?.toLocaleString()} ION via {orderType} order. Estimated notional: ${validation.notional.toLocaleString(undefined, { maximumFractionDigits: 2 })}.
          </span>
        ) : (
          <span>Enter amount, price, and slippage to preview the wallet-safe order payload.</span>
        )}
      </GlassPanel>

      <NeonButton className="w-full sm:w-fit" data-testid="trade-submit" disabled={!validation.isValid} type="submit">
        Create Limit Order
      </NeonButton>

      {submitted ? (
        <GlassPanel variant="cyan" noAurora padding="sm">
          <p className="text-sm font-bold text-emerald-100" data-testid="trade-confirmation">Draft order ready for wallet signing. Final contract call is intentionally gated behind wallet integration.</p>
        </GlassPanel>
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
          placeholder="5.20"
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
          placeholder="7.40"
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
          placeholder="20"
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
          placeholder="2500"
          testId="grid-investment"
          type="number"
          value={investment}
        />
      </div>

      {!validation.boundsValid && lowerPrice && upperPrice ? (
        <GlassPanel variant="magenta" noAurora padding="sm">
          <p className="text-sm text-rose-100" data-testid="grid-error">Upper price must be greater than lower price before the strategy can be armed.</p>
        </GlassPanel>
      ) : null}

      <GlassPanel variant="magenta" noAurora padding="sm">
        {validation.isValid ? (
          <span>
            {mode} grid from ${validation.lower?.toLocaleString()} to ${validation.upper?.toLocaleString()} with {gridCount} levels. Approx step: ${validation.step.toLocaleString(undefined, { maximumFractionDigits: 4 })}.
          </span>
        ) : (
          <span>Set bounds, grid count, and investment to preview AI Sentinel guarded strategy parameters.</span>
        )}
      </GlassPanel>

      <NeonButton className="w-full sm:w-fit" data-testid="grid-submit" disabled={!validation.isValid} type="submit">
        Create Grid Strategy
      </NeonButton>

      {submitted ? (
        <GlassPanel variant="cyan" noAurora padding="sm">
          <p className="text-sm font-bold text-emerald-100" data-testid="grid-confirmation">Strategy draft ready. AI Sentinel checks and wallet execution remain gated for contract integration.</p>
        </GlassPanel>
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
          placeholder="2.5"
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
          placeholder="1250"
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
          placeholder="0.5"
          testId="pool-slippage"
          type="number"
          value={slippage}
        />
      </div>

      {!validation.slippageValid ? (
        <GlassPanel variant="magenta" noAurora padding="sm">
          <p className="text-sm text-rose-100" data-testid="pool-error">Slippage must stay between 0.1% and 5% before minting LP shares on-chain.</p>
        </GlassPanel>
      ) : null}

      <GlassPanel variant="cyan" noAurora padding="sm">
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
      </GlassPanel>

      <NeonButton className="w-full sm:w-fit" data-testid="pool-submit" disabled={!validation.isValid} type="submit">
        Add Liquidity
      </NeonButton>

      {submitted ? (
        <GlassPanel variant="cyan" noAurora padding="sm">
          <p className="text-sm font-bold text-emerald-100" data-testid="pool-confirmation">Liquidity draft ready for wallet signing. Mint and LP oracle hooks remain gated behind contract integration.</p>
        </GlassPanel>
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
        placeholder="500"
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
        <GlassPanel variant="cyan" noAurora padding="sm">
          <p className="text-sm font-bold text-emerald-100" data-testid="stake-confirmation">
            {mode === "stake"
              ? "Stake draft ready for wallet signing. Reward streams remain gated behind staking contract wiring."
              : "Unstake draft ready for wallet signing. Cooldown rules remain gated behind staking contract wiring."}
          </p>
        </GlassPanel>
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

function BridgeTransferPanel() {
  const [direction, setDirection] = useState<"bsc-ion" | "ion-bsc">("bsc-ion");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const validation = useMemo(() => {
    const parsedAmount = toPositiveNumber(amount);
    const dest = destination.trim();
    const destinationValid = dest.length >= 8;
    return {
      destinationValid,
      isValid: parsedAmount !== null && destinationValid,
      parsedAmount,
    };
  }, [amount, destination]);

  function submitBridge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validation.isValid) {
      setSubmitted(true);
    }
  }

  return (
    <form className="grid gap-4" data-testid="bridge-form" onSubmit={submitBridge}>
      <SegmentedControl
        label="Route"
        onChange={(next) => {
          setDirection(next);
          setSubmitted(false);
        }}
        options={[
          { label: "BSC → ION", value: "bsc-ion" },
          { label: "ION → BSC", value: "ion-bsc" },
        ]}
        testId="bridge-direction"
        value={direction}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <FormField
          label="Amount ION"
          onChange={(value) => {
            setAmount(value);
            setSubmitted(false);
          }}
          placeholder="950"
          testId="bridge-amount"
          type="number"
          value={amount}
        />
        <FormField
          label="Destination address / memo"
          onChange={(value) => {
            setDestination(value);
            setSubmitted(false);
          }}
          placeholder="EQ... or 0x..."
          testId="bridge-destination"
          type="text"
          value={destination}
        />
      </div>

      {!validation.destinationValid && destination.trim().length > 0 ? (
        <GlassPanel variant="magenta" noAurora padding="sm">
          <p className="text-sm text-rose-100" data-testid="bridge-error">Destination memo must stay at least 8 characters until wallet resolution maps it to canonical addresses.</p>
        </GlassPanel>
      ) : null}

      <GlassPanel variant="cyan" noAurora padding="sm">
        {validation.isValid ? (
          <span>
            Bridge preview: route {direction === "bsc-ion" ? "BSC → ION Chain" : "ION Chain → BSC"} · sweep{" "}
            {validation.parsedAmount?.toLocaleString()} ION · relayer quorum and replay guards remain contract gated.
          </span>
        ) : (
          <span>Set a positive sweep amount and resilient destination memo to simulate vault attestations offline.</span>
        )}
      </GlassPanel>

      <NeonButton className="w-full sm:w-fit" data-testid="bridge-submit" disabled={!validation.isValid} type="submit">
        Stage Bridge Sweep
      </NeonButton>

      {submitted ? (
        <GlassPanel variant="cyan" noAurora padding="sm">
          <p className="text-sm font-bold text-emerald-100" data-testid="bridge-confirmation">Bridge transfer draft ready for relayer quorum + wallet proofs. Custody signatures remain intentionally offline.</p>
        </GlassPanel>
      ) : null}
    </form>
  );
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
          placeholder="125000"
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
          placeholder="Indexer batch / treasury note"
          testId="burn-memo"
          type="text"
          value={memo}
        />
      </div>

      {!validation.memoValid ? (
        <GlassPanel variant="magenta" noAurora padding="sm">
          <p className="text-sm text-rose-100" data-testid="burn-error">Memo must stay ≤ 120 chars for sentinel-safe logging overlays.</p>
        </GlassPanel>
      ) : null}

      <GlassPanel variant="gold" noAurora padding="sm">
        {validation.isValid ? (
          <span>
            Burn preview: {validation.parsedAmount?.toLocaleString()} ION on {chain.toUpperCase()} · dual-chain indexer will reconcile treasury splits once workers land.
          </span>
        ) : (
          <span>Provide a tracked burn magnitude plus optional memo hooks for treasury transparency rails.</span>
        )}
      </GlassPanel>

      <NeonButton className="w-full sm:w-fit" data-testid="burn-submit" disabled={!validation.isValid} type="submit">
        Draft Burn Narrative
      </NeonButton>

      {submitted ? (
        <GlassPanel variant="cyan" noAurora padding="sm">
          <p className="text-sm font-bold text-emerald-100" data-testid="burn-confirmation">Burn analytics draft ready for dual-chain sentinel playback. Still no on-chain transaction from this sandbox.</p>
        </GlassPanel>
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
        placeholder="custodian.ion"
        testId="domain-query"
        type="text"
        value={query}
      />

      {query.trim().length > 0 && !validation.labelValid ? (
        <GlassPanel variant="magenta" noAurora padding="sm">
          <p className="text-sm text-rose-100" data-testid="domain-error">Enter a lowercase label with dotted segments (dns.ice.io compatible) before_FUN wiring.</p>
        </GlassPanel>
      ) : null}

      <GlassPanel variant="violet" noAurora padding="sm">
        {validation.isValid ? (
          <span>
            Domain preview: {mode === "search" ? "Lookup" : "Bind"}{" "}
            <span className="font-mono text-white">{query.trim().toLowerCase()}</span> using official DNS FunC schemas + wallet-signed
            payloads (draft only).
          </span>
        ) : (
          <span>Use dns.ice.io compatible labels to rehearsal wallet proofs without touching validators.</span>
        )}
      </GlassPanel>

      <NeonButton className="w-full sm:w-fit" data-testid="domain-submit" disabled={!validation.isValid} type="submit">
        Compose DNS Payload
      </NeonButton>

      {submitted ? (
        <GlassPanel variant="cyan" noAurora padding="sm">
          <p className="text-sm font-bold text-emerald-100" data-testid="domain-confirmation">Domain handshake draft staged. Resolver transactions remain blocked until dns contracts are reachable from this wallet.</p>
        </GlassPanel>
      ) : null}
    </form>
  );
}

function AIMarketPanel() {
  const [tab, setTab] = useState<"monitor" | "sentiment" | "twitter" | "signals" | "audit" | "shield">("monitor");

  return (
    <div className="grid gap-4">
      <SegmentedControl
        label="AI Mode"
        onChange={(v) => setTab(v as typeof tab)}
        options={[
          { label: "World Monitor", value: "monitor" },
          { label: "Sentiment", value: "sentiment" },
          { label: "Twitter", value: "twitter" },
          { label: "Smart Money", value: "signals" },
          { label: "Token Audit", value: "audit" },
          { label: "Shield", value: "shield" },
        ]}
        testId="ai-tab"
        value={tab}
      />

      {tab === "monitor" ? (
        <div className="overflow-hidden rounded-2xl border border-white/10" data-testid="ai-world-monitor">
          <iframe
            src="https://worldmonitor.app"
            title="World Monitor - Real-Time Global Intelligence"
            className="h-[70vh] w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups"
            loading="lazy"
          />
        </div>
      ) : tab === "sentiment" ? (
        <CryptoPanel />
      ) : tab === "twitter" ? (
        <TwitterFeedPanel />
      ) : tab === "signals" ? (
        <SmartMoneyPanel />
      ) : tab === "audit" ? (
        <TokenAuditPanel />
      ) : (
        <DefenseShield />
      )}
    </div>
  );
}

export function BusinessPage({ page }: { page: BusinessPageKey }) {
  const config = pageConfigs[page];
  const Icon = config.icon;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_22rem]" data-testid={`page-${page}`}>
      <NeonCard className="min-h-[31rem]" variant="mixed">
        <div className="flex h-full flex-col justify-between gap-8">
          <div>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.36em] text-cyan-200/70">
                  {config.eyebrow}
                </p>
                <h1 className="mt-3 max-w-3xl text-4xl font-black text-white sm:text-6xl" data-testid="page-title">
                  {config.title}
                </h1>
              </div>
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl border border-white/10 bg-white/[0.10] text-cyan-200 shadow-neonCyan">
                <Icon size={34} />
              </div>
            </div>
            <p className="max-w-3xl text-base leading-7 text-cyan-100/68">
              {config.description}
            </p>
          </div>

          {page === "burn" ? (
            <BurnMetricsRow />
          ) : page === "bridge" ? (
            <BridgeMetricsRow />
          ) : page === "domain" ? (
            <DomainMetricsRow />
          ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {config.metrics.map((metric) => (
              <MetricCardView
                key={metric.label}
                metric={metric}
              />
            ))}
          </div>
          )}

          {page === "trade" ? <TradeOrderPanel /> : null}
          {page === "grid" ? <GridStrategyPanel /> : null}
          {page === "bridge" ? <BridgeTransferPanel /> : null}
          {page === "burn" ? <BurnAnalyticsPanel /> : null}
          {page === "domain" ? <DomainTradingPanel /> : null}
          {page === "ai" ? <AIMarketPanel /> : null}
        </div>
      </NeonCard>

      <NeonCard variant="cyan">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">Build Checklist</p>
        <div className="mt-5 grid gap-3">
          {config.checklist.map((item, index) => (
            <GlassPanel key={item} noAurora padding="sm" variant="cyan">
              <p className="text-xs font-black text-cyan-200">0{index + 1}</p>
              <p className="mt-1 font-bold text-white">{item}</p>
            </GlassPanel>
          ))}
        </div>
      </NeonCard>
    </div>
  );
}
