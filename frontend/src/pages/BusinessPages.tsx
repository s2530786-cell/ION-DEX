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
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  MarketChart,
  buildSyntheticSeries,
  klinesToChartPoints,
} from "@/components/charts/MarketChart";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import type { PageKey } from "@/components/layout/AppShell";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { ScaffoldNotice } from "@/components/ui/ScaffoldNotice";
import { ChartFrame } from "@/components/ui/glass/ChartFrame";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { MetricTile } from "@/components/ui/glass/MetricTile";
import { PageHero } from "@/components/ui/glass/PageHero";
import { RiskNotice } from "@/components/ui/glass/RiskNotice";
import { StatusPill } from "@/components/ui/glass/StatusPill";
import { useApiResource } from "@/hooks/useApiResource";
import { useI18n } from "@/i18n/I18nProvider";
import {
  fetchBridgeRoutes,
  fetchBurnSummary,
  fetchDomainResolve,
  fetchIonKlines,
  fetchIonPrice,
  fetchStakingSummary,
  formatIonAmount,
  type ApiMeta,
  type BridgeRoutesPayload,
  type BurnSummary,
  type DomainResolution,
  type IonKlinesPayload,
  type IonPricePayload,
  type StakingSummary,
} from "@/lib/ionApi";
import { ION_MAINNET_BURN_SOURCE_PENDING, OFFICIAL_BSC_BURN_ADDRESS } from "@/lib/integrationConfig";

type BusinessPageConfig = {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof BarChart3;
  primaryAction: string;
  metrics: Array<{ label: string; value: string; tone: "cyan" | "magenta" | "gold" }>;
  checklist: string[];
};

export type BusinessPageKey = Exclude<
  PageKey,
  | "swap"
  | "dashboard"
  | "pool"
  | "stake"
  | "trade-pro"
  | "approve-manager"
  | "vault-stake"
  | "copy-trade"
  | "liquidity-mine"
  | "batch-transfer"
  | "settings"
  | "ai-trading"
  | "ai-market"
  | "discover"
  | "portfolio"
>;

function getPageConfigs(isZh: boolean): Record<BusinessPageKey, BusinessPageConfig> {
  return {
    trade: {
      eyebrow: isZh ? "专业交易" : "Professional Trading",
      title: isZh ? "ION 现货订单台" : "ION spot order desk",
      description: isZh
        ? "面向 BNB / ION 交易的市价与限价订单工作台，包含订单簿、费用预览和钱包签名面板。"
        : "Market and limit order desk for BNB / ION trading with order book, fee preview, and wallet signing surfaces.",
      icon: BarChart3,
      primaryAction: isZh ? "创建限价单" : "Create Limit Order",
      metrics: [
        { label: isZh ? "交易对" : "Pair", value: "BNB / ION", tone: "gold" },
        { label: isZh ? "订单类型" : "Order Types", value: isZh ? "市价 + 限价" : "Market + Limit", tone: "cyan" },
        { label: isZh ? "手续费资产" : "Fee Asset", value: "ION", tone: "magenta" },
      ],
      checklist: isZh ? ["订单簿面板", "市场深度图", "ION 费用报价", "钱包安全载荷"] : ["Order book panel", "Market depth chart", "ION fee quote", "Wallet-safe payload"],
    },
    grid: {
      eyebrow: isZh ? "策略自动化" : "Strategy Automation",
      title: isZh ? "链上现货网格" : "On-chain spot grid",
      description: isZh
        ? "提供中性、等差、等比、追踪和止损网格等模式的策略工作台，体验参考 OKX Web3 流程。"
        : "Strategy desk for neutral, arithmetic, geometric, trailing, and stop-grid modes inspired by OKX Web3 flows.",
      icon: LayoutGrid,
      primaryAction: isZh ? "创建网格策略" : "Create Grid Strategy",
      metrics: [
        { label: isZh ? "策略模式" : "Strategies", value: isZh ? "5 种模式" : "5 modes", tone: "cyan" },
        { label: isZh ? "风控守卫" : "Risk Guard", value: "AI Sentinel", tone: "magenta" },
        { label: isZh ? "结算方式" : "Settlement", value: isZh ? "ION 手续费" : "ION fees", tone: "gold" },
      ],
      checklist: isZh ? ["网格边界", "止盈 / 止损", "机器人防护", "策略历史"] : ["Grid bounds", "Take-profit / stop-loss", "Bot defense", "Strategy history"],
    },
    bridge: {
      eyebrow: isZh ? "跨链" : "Cross-chain",
      title: isZh ? "BSC <> ION 跨链桥" : "BSC <> ION bridge",
      description: isZh
        ? "跨链工作台，覆盖 BSC 金库充值、ION 侧释放追踪、中继器健康度和一致性校验。"
        : "Bridge command surface for BSC vault deposits, ION-side release tracking, relayer health, and consistency checks.",
      icon: ArrowLeftRight,
      primaryAction: isZh ? "开始跨链" : "Start Bridge",
      metrics: [
        { label: isZh ? "路线" : "Route", value: "BSC <> ION", tone: "cyan" },
        { label: isZh ? "中继器" : "Relayers", value: isZh ? "多签" : "Multisig", tone: "gold" },
        { label: isZh ? "状态" : "Status", value: isZh ? "设计中" : "Design", tone: "magenta" },
      ],
      checklist: isZh ? ["金库事件", "中继签名阈值", "重放保护", "桥接审计轨迹"] : ["Vault events", "Relayer quorum", "Replay protection", "Bridge audit trail"],
    },
    burn: {
      eyebrow: isZh ? "供应量" : "Supply",
      title: isZh ? "双链销毁追踪" : "Dual-chain burn tracker",
      description: isZh
        ? "销毁看板，聚合 BSC 销毁地址、ION 主网销毁来源、累计销毁量和剩余供应。"
        : "Burn dashboard for BSC burn address, ION mainnet burn source, total burned, and remaining supply.",
      icon: Flame,
      primaryAction: isZh ? "查看销毁图表" : "View Burn Chart",
      metrics: [
        { label: isZh ? "BSC 销毁" : "BSC Burn", value: "0x...dEaD", tone: "magenta" },
        { label: isZh ? "ION 销毁" : "ION Burn", value: isZh ? "官方来源" : "Official source", tone: "cyan" },
        { label: isZh ? "趋势" : "Trend", value: isZh ? "小时 / 日线" : "Hourly / Daily", tone: "gold" },
      ],
      checklist: isZh ? ["BSC 销毁索引", "ION 销毁来源", "趋势图表", "剩余供应"] : ["BSC burn index", "ION burn source", "Trend charts", "Remaining supply"],
    },
    domain: {
      eyebrow: "ION DNS",
      title: isZh ? "域名交易与绑定" : "Domain trading and binding",
      description: isZh
        ? "ION DNS 页面基于官方 DNS FunC 参考实现，并对接 dns.ice.io 社区生态。"
        : "ION DNS surface based on official DNS FunC references and the community dns.ice.io ecosystem.",
      icon: Globe2,
      primaryAction: isZh ? "搜索域名" : "Search Domain",
      metrics: [
        { label: isZh ? "来源" : "Source", value: "dns.ice.io", tone: "cyan" },
        { label: isZh ? "绑定" : "Binding", value: isZh ? "钱包转移" : "Wallet transfer", tone: "gold" },
        { label: isZh ? "合约" : "Contracts", value: isZh ? "官方 DNS 参考" : "Official DNS refs", tone: "magenta" },
      ],
      checklist: isZh ? ["域名搜索 API", "钱包绑定", "域名转移", "DNS 合约审查"] : ["Domain search API", "Wallet binding", "Domain transfer", "DNS contract review"],
    },
    ai: {
      eyebrow: isZh ? "AI 信号" : "AI Signals",
      title: isZh ? "链上 AI 市场分析师" : "On-chain AI market analyst",
      description: isZh
        ? "AI 分析面板用于展示市场信号、异常检测、反机器人评分和策略风险告警。"
        : "AI analysis surface for market signals, anomaly detection, anti-bot scoring, and strategy risk alerts.",
      icon: Bot,
      primaryAction: isZh ? "运行 AI 分析" : "Run AI Analysis",
      metrics: [
        { label: isZh ? "信号" : "Signal", value: isZh ? "看涨 63%" : "Bullish 63%", tone: "cyan" },
        { label: isZh ? "风险" : "Risk", value: isZh ? "中等" : "Medium", tone: "magenta" },
        { label: "Sentinel", value: isZh ? "已武装" : "Armed", tone: "gold" },
      ],
      checklist: isZh ? ["价格预测", "MEV 告警", "异常检测", "策略建议"] : ["Price prediction", "MEV alerts", "Anomaly detection", "Strategy recommendations"],
    },
  };
}

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
  bscBurnAddress: OFFICIAL_BSC_BURN_ADDRESS,
  ionBurnSource: ION_MAINNET_BURN_SOURCE_PENDING,
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
    threshold: "3-of-5 review",
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
  const { isZh } = useI18n();
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
    { label: isZh ? "累计销毁" : "Total Burned", value: `${formatIonAmount(summary.totalBurnedIon)} ION`, tone: "gold" },
    { label: isZh ? "BSC 销毁" : "BSC Burn", value: `${formatIonAmount(summary.bscBurnedIon)} ION`, tone: "magenta" },
    { label: isZh ? "剩余供应" : "Remaining", value: `${formatIonAmount(summary.remainingSupplyIon)} ION`, tone: "cyan" },
  ];

  return <MetricsGrid meta={meta} metrics={metrics} sourceTestId="burn-metrics-source" />;
}

