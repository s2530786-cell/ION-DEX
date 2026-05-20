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
import { useMemo, useState, type FormEvent } from "react";
import type { PageKey } from "@/components/layout/AppShell";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { ChartFrame, GlassPanel, MetricTile, PageHero, RiskNotice, StatusPill } from "@/components/ui/glass";

type BusinessPageConfig = {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof BarChart3;
  primaryAction: string;
  metrics: Array<{ label: string; value: string; tone: "cyan" | "magenta" | "gold" }>;
  checklist: string[];
};

const pageConfigs: Record<Exclude<PageKey, "swap">, BusinessPageConfig> = {
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
  pool: {
    eyebrow: "Liquidity",
    title: "ION liquidity pools",
    description:
      "Pool management surface for adding liquidity, LP position cards, fee growth, and impermanent-loss alerts.",
    icon: Layers3,
    primaryAction: "Add Liquidity",
    metrics: [
      { label: "TVL", value: "$1.23M", tone: "cyan" },
      { label: "Pool Fee", value: "ION based", tone: "gold" },
      { label: "Positions", value: "0 active", tone: "magenta" },
    ],
    checklist: ["LP mint flow", "Slippage guard", "Pool analytics", "Position withdrawal"],
  },
  stake: {
    eyebrow: "Yield",
    title: "DEX staking hub",
    description:
      "Staking hub for official staking, DEX staking, ecosystem staking totals, and dynamic APR adjustments.",
    icon: ShieldCheck,
    primaryAction: "Stake ION",
    metrics: [
      { label: "DEX APR", value: "25.5%", tone: "gold" },
      { label: "Official Stake", value: "Indexer feed", tone: "cyan" },
      { label: "Ecosystem Stake", value: "Governance feed", tone: "magenta" },
    ],
    checklist: ["Dynamic APR model", "Reward vesting", "Unstake queue", "Treasury split"],
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

const tradeStats = [
  { label: "Last price", value: "6.024", tone: "text-emerald-300" },
  { label: "24h volume", value: "18.42M ION", tone: "text-cyan-200" },
  { label: "Spread", value: "0.04%", tone: "text-fuchsia-200" },
  { label: "ION fee", value: "0.25%", tone: "text-amber-200" },
];

const tradeCandles = Array.from({ length: 48 }, (_, index) => ({
  height: 36 + ((index * 37) % 145),
  offset: 10 + ((index * 19) % 46),
  tone: index % 4 === 0 ? "bg-fuchsia-400" : index % 3 === 0 ? "bg-emerald-300" : "bg-cyan-300",
}));

const tradeOrderBook = [
  { price: "6.041", amount: "18,220", depth: "74%", side: "ask" },
  { price: "6.036", amount: "13,904", depth: "58%", side: "ask" },
  { price: "6.029", amount: "9,771", depth: "42%", side: "ask" },
  { price: "6.019", amount: "11,842", depth: "48%", side: "bid" },
  { price: "6.013", amount: "15,006", depth: "63%", side: "bid" },
  { price: "6.006", amount: "20,408", depth: "81%", side: "bid" },
];

const marketTrades = [
  ["6.024", "4,820", "Buy"],
  ["6.021", "2,114", "Sell"],
  ["6.019", "8,430", "Buy"],
  ["6.016", "1,902", "Sell"],
] as const;

const orderHistory = [
  ["Limit buy", "1,250 ION", "Review"],
  ["Grid rebalance", "420 ION", "Filled"],
  ["Stake claim", "88 ION", "Settled"],
] as const;

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
          hint="Bridge amount reference 950"
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
          hint="ION or EVM destination"
          testId="bridge-destination"
          type="text"
          value={destination}
        />
      </div>

      {!validation.destinationValid && destination.trim().length > 0 ? (
        <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100" data-testid="bridge-error">
          Destination memo must stay at least 8 characters until wallet resolution maps it to canonical addresses.
        </p>
      ) : null}

      <div
        className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4 text-sm text-cyan-100/75"
        data-testid="bridge-preview"
      >
        {validation.isValid ? (
          <span>
            Bridge preview: route {direction === "bsc-ion" ? "BSC → ION Chain" : "ION Chain → BSC"} · sweep{" "}
            {validation.parsedAmount?.toLocaleString()} ION · relayer quorum and replay guards remain contract gated.
          </span>
        ) : (
          <span>Set a positive sweep amount and resilient destination memo to simulate vault attestations offline.</span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="bridge-submit" disabled={!validation.isValid} type="submit">
        Stage Bridge Sweep
      </NeonButton>

      {submitted ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
          data-testid="bridge-confirmation"
        >
          Bridge transfer review ready for relayer quorum and wallet proofs. Custody signatures stay offline until final approval.
        </p>
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
  return (
    <div className="grid gap-5" data-testid="page-trade">
      <NeonCard variant="mixed">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-cyan-200/70">
              Professional Trading
            </p>
            <h1 className="mt-3 text-4xl font-black text-white sm:text-6xl" data-testid="page-title">
              ION spot order desk
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-cyan-100/68">
              BNB / ION professional trading surface with depth, live tape, limit controls, wallet review, and ION fee visibility.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[34rem]">
            {tradeStats.map((stat) => (
              <div key={stat.label} className="glass-surface rounded-2xl px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/45">{stat.label}</p>
                <p className={`mt-2 text-xl font-black ${stat.tone}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </NeonCard>

      <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        <div className="grid gap-5">
          <div className="flow-border rounded-[2rem] p-px" data-testid="trade-chart">
            <div className="glass-surface depth-stage relative min-h-[28rem] overflow-hidden rounded-[2rem] p-5">
              <div className="absolute inset-0 aurora-noise opacity-70" />
              <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_220deg,rgba(36,247,255,0.24),transparent_28%,rgba(255,59,212,0.3),transparent_58%,rgba(255,209,102,0.16),transparent_82%)] blur-3xl" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/45">BNB / ION</p>
                  <p className="mt-1 text-3xl font-black text-white">6.024</p>
                </div>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-2 text-xs font-black text-emerald-100">
                  TWAP guard active
                </span>
              </div>
              <div className="float-3d relative z-10 mt-8 h-72 rounded-[1.6rem] border border-cyan-200/15 bg-[#03050f]/62 p-5 shadow-[0_35px_90px_rgba(36,247,255,0.13)]">
                <div className="absolute inset-x-6 top-1/4 h-px bg-cyan-100/10" />
                <div className="absolute inset-x-6 top-1/2 h-px bg-cyan-100/10" />
                <div className="absolute inset-x-6 top-3/4 h-px bg-cyan-100/10" />
                <div className="relative flex h-full items-end gap-2">
                  {tradeCandles.map((candle, index) => (
                    <div key={index} className="flex flex-1 items-end justify-center">
                      <span
                        className={`w-full max-w-[0.55rem] rounded-full ${candle.tone} shadow-[0_0_16px_currentColor]`}
                        style={{ height: candle.height, marginBottom: candle.offset }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <MarketTape />
            <OrderHistoryPanel />
          </div>
        </div>

        <div className="grid gap-5">
          <NeonCard variant="magenta">
            <p className="mb-4 text-sm uppercase tracking-[0.28em] text-fuchsia-200/70">
              Limit order
            </p>
            <TradeOrderPanel />
          </NeonCard>
          <OrderBookPanel />
        </div>
      </div>
    </div>
  );
}

function OrderBookPanel() {
  return (
    <NeonCard variant="cyan">
      <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">Order book</p>
      <div className="mt-4 grid gap-2" data-testid="trade-orderbook">
        {tradeOrderBook.map((row) => (
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
        ))}
      </div>
    </NeonCard>
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

const poolRows = [
  { pair: "BNB / ION", tvl: "$1.23M", volume: "$412K", apr: "24.8%" },
  { pair: "ION / USDT", tvl: "$640K", volume: "$188K", apr: "19.2%" },
] as const;

const bridgeSteps = [
  { step: "Vault deposit", state: "Confirmed", chain: "BSC" },
  { step: "Relayer quorum", state: "2 / 3 signed", chain: "Multisig" },
  { step: "ION release", state: "Pending finality", chain: "ION" },
] as const;

const burnBars = [42, 68, 55, 88, 72, 95, 61, 80, 74, 90] as const;

const domainListings = [
  { name: "trader.ion", status: "Owned", price: "—" },
  { name: "swap.ion", status: "Primary", price: "—" },
  { name: "vault.ion", status: "Listed", price: "420 ION" },
] as const;

const aiSignals = [
  { label: "Trend probability", value: "63% bullish" },
  { label: "Support", value: "5.82 ION" },
  { label: "Resistance", value: "6.48 ION" },
  { label: "Whale flow", value: "+2.1M ION inflow" },
] as const;

function GridDeskPage() {
  const config = pageConfigs.grid;
  return (
    <div className="grid gap-5" data-testid="page-grid">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={config.metrics.map((m) => ({ ...m, testId: `grid-metric-${m.label}` }))}
        title={config.title}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <div className="grid gap-5">
          <ChartFrame
            badge={<StatusPill label="AI Sentinel armed" testId="grid-sentinel" tone="emerald" />}
            subtitle="5.20 — 7.40 ION"
            testId="grid-range-chart"
            title="Range visualization"
          >
            <div className="float-3d flex h-48 items-end gap-2 rounded-[1.4rem] border border-fuchsia-200/15 bg-[#03050f]/55 p-4">
              {burnBars.map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-full bg-gradient-to-t from-fuchsia-500/30 to-cyan-300/80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-cyan-100/55" data-testid="grid-backtest">
              Backtest preview · local-seed replay · 30d neutral grid +0.8% net of ION fees
            </p>
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
  const config = pageConfigs.pool;
  return (
    <div className="grid gap-5" data-testid="page-pool">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={config.metrics}
        title={config.title}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <GlassPanel eyebrow="Pool list" testId="pool-list" title="ION liquidity pools · local-seed">
          <div className="grid gap-2">
            {poolRows.map((row) => (
              <div key={row.pair} className="grid grid-cols-4 gap-2 rounded-2xl bg-white/[0.04] px-4 py-3 text-sm">
                <span className="font-black text-white">{row.pair}</span>
                <span className="text-cyan-100/70">{row.tvl}</span>
                <span className="text-cyan-100/70">{row.volume}</span>
                <span className="text-right text-amber-200">{row.apr}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
        <div className="grid gap-5">
          <ChartFrame subtitle="LP fee accrual" testId="pool-fee-chart" title="Fee growth">
            <div className="h-40 rounded-[1.2rem] border border-amber-200/15 bg-[#03050f]/50 p-4 text-sm text-amber-100/80">
              Impermanent-loss hint: −0.42% vs HODL · reviewed seed model
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
  return (
    <div className="grid gap-5" data-testid="page-bridge">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={config.metrics}
        title={config.title}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <ChartFrame
          badge={<StatusPill label="Route risk: low" testId="bridge-risk" tone="amber" />}
          subtitle="Est. 8–14 min"
          testId="bridge-status-tracker"
          title="Cross-chain status"
        >
          <div className="grid gap-3" data-testid="bridge-steps">
            {bridgeSteps.map((s) => (
              <div key={s.step} className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3 text-sm">
                <span className="font-black text-white">{s.step}</span>
                <span className="text-cyan-100/65">{s.chain}</span>
                <span className="text-emerald-200">{s.state}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-cyan-100/50">
            Source tx · BSC vault · Target release · Proof links from bridge-status-service (wired next)
          </p>
        </ChartFrame>
        <NeonCard variant="cyan">
          <BridgeTransferPanel />
        </NeonCard>
      </div>
    </div>
  );
}

function BurnDeskPage() {
  const config = pageConfigs.burn;
  return (
    <div className="grid gap-5" data-testid="page-burn">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={[
          { label: "BSC burn", value: "0x…dEaD", tone: "magenta" },
          { label: "ION burn", value: "Indexer v3", tone: "cyan" },
          { label: "Combined", value: "2.41M ION", tone: "gold" },
        ]}
        title={config.title}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartFrame subtitle="Dual-chain trend" testId="burn-trend-chart" title="Burn analytics">
          <div className="flex h-44 items-end gap-2">
            {burnBars.map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-rose-500/40 to-amber-300/90"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-cyan-100/55" data-testid="burn-chain-split">
            Chain split · BSC 58% · ION 42% · remaining supply 97.59M ION · local-seed
          </p>
        </ChartFrame>
        <div className="grid gap-5">
          <GlassPanel testId="burn-proof-links" title="Proof links">
            <p className="font-mono text-xs text-cyan-100/70">BSC: 0x000000000000000000000000000000000000dEaD</p>
            <p className="mt-2 font-mono text-xs text-cyan-100/70">ION: api.mainnet.ice.io/indexer/v3/</p>
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
  return (
    <div className="grid gap-5" data-testid="page-domain">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={config.metrics}
        title={config.title}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <GlassPanel eyebrow="My domains" testId="domain-marketplace" title="Marketplace · dns.ice.io seed">
          <div className="grid gap-2">
            {domainListings.map((d) => (
              <div key={d.name} className="flex justify-between rounded-2xl bg-white/[0.04] px-4 py-3 text-sm">
                <span className="font-black text-cyan-100">{d.name}</span>
                <span className="text-cyan-100/60">{d.status}</span>
                <span className="text-amber-200">{d.price}</span>
              </div>
            ))}
          </div>
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
            <p className="text-sm text-cyan-100/75">KYC Pass L2 · expires 2026-11-30 · profile hub linked</p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

function AIDeskPage() {
  const config = pageConfigs.ai;
  return (
    <div className="grid gap-5" data-testid="page-ai">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={config.metrics}
        title={config.title}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <ChartFrame
          badge={<StatusPill label="Risk: medium" testId="ai-risk-score" tone="amber" />}
          subtitle="ION · 4h horizon"
          testId="ai-market-summary"
          title="Market summary"
        >
          <div className="grid gap-3 sm:grid-cols-2" data-testid="ai-signals">
            {aiSignals.map((s) => (
              <MetricTile key={s.label} label={s.label} tone="cyan" value={s.value} />
            ))}
          </div>
          <p className="mt-4 text-[11px] text-cyan-100/45" data-testid="ai-disclaimer">
            Not investment advice · offline heuristics until ai-market-service streams live inference.
          </p>
        </ChartFrame>
        <div className="grid gap-5">
          <GlassPanel testId="ai-grid-suggestion" title="Grid suggestion">
            <p className="text-sm text-cyan-100/75">Suggested neutral grid 5.6–6.5 ION · 18 levels · Sentinel confidence 71%</p>
          </GlassPanel>
          <GlassPanel testId="ai-prediction-history" title="Prediction history">
            <p className="text-sm text-cyan-100/75">Last 7 calls · 5 aligned · 2 drift · accuracy 71% (local-seed)</p>
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
  const config = pageConfigs.stake;
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

export function BusinessPage({ page }: { page: Exclude<PageKey, "swap"> }) {
  if (page === "trade") {
    return <TradeDeskPage />;
  }
  if (page === "grid") {
    return <GridDeskPage />;
  }
  if (page === "pool") {
    return <PoolDeskPage />;
  }
  if (page === "stake") {
    return <StakeDeskPage />;
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