function StakeMetricsRow() {
  const { isZh } = useI18n();
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
    { label: isZh ? "DEX APR" : "DEX APR", value: `${summary.apr.dexPct}%`, tone: "gold" },
    { label: isZh ? "官方质押" : "Official Stake", value: `${formatIonAmount(summary.officialStakedIon)} ION`, tone: "cyan" },
    { label: isZh ? "DEX 质押" : "DEX Stake", value: `${formatIonAmount(summary.dexStakedIon)} ION`, tone: "magenta" },
  ];

  return <MetricsGrid meta={meta} metrics={metrics} sourceTestId="stake-metrics-source" />;
}

function BridgeMetricsRow() {
  const { isZh } = useI18n();
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
    { label: isZh ? "主路线" : "Primary Route", value: primaryLeg, tone: "cyan" },
    { label: isZh ? "中继器" : "Relayers", value: formatTitleCase(payload.relayerStatus), tone: "gold" },
    { label: isZh ? "验证阈值" : "Verifier", value: payload.verifier.threshold, tone: "magenta" },
  ];

  return <MetricsGrid meta={meta} metrics={metrics} sourceTestId="bridge-metrics-source" />;
}

function DomainMetricsRow() {
  const { isZh } = useI18n();
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

  const listingLabel = resolution.available ? (isZh ? "在售" : "On market") : isZh ? "已注册" : "Registered";
  const metrics: MetricCard[] = [
    { label: isZh ? "解析预览" : "Resolver Preview", value: resolution.name, tone: "cyan" },
    { label: isZh ? "注册状态" : "Registry", value: listingLabel, tone: "gold" },
    { label: isZh ? "起售价（离线）" : "Floor (offline)", value: `${resolution.marketplace.floorIon} ION`, tone: "magenta" },
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
  const { isZh } = useI18n();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [submitted, setSubmitted] = useState(false);

  const validation = useMemo(() => {
    const parsedAmount = toPositiveNumber(amount);
    const parsedPrice = orderType === "market" ? TRADE_DESK_DEMO_MARKET_REF : toPositiveNumber(price);
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
          label={isZh ? "方向" : "Side"}
          onChange={setSide}
          options={[
            { label: isZh ? "买入 ION" : "Buy ION", value: "buy" },
            { label: isZh ? "卖出 ION" : "Sell ION", value: "sell" },
          ]}
          testId="trade-side"
          value={side}
        />
        <SegmentedControl
          label={isZh ? "订单" : "Order"}
          onChange={setOrderType}
          options={[
            { label: isZh ? "限价" : "Limit", value: "limit" },
            { label: isZh ? "市价" : "Market", value: "market" },
          ]}
          testId="trade-order-type"
          value={orderType}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <FormField
          label={isZh ? "数量 ION" : "Amount ION"}
          onChange={(value) => {
            setAmount(value);
            setSubmitted(false);
          }}
          hint={isZh ? "示例 1250" : "Example 1250"}
          testId="trade-amount"
          type="number"
          value={amount}
        />
        <FormField
          label={orderType === "market" ? (isZh ? "市价参考" : "Market price") : isZh ? "限价价格" : "Limit price"}
          onChange={(value) => {
            setPrice(value);
            setSubmitted(false);
          }}
          hint={
            orderType === "market"
              ? isZh
                ? `演示市价参考 ${TRADE_DESK_DEMO_MARKET_REF}`
                : `Demo market ref ${TRADE_DESK_DEMO_MARKET_REF}`
              : isZh
                ? "限价参考 6.00"
                : "Limit reference 6.00"
          }
          testId="trade-price"
          type="number"
          value={orderType === "market" ? "" : price}
        />
        <FormField
          label={isZh ? "滑点 %" : "Slippage %"}
          onChange={(value) => {
            setSlippage(value);
            setSubmitted(false);
          }}
          hint={isZh ? "允许范围 0.1 到 5" : "Allowed 0.1 to 5"}
          testId="trade-slippage"
          type="number"
          value={slippage}
        />
      </div>

      {!validation.slippageValid ? (
        <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100" data-testid="trade-error">
          {isZh
            ? "为了确保钱包签名安全，滑点必须保持在 0.1% 到 5% 之间。"
            : "Slippage must stay between 0.1% and 5% for wallet-safe execution."}
        </p>
      ) : null}

      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4 text-sm text-cyan-100/75" data-testid="trade-preview">
        {validation.isValid ? (
          <span>
            {isZh
              ? `正在预览${side === "buy" ? "买入" : "卖出"} ${validation.parsedAmount?.toLocaleString()} ION，订单类型为${orderType === "limit" ? "限价" : "市价"}。预计名义价值：$${validation.notional.toLocaleString(undefined, { maximumFractionDigits: 2 })}。`
              : `${side === "buy" ? "Buying" : "Selling"} ${validation.parsedAmount?.toLocaleString()} ION via ${orderType} order. Estimated notional: $${validation.notional.toLocaleString(undefined, { maximumFractionDigits: 2 })}.`}
          </span>
        ) : (
          <span>
            {isZh
              ? "输入数量、价格和滑点后，可预览适合钱包签名的订单载荷。"
              : "Enter amount, price, and slippage to preview the wallet-safe order payload."}
          </span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="trade-submit" disabled={!validation.isValid} type="submit">
        {isZh ? "预览订单（不提交链上）" : "Preview order (no chain submit)"}
      </NeonButton>

      {submitted ? (
        <p className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] px-4 py-3 text-sm font-bold text-amber-100" data-testid="trade-confirmation">
          {isZh
            ? "订单复核已准备就绪，等待钱包签名与 MM API 提交。"
            : "Order review ready — pending wallet signature and MM API submission."}
        </p>
      ) : null}
    </form>
  );
}

function GridStrategyPanel() {
  const { isZh } = useI18n();
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
        label={isZh ? "网格模式" : "Grid Mode"}
        onChange={setMode}
        options={[
          { label: isZh ? "等差" : "Arithmetic", value: "arithmetic" },
          { label: isZh ? "等比" : "Geometric", value: "geometric" },
        ]}
        testId="grid-mode"
        value={mode}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <FormField
          label={isZh ? "下限" : "Lower"}
          onChange={(value) => {
            setLowerPrice(value);
            setSubmitted(false);
          }}
          hint={isZh ? "下限参考 5.20" : "Lower range reference 5.20"}
          testId="grid-lower"
          type="number"
          value={lowerPrice}
        />
        <FormField
          label={isZh ? "上限" : "Upper"}
          onChange={(value) => {
            setUpperPrice(value);
            setSubmitted(false);
          }}
          hint={isZh ? "上限参考 7.40" : "Upper range reference 7.40"}
          testId="grid-upper"
          type="number"
          value={upperPrice}
        />
        <FormField
          label={isZh ? "网格数" : "Grids"}
          onChange={(value) => {
            setGridCount(value);
            setSubmitted(false);
          }}
          hint={isZh ? "允许范围 2 到 100" : "Allowed 2 to 100"}
          testId="grid-count"
          type="number"
          value={gridCount}
        />
        <FormField
          label={isZh ? "投入 USDT" : "Investment USDT"}
          onChange={(value) => {
            setInvestment(value);
            setSubmitted(false);
          }}
          hint={isZh ? "策略资金参考 2500" : "Strategy capital reference 2500"}
          testId="grid-investment"
          type="number"
          value={investment}
        />
      </div>

      {!validation.boundsValid && lowerPrice && upperPrice ? (
        <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100" data-testid="grid-error">
          {isZh
            ? "策略启用前，上限价格必须大于下限价格。"
            : "Upper price must be greater than lower price before the strategy can be armed."}
        </p>
      ) : null}

      <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/[0.05] p-4 text-sm text-fuchsia-100/75" data-testid="grid-preview">
        {validation.isValid ? (
          <span>
            {isZh
              ? `${mode === "arithmetic" ? "等差" : "等比"}网格区间：$${validation.lower?.toLocaleString()} 到 $${validation.upper?.toLocaleString()}，共 ${gridCount} 层。预估步长：$${validation.step.toLocaleString(undefined, { maximumFractionDigits: 4 })}。`
              : `${mode} grid from $${validation.lower?.toLocaleString()} to $${validation.upper?.toLocaleString()} with ${gridCount} levels. Approx step: $${validation.step.toLocaleString(undefined, { maximumFractionDigits: 4 })}.`}
          </span>
        ) : (
          <span>
            {isZh
              ? "设置区间、网格数和投入金额后，可预览受 AI Sentinel 保护的策略参数。"
              : "Set bounds, grid count, and investment to preview AI Sentinel guarded strategy parameters."}
          </span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="grid-submit" disabled={!validation.isValid} type="submit">
        {isZh ? "创建网格策略" : "Create Grid Strategy"}
      </NeonButton>

      {submitted ? (
        <p className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100" data-testid="grid-confirmation">
          {isZh
            ? "策略复核已准备就绪。AI Sentinel 检查和钱包执行仍保持在合约接入前的门控状态。"
            : "Strategy review ready. AI Sentinel checks and wallet execution stay gated for contract integration."}
        </p>
      ) : null}
    </form>
  );
}

const DEX_ADVERTISED_APR_PERCENT = 25.5;

function PoolLiquidityPanel() {
  const { isZh } = useI18n();
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
          label={isZh ? "存入 BNB" : "Deposit BNB"}
          onChange={(value) => {
            setBnbAmount(value);
            setSubmitted(false);
          }}
          hint={isZh ? "BNB 侧数量" : "BNB side amount"}
          testId="pool-bnb"
          type="number"
          value={bnbAmount}
        />
        <FormField
          label={isZh ? "存入 ION" : "Deposit ION"}
          onChange={(value) => {
            setIonAmount(value);
            setSubmitted(false);
          }}
          hint={isZh ? "ION 侧数量" : "ION side amount"}
          testId="pool-ion"
          type="number"
          value={ionAmount}
        />
        <FormField
          label={isZh ? "滑点 %" : "Slippage %"}
          onChange={(value) => {
            setSlippage(value);
            setSubmitted(false);
          }}
          hint={isZh ? "允许范围 0.1 到 5" : "Allowed 0.1 to 5"}
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
          {isZh
            ? "在链上铸造 LP 份额前，滑点必须保持在 0.1% 到 5% 之间。"
            : "Slippage must stay between 0.1% and 5% before minting LP shares on-chain."}
        </p>
      ) : null}

      <div
        className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4 text-sm text-cyan-100/75"
        data-testid="pool-preview"
      >
        {validation.isValid ? (
          <span>
            {isZh ? (
              <>
                流动性预览：{bnbAmount} BNB + {ionAmount} ION · 配比{" "}
                {validation.ratio !== null ? validation.ratio.toFixed(6) : "—"} BNB / ION · 最大滑点 {slippage}%
              </>
            ) : (
              <>
                Liquidity preview: {bnbAmount} BNB + {ionAmount} ION · ratio{" "}
                {validation.ratio !== null ? validation.ratio.toFixed(6) : "—"} BNB per ION · max slip {slippage}%
              </>
            )}
          </span>
        ) : (
          <span>
            {isZh
              ? "输入成对的存入数量和滑点后，可预览适合钱包签名的 BNB / ION 铸造参数。"
              : "Enter paired deposits and slippage to preview wallet-safe mint parameters for BNB / ION."}
          </span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="pool-submit" disabled={!validation.isValid} type="submit">
        {isZh ? "添加流动性" : "Add Liquidity"}
      </NeonButton>

      {submitted ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
          data-testid="pool-confirmation"
        >
          {isZh
            ? "流动性复核已准备好进入钱包签名。铸造与 LP 预言机钩子仍受合约集成进度控制。"
            : "Liquidity review ready for wallet signing. Mint and LP oracle hooks stay gated behind contract integration."}
        </p>
      ) : null}
    </form>
  );
}

function StakeHubPanel() {
  const { isZh } = useI18n();
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
        label={isZh ? "操作" : "Action"}
        onChange={(next) => {
          setMode(next);
          setSubmitted(false);
        }}
        options={[
          { label: isZh ? "质押 ION" : "Stake ION", value: "stake" },
          { label: isZh ? "解除质押 ION" : "Unstake ION", value: "unstake" },
        ]}
        testId="stake-mode"
        value={mode}
      />

      <FormField
        label={isZh ? "数量 ION" : "Amount ION"}
        onChange={(value) => {
          setAmount(value);
          setSubmitted(false);
        }}
        hint={isZh ? "参考数量 500" : "Stake amount reference 500"}
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
            {isZh
              ? `${mode === "stake" ? "质押" : "解除质押"}预览：${amount} ION · 当前展示 DEX 年化 ${DEX_ADVERTISED_APR_PERCENT}% · 归属与解除质押队列将在后续由合约执行。`
              : `${mode === "stake" ? "Stake" : "Unstake"} preview: ${amount} ION · advertised DEX APR ${DEX_ADVERTISED_APR_PERCENT}% · vesting and unstake queue enforced by contracts later.`}
          </span>
        ) : (
          <span>
            {isZh
              ? "输入数量后，可预览资金安全的质押载荷，以及指标卡展示的 APR 假设。"
              : "Enter an amount to preview treasury-safe staking payloads and APR assumptions from the hub metrics card."}
          </span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="stake-submit" disabled={!validation.isValid} type="submit">
        {mode === "stake" ? (isZh ? "质押 ION" : "Stake ION") : isZh ? "解除质押 ION" : "Unstake ION"}
      </NeonButton>

      {submitted ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
          data-testid="stake-confirmation"
        >
          {mode === "stake"
            ? isZh
              ? "质押复核已准备好进入钱包签名。奖励流仍受质押合约接线进度控制。"
              : "Stake review ready for wallet signing. Reward streams stay gated behind staking contract wiring."
            : isZh
              ? "解除质押复核已准备好进入钱包签名。冷却规则仍受质押合约接线进度控制。"
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
  const { isZh } = useI18n();
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
        label={isZh ? "路线" : "Route"}
        onChange={(next) => {
          setDirection(next);
          setSubmitted(false);
        }}
        options={[
          { label: isZh ? "BSC → ION 链" : "BSC → ION", value: "bsc-ion" },
          { label: isZh ? "ION 链 → BSC" : "ION → BSC", value: "ion-bsc" },
        ]}
        testId="bridge-direction"
        value={direction}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <FormField
          label={isZh ? "数量 ION" : "Amount ION"}
          onChange={(value) => {
            setAmount(value);
            setSubmitted(false);
          }}
          hint={isZh ? "跨链数量参考 950" : "Bridge amount reference 950"}
          testId="bridge-amount"
          type="number"
          value={amount}
        />
        <FormField
          label={isZh ? "目标地址 / 备注" : "Destination address / memo"}
          onChange={(value) => {
            setDestination(value);
            setSubmitted(false);
          }}
          hint={isZh ? "ION 或 EVM 目标地址" : "ION or EVM destination"}
          testId="bridge-destination"
          type="text"
          value={destination}
        />
      </div>

      {!validation.destinationValid && destination.trim().length > 0 ? (
        <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100" data-testid="bridge-error">
          {isZh
            ? "在钱包解析为标准地址前，目标备注至少需要保持 8 个字符。"
            : "Destination memo must stay at least 8 characters until wallet resolution maps it to canonical addresses."}
        </p>
      ) : null}

      <div
        className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4 text-sm text-cyan-100/75"
        data-testid="bridge-preview"
      >
        {validation.isValid ? (
          <span>
            {isZh
              ? `跨链预览：路线 ${direction === "bsc-ion" ? "BSC → ION 链" : "ION 链 → BSC"} · 归集 ${validation.parsedAmount?.toLocaleString()} ION · 中继器法定人数与重放保护仍受合约控制。`
              : `Bridge preview: route ${direction === "bsc-ion" ? "BSC → ION Chain" : "ION Chain → BSC"} · sweep ${validation.parsedAmount?.toLocaleString()} ION · relayer quorum and replay guards remain contract gated.`}
          </span>
        ) : (
          <span>
            {isZh
              ? "设置正数归集数量和可靠的目标备注后，可离线模拟金库证明。"
              : "Set a positive sweep amount and resilient destination memo to simulate vault attestations offline."}
          </span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="bridge-submit" disabled={!validation.isValid} type="submit">
        {isZh ? "预演跨链归集" : "Stage Bridge Sweep"}
      </NeonButton>

      {submitted ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
          data-testid="bridge-confirmation"
        >
          {isZh
            ? "跨链转移复核已准备好进入中继器法定人数与钱包证明阶段。托管签名在最终批准前仍保持离线。"
            : "Bridge transfer review ready for relayer quorum and wallet proofs. Custody signatures stay offline until final approval."}
        </p>
      ) : null}
    </form>
  );
}

function BurnAnalyticsPanel() {
  const { isZh } = useI18n();
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
        label={isZh ? "链路视角" : "Chain Lens"}
        onChange={(next) => {
          setChain(next);
          setSubmitted(false);
        }}
        options={[
          { label: isZh ? "BSC 销毁台账" : "BSC burn ledger", value: "bsc" },
          { label: isZh ? "ION 销毁台账" : "ION burn ledger", value: "ion" },
        ]}
        testId="burn-chain"
        value={chain}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <FormField
          label={isZh ? "观测销毁量（ION）" : "Observed burn (ION)"}
          onChange={(value) => {
            setAmount(value);
            setSubmitted(false);
          }}
          hint={isZh ? "销毁量参考 125000" : "Burn amount reference 125000"}
          testId="burn-amount"
          type="number"
          value={amount}
        />
        <FormField
          label={isZh ? "佐证备注" : "Attestation memo"}
          onChange={(value) => {
            setMemo(value);
            setSubmitted(false);
          }}
          hint={isZh ? "供金库审计复核的备注" : "Audit note for treasury review"}
          testId="burn-memo"
          type="text"
          value={memo}
        />
      </div>

      {!validation.memoValid ? (
        <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100" data-testid="burn-error">
          {isZh
            ? "为保证 Sentinel 日志安全叠加，备注长度必须不超过 120 个字符。"
            : "Memo must stay ≤ 120 chars for sentinel-safe logging overlays."}
        </p>
      ) : null}

      <div
        className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-4 text-sm text-amber-100/80"
        data-testid="burn-preview"
      >
        {validation.isValid ? (
          <span>
            {isZh
              ? `销毁预览：${chain.toUpperCase()} 链上 ${validation.parsedAmount?.toLocaleString()} ION · 双链索引器上线后会自动对账金库分账。`
              : `Burn preview: ${validation.parsedAmount?.toLocaleString()} ION on ${chain.toUpperCase()} · dual-chain indexer will reconcile treasury splits once workers land.`}
          </span>
        ) : (
          <span>
            {isZh
              ? "输入需要追踪的销毁规模，并可附加备注，用于金库透明化轨道。"
              : "Provide a tracked burn magnitude plus optional memo hooks for treasury transparency rails."}
          </span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="burn-submit" disabled={!validation.isValid} type="submit">
        {isZh ? "复核销毁说明" : "Review Burn Narrative"}
      </NeonButton>

      {submitted ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
          data-testid="burn-confirmation"
        >
          {isZh
            ? "销毁分析复核已准备就绪，可进入双链 Sentinel 回放。本页不会发送任何链上交易。"
            : "Burn analytics review ready for dual-chain sentinel playback. No on-chain transaction is sent from this page."}
        </p>
      ) : null}
    </form>
  );
}

function DomainTradingPanel() {
  const { isZh } = useI18n();
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
        label={isZh ? "流程" : "Flow"}
        onChange={(next) => {
          setMode(next);
          setSubmitted(false);
        }}
        options={[
          { label: isZh ? "搜索域名" : "Search label", value: "search" },
          { label: isZh ? "绑定别名" : "Bind alias", value: "bind" },
        ]}
        testId="domain-mode"
        value={mode}
      />

      <FormField
        label={isZh ? "DNS / .ion 标签" : "DNS / .ion label"}
        onChange={(value) => {
          setQuery(value);
          setSubmitted(false);
        }}
        hint={isZh ? "参考域名 custodian.ion" : "Domain reference custodian.ion"}
        testId="domain-query"
        type="text"
        value={query}
      />

      {query.trim().length > 0 && !validation.labelValid ? (
        <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100" data-testid="domain-error">
          {isZh
            ? "请输入带点分段的小写标签（兼容 dns.ice.io），再进入 FunC 接线阶段。"
            : "Enter a lowercase label with dotted segments (dns.ice.io compatible) before FUN wiring."}
        </p>
      ) : null}

      <div
        className="rounded-2xl border border-indigo-300/25 bg-indigo-400/[0.07] p-4 text-sm text-indigo-100/80"
        data-testid="domain-preview"
      >
        {validation.isValid ? (
          <span>
            {isZh ? (
              <>
                域名预览：{mode === "search" ? "查询" : "绑定"}{" "}
                <span className="font-mono text-white">{query.trim().toLowerCase()}</span>，使用官方 DNS FunC 结构和钱包签名载荷进入复核。
              </>
            ) : (
              <>
                Domain preview: {mode === "search" ? "Lookup" : "Bind"}{" "}
                <span className="font-mono text-white">{query.trim().toLowerCase()}</span> using official DNS FunC schemas + wallet-signed
                payloads for wallet review.
              </>
            )}
          </span>
        ) : (
          <span>
            {isZh
              ? "使用兼容 dns.ice.io 的标签，可在不触碰验证器的前提下预演钱包证明。"
              : "Use dns.ice.io compatible labels to rehearsal wallet proofs without touching validators."}
          </span>
        )}
      </div>

      <NeonButton className="w-full sm:w-fit" data-testid="domain-submit" disabled={!validation.isValid} type="submit">
        {isZh ? "生成 DNS 载荷" : "Compose DNS Payload"}
      </NeonButton>

      {submitted ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
          data-testid="domain-confirmation"
        >
          {isZh
            ? "域名握手已准备就绪。解析器交易会在该钱包可访问 DNS 合约前继续保持阻塞。"
            : "Domain handshake ready. Resolver transactions stay blocked until DNS contracts are reachable from this wallet."}
        </p>
      ) : null}
    </form>
  );
}

function AIMarketPanel() {
  const { isZh } = useI18n();
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
        label={isZh ? "交易符号" : "Symbol"}
        onChange={(value) => {
          setSymbol(value);
          setSubmitted(false);
        }}
        hint={isZh ? "参考代码 ION" : "Ticker reference ION"}
        testId="ai-symbol"
        type="text"
        value={symbol}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <SegmentedControl
          label={isZh ? "时间范围" : "Horizon"}
          onChange={(next) => {
            setHorizon(next);
            setSubmitted(false);
          }}
          options={[
            { label: isZh ? "脉冲 1h" : "Pulse 1h", value: "1h" },
            { label: isZh ? "核心 4h" : "Core 4h", value: "4h" },
            { label: isZh ? "宏观 1d" : "Macro 1d", value: "1d" },
          ]}
          testId="ai-horizon"
          value={horizon}
        />
        <SegmentedControl
          label={isZh ? "分析深度" : "Depth"}
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

const TRADE_DESK_DEMO_MARKET_REF = 6.02;

// [PREVIEW-ONLY] Replace with live data source once backend endpoint is ready
const tradeOrderBook = [
  { side: "ask" as const, price: "6.038", amount: "1,240", depth: "72%" },
  { side: "ask" as const, price: "6.031", amount: "860", depth: "58%" },
  { side: "bid" as const, price: "6.024", amount: "920", depth: "61%" },
  { side: "bid" as const, price: "6.018", amount: "1,480", depth: "80%" },
] as const;

// [PREVIEW-ONLY] Replace with live data source once backend endpoint is ready
const marketTrades = [
  ["6.024", "420 ION", "Buy"],
  ["6.022", "180 ION", "Sell"],
  ["6.026", "96 ION", "Buy"],
] as const;

// [PREVIEW-ONLY] Replace with live data source once backend endpoint is ready
const orderHistory = [
  ["Limit buy", "420 ION", "Open"],
  ["TWAP sell", "1,200 ION", "Partial"],
  ["Stop guard", "—", "Armed"],
] as const;

function TradeDeskPage() {
  const { isZh } = useI18n();
  const config = getPageConfigs(isZh).trade;
  const fetchKlines = useCallback(
    (signal: AbortSignal) => fetchIonKlines(64, signal),
    [],
  );
  const fetchPrice = useCallback((signal: AbortSignal) => fetchIonPrice(signal), []);
  const fallbackPrice: IonPricePayload = {
    priceUsd: TRADE_DESK_DEMO_MARKET_REF,
    change24hPct: 0,
    volume24hUsd: null,
    liquidityUsd: null,
    source: "fallback",
    note: "Trade desk fallback quote.",
    poolAddress: "0x6487725b383954e05ca56f3c2b93a104b3dd2c25",
    updatedAt: new Date().toISOString(),
  };
  const emptyKlines: IonKlinesPayload = { timeframe: "1h", candles: [], source: "pending" };
  const klines = useApiResource(fetchKlines, emptyKlines, { isEmpty: () => false });
  const ionPrice = useApiResource(fetchPrice, fallbackPrice, { isEmpty: () => false });

  const chartPoints = useMemo(() => {
    if (klines.data.candles.length > 0) {
      return klinesToChartPoints(klines.data.candles);
    }
    return buildSyntheticSeries(ionPrice.data.priceUsd, ionPrice.data.change24hPct);
  }, [ionPrice.data.change24hPct, ionPrice.data.priceUsd, klines.data.candles]);

  const liveKlines = klines.data.candles.length > 0;
  const displayPrice = ionPrice.data.priceUsd.toFixed(3);

  return (
    <div className="grid min-w-0 gap-5" data-testid="page-trade">
      <ScaffoldNotice
        detail={
          isZh
            ? "Trade K 线经后端 /api/klines/ion（GeckoTerminal OHLCV）；盘口与成交流仍为演示数据。Swap 在后端在线时可走 GeckoTerminal 报价。"
            : "Trade K-lines come from backend /api/klines/ion via GeckoTerminal OHLCV. Order book and market tape are still demo data. Swap can use GeckoTerminal-backed quotes when the backend is online."
        }
        testId="trade-desk-scaffold-notice"
      />
      <NeonCard variant="mixed">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-cyan-200/70">{config.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl lg:text-5xl" data-testid="page-title">
              {config.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-cyan-100/68">{config.description}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {config.metrics.map((metric) => (
              <MetricCardView key={metric.label} metric={metric} />
            ))}
          </div>
        </div>
      </NeonCard>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="grid min-w-0 gap-5">
          <div className="flow-border rounded-[2rem] p-px" data-testid="trade-chart">
            <div className="glass-surface relative min-h-[20rem] overflow-hidden rounded-[2rem] p-4 sm:min-h-[24rem] sm:p-5 lg:min-h-[28rem]">
              <div className="absolute inset-0 aurora-noise opacity-70" />
              <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_220deg,rgba(36,247,255,0.24),transparent_28%,rgba(255,59,212,0.3),transparent_58%,rgba(255,209,102,0.16),transparent_82%)] blur-3xl" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/45">
                    BNB / ION {liveKlines ? (isZh ? "（实时 K 线）" : "(live klines)") : isZh ? "（合成回退）" : "(synthetic fallback)"}
                  </p>
                  <p className="mt-1 text-3xl font-black text-white" data-testid="trade-ion-price">
                    {displayPrice}
                  </p>
                </div>
                <DataSourceBadge meta={klines.meta ?? ionPrice.meta} testId="trade-chart-source" />
              </div>
              <div className="relative z-10 mt-6 rounded-[1.6rem] border border-cyan-200/15 bg-[#03050f]/62 p-3 shadow-[0_24px_60px_rgba(36,247,255,0.1)] sm:mt-8">
                {chartPoints.length > 0 ? (
                  <MarketChart points={chartPoints} testId="trade-market-chart" />
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <OpenOrdersPanel />
            <MarketTape />
          </div>
          <OrderHistoryPanel />
          <CopyTradePanel />
        </div>

        <div className="grid gap-5">
          <NeonCard variant="magenta">
            <p className="mb-4 text-sm uppercase tracking-[0.28em] text-fuchsia-200/70">{isZh ? "限价订单" : "Limit order"}</p>
            <TradeOrderPanel />
          </NeonCard>
          <OrderBookPanel />
        </div>
      </div>
    </div>
  );
}

function OrderBookPanel() {
  const { isZh } = useI18n();
  return (
    <NeonCard variant="cyan">
      <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">{isZh ? "订单簿" : "Order book"}</p>
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
  const { isZh } = useI18n();
  return (
    <NeonCard variant="cyan">
      <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">{isZh ? "市场成交" : "Market trades"}</p>
      <div className="mt-4 grid gap-3" data-testid="trade-market-trades">
        {marketTrades.map(([price, amount, side]) => (
          <div key={`${price}-${amount}`} className="glass-surface grid grid-cols-3 rounded-2xl px-4 py-3 text-sm">
            <span className={side === "Buy" ? "font-black text-emerald-200" : "font-black text-rose-200"}>{price}</span>
            <span className="text-cyan-100/70">{amount}</span>
            <span className="text-right text-cyan-100/50">{side === "Buy" ? (isZh ? "买入" : "Buy") : isZh ? "卖出" : "Sell"}</span>
          </div>
        ))}
      </div>
    </NeonCard>
  );
}

const openOrders = [
  { id: "ord-1042", side: "Buy", price: "5.98", amount: "800 ION", status: "Open" },
  { id: "ord-1038", side: "Sell", price: "6.12", amount: "420 ION", status: "Partial" },
] as const;

function OpenOrdersPanel() {
  const { isZh } = useI18n();
  return (
    <NeonCard variant="magenta">
      <p className="text-sm uppercase tracking-[0.28em] text-violet-200/70">{isZh ? "当前挂单" : "Open orders"}</p>
      <div className="mt-4 grid gap-2" data-testid="trade-open-orders">
        {openOrders.map((row) => (
          <div key={row.id} className="glass-surface grid grid-cols-4 gap-2 rounded-2xl px-4 py-3 text-sm">
            <span className="font-black text-white">{row.side === "Buy" ? (isZh ? "买入" : "Buy") : isZh ? "卖出" : "Sell"}</span>
            <span className="text-cyan-100/70">{row.price}</span>
            <span className="text-cyan-100/70">{row.amount}</span>
            <span className="text-right text-violet-200">{row.status === "Open" ? (isZh ? "挂单中" : "Open") : isZh ? "部分成交" : "Partial"}</span>
          </div>
        ))}
      </div>
    </NeonCard>
  );
}

function CopyTradePanel() {
  const { isZh } = useI18n();
  const [leader, setLeader] = useState("");
  const [ratio, setRatio] = useState("25");
  const [maxSlippage, setMaxSlippage] = useState("0.8");
  const [armed, setArmed] = useState(false);

  const valid =
    leader.trim().length >= 6 &&
    toPositiveNumber(ratio) !== null &&
    toPositiveNumber(maxSlippage) !== null;

  return (
    <GlassPanel eyebrow={isZh ? "社交交易" : "Social trading"} testId="trade-copy-trade" title={isZh ? "跟单交易台" : "Copy trading desk"}>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) {
            setArmed(true);
          }
        }}
      >
        <FormField
          label={isZh ? "带单地址 / .ion" : "Leader wallet / .ion"}
          onChange={(value) => {
            setLeader(value);
            setArmed(false);
          }}
          hint={isZh ? "示例 trader.ion" : "Example trader.ion"}
          testId="copy-leader"
          value={leader}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label={isZh ? "跟单比例 %" : "Copy ratio %"}
            onChange={(value) => {
              setRatio(value);
              setArmed(false);
            }}
            hint={isZh ? "范围 5 到 100" : "5 — 100"}
            testId="copy-ratio"
            type="number"
            value={ratio}
          />
          <FormField
            label={isZh ? "最大滑点 %" : "Max slippage %"}
            onChange={(value) => {
              setMaxSlippage(value);
              setArmed(false);
            }}
            hint={isZh ? "范围 0.1 到 2" : "0.1 — 2"}
            testId="copy-slippage"
            type="number"
            value={maxSlippage}
          />
        </div>
        <NeonButton className="w-full sm:w-fit" data-testid="copy-arm" disabled={!valid} type="submit">
          {isZh ? "启用跟单策略" : "Arm copy strategy"}
        </NeonButton>
        {armed ? (
          <p className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100" data-testid="copy-confirmation">
            {isZh
              ? "跟单复核已准备就绪。钱包签名后会通过 ION 限价单 keeper 执行。"
              : "Copy-trading review ready. Execution routes through ION limit-order keeper when wallet signs."}
          </p>
        ) : null}
      </form>
    </GlassPanel>
  );
}

function OrderHistoryPanel() {
  const { isZh } = useI18n();
  return (
    <NeonCard variant="gold">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.28em] text-amber-200/70">{isZh ? "订单与风险" : "Orders and risk"}</p>
        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-3 py-1 text-xs font-black text-emerald-100">
          {isZh ? "TWAP 守卫已启用" : "TWAP guard active"}
        </span>
      </div>
      <div className="mt-4 grid gap-3" data-testid="trade-history">
        {orderHistory.map(([kind, amount, status]) => (
          <div key={`${kind}-${amount}`} className="glass-surface grid grid-cols-3 rounded-2xl px-4 py-3 text-sm">
            <span className="font-black text-white">
              {kind === "Limit buy" ? (isZh ? "限价买入" : "Limit buy") : kind === "TWAP sell" ? (isZh ? "TWAP 卖出" : "TWAP sell") : isZh ? "止损守卫" : "Stop guard"}
            </span>
            <span className="text-cyan-100/70">{amount}</span>
            <span className="text-right text-amber-100/80">{status === "Open" ? (isZh ? "进行中" : "Open") : status === "Partial" ? (isZh ? "部分成交" : "Partial") : isZh ? "已武装" : "Armed"}</span>
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
  const { isZh } = useI18n();
  const config = getPageConfigs(isZh).grid;
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
            badge={<StatusPill label={isZh ? "AI Sentinel 已武装" : "AI Sentinel armed"} testId="grid-sentinel" tone="emerald" />}
            subtitle="5.20 — 7.40 ION"
            testId="grid-range-chart"
            title={isZh ? "区间可视化" : "Range visualization"}
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
              {isZh ? "回测预览 · 本地种子回放 · 30 天中性网格，扣除 ION 手续费后净收益 +0.8%" : "Backtest preview · local-seed replay · 30d neutral grid +0.8% net of ION fees"}
            </p>
          </ChartFrame>
          <GlassPanel eyebrow={isZh ? "策略日志" : "Strategy log"} testId="grid-strategy-log" title={isZh ? "机器人时间线" : "Live bot timeline"}>
            <div className="grid gap-2">
              {gridLogs.map(([title, detail, time]) => (
                <div key={title} className="grid grid-cols-3 gap-2 rounded-2xl bg-white/[0.04] px-3 py-2 text-sm">
                  <span className="font-black text-white">{title === "Rebalance #42" ? (isZh ? "再平衡 #42" : "Rebalance #42") : title === "TP guard" ? (isZh ? "止盈守卫" : "TP guard") : "Sentinel"}</span>
                  <span className="text-cyan-100/70">{detail === "Filled · 420 ION" ? (isZh ? "已成交 · 420 ION" : "Filled · 420 ION") : detail === "Held · range intact" ? (isZh ? "持仓中 · 区间完好" : "Held · range intact") : isZh ? "未发现 MEV 异常" : "No MEV flag"}</span>
                  <span className="text-right text-cyan-100/45">{time === "2m ago" ? (isZh ? "2 分钟前" : "2m ago") : time === "14m ago" ? (isZh ? "14 分钟前" : "14m ago") : isZh ? "1 小时前" : "1h ago"}</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
        <div className="grid gap-5">
          <NeonCard variant="magenta">
            <p className="mb-3 text-sm uppercase tracking-[0.28em] text-fuchsia-200/70">{isZh ? "策略模板" : "Strategy templates"}</p>
            <div className="grid gap-2" data-testid="grid-templates">
              {gridTemplates.map((t) => (
                <GlassPanel key={t.name} className="!p-3">
                  <p className="font-black text-white">{t.name === "Neutral grid" ? (isZh ? "中性网格" : "Neutral grid") : t.name === "Arithmetic" ? (isZh ? "等差网格" : "Arithmetic") : isZh ? "追踪网格" : "Trailing grid"}</p>
                  <p className="text-xs text-cyan-100/60">
                    APR {t.apr} · {t.status === "Armed" ? (isZh ? "已武装" : "Armed") : t.status === "Preview" ? (isZh ? "预览中" : "Preview") : isZh ? "AI 守卫中" : "AI guarded"}
                  </p>
                </GlassPanel>
              ))}
            </div>
          </NeonCard>
          <RiskNotice
            body={isZh ? "网格区间、投入金额和滑点都必须先通过 Sentinel 审核，才会进入钱包签名。报价采用后端 bigint-floor 数学。" : "Grid bounds, investment, and slippage must pass Sentinel before wallet signing. Quotes use backend bigint-floor math."}
            testId="grid-ai-suggestion"
            title={isZh ? "AI 建议" : "AI suggestion"}
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

function BridgeDeskPage() {
  const { isZh } = useI18n();
  const config = getPageConfigs(isZh).bridge;
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
          badge={<StatusPill label={isZh ? "路线风险：低" : "Route risk: low"} testId="bridge-risk" tone="amber" />}
          subtitle={isZh ? "预计 8–14 分钟" : "Est. 8–14 min"}
          testId="bridge-status-tracker"
          title={isZh ? "跨链状态" : "Cross-chain status"}
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
            {isZh
              ? "源链交易 · BSC 金库 · 目标链释放 · 证明链接来自 bridge-status-service（下一步接线）"
              : "Source tx · BSC vault · Target release · Proof links from bridge-status-service (wired next)"}
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
  const { isZh } = useI18n();
  const config = getPageConfigs(isZh).burn;
  return (
    <div className="grid gap-5" data-testid="page-burn">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={config.metrics}
        title={config.title}
      />
      <BurnMetricsRow />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartFrame subtitle={isZh ? "双链趋势" : "Dual-chain trend"} testId="burn-trend-chart" title={isZh ? "销毁分析" : "Burn analytics"}>
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
            {isZh ? "链路拆分 · BSC 58% · ION 42% · 剩余供应 97.59M ION · 本地种子" : "Chain split · BSC 58% · ION 42% · remaining supply 97.59M ION · local-seed"}
          </p>
        </ChartFrame>
        <div className="grid gap-5">
          <GlassPanel testId="burn-proof-links" title={isZh ? "证明链接" : "Proof links"}>
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
  const { isZh } = useI18n();
  const config = getPageConfigs(isZh).domain;
  return (
    <div className="grid gap-5" data-testid="page-domain">
      <PageHero
        description={config.description}
        eyebrow={config.eyebrow}
        icon={config.icon}
        metrics={config.metrics}
        title={config.title}
      />
      <DomainMetricsRow />
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <GlassPanel
          eyebrow={isZh ? "我的域名" : "My domains"}
          testId="domain-marketplace"
          title={isZh ? "市场 · dns.ice.io 种子数据" : "Marketplace · dns.ice.io seed"}
        >
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
            body={
              isZh
                ? "发起向域名转账前会先做同形字和钓鱼检查，解析结果必须与钱包绑定的 .ion 记录一致。"
                : "Homoglyph and phishing checks run before send-to-domain signing. Resolver must match wallet-bound .ion record."
            }
            testId="domain-phishing-warn"
            title={isZh ? "钓鱼防护" : "Phishing guard"}
            tone="amber"
          />
          <NeonCard variant="cyan">
            <DomainTradingPanel />
          </NeonCard>
          <GlassPanel testId="domain-ion-id" title="ION ID / KYC">
            <p className="text-sm text-cyan-100/75">
              {isZh ? "KYC Pass L2 · 到期 2026-11-30 · 已绑定到 Profile Hub" : "KYC Pass L2 · expires 2026-11-30 · profile hub linked"}
            </p>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

function AIDeskPage() {
  const { isZh } = useI18n();
  const config = getPageConfigs(isZh).ai;
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
          badge={<StatusPill label={isZh ? "风险：中等" : "Risk: medium"} testId="ai-risk-score" tone="amber" />}
          subtitle={isZh ? "ION · 4 小时时间窗" : "ION · 4h horizon"}
          testId="ai-market-summary"
          title={isZh ? "市场摘要" : "Market summary"}
        >
          <div className="grid gap-3 sm:grid-cols-2" data-testid="ai-signals">
            {aiSignals.map((s) => (
              <MetricTile key={s.label} label={s.label} tone="cyan" value={s.value} />
            ))}
          </div>
          <p className="mt-4 text-[11px] text-cyan-100/45" data-testid="ai-disclaimer">
            {isZh
              ? "这不是投资建议 · 在 ai-market-service 接入实时推理前，当前结果基于离线启发式。"
              : "Not investment advice · offline heuristics until ai-market-service streams live inference."}
          </p>
        </ChartFrame>
        <div className="grid gap-5">
          <GlassPanel testId="ai-grid-suggestion" title={isZh ? "网格建议" : "Grid suggestion"}>
            <p className="text-sm text-cyan-100/75">
              {isZh ? "建议中性网格 5.6–6.5 ION · 18 层 · Sentinel 置信度 71%" : "Suggested neutral grid 5.6–6.5 ION · 18 levels · Sentinel confidence 71%"}
            </p>
          </GlassPanel>
          <GlassPanel testId="ai-prediction-history" title={isZh ? "预测历史" : "Prediction history"}>
            <p className="text-sm text-cyan-100/75">
              {isZh ? "最近 7 次判断 · 5 次一致 · 2 次偏移 · 准确率 71%（本地种子）" : "Last 7 calls · 5 aligned · 2 drift · accuracy 71% (local-seed)"}
            </p>
          </GlassPanel>
          <NeonCard variant="mixed" className="!shadow-neonCyan">
            <AIMarketPanel />
          </NeonCard>
        </div>
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
