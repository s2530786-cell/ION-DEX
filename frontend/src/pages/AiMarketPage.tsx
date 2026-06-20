import { useCallback, useMemo, useState, type ReactNode } from "react";
import AiStrategyConfig from "@/components/ai/AiStrategyConfig";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { DEXGridHarness } from "@/components/layout/DEXGridHarness";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { useApiResource } from "@/hooks/useApiResource";
import { useI18n } from "@/i18n/I18nProvider";
import {
  createAiStrategy,
  fetchAiStrategies,
  simulateAiStrategy,
  type AiRiskLevel,
  type AiStrategy,
  type AiStrategyCreateInput,
  type AiStrategyType,
} from "@/lib/ionApi";
import { DesignTokens as dt } from "@/lib/design-tokens";

type RiskFilter = "All" | AiRiskLevel;
type SortKey = "returnRate" | "runtime" | "fundSize";
type TypeFilter = "All" | AiStrategyType;

const riskOptions: RiskFilter[] = ["All", "Low", "Medium", "High"];
const typeOptions: TypeFilter[] = ["All", "grid", "trend", "arbitrage", "market_making"];
const emptyStrategyList: AiStrategy[] = [];

const riskColors: Record<AiRiskLevel, string> = {
  Low: dt.colors.neonGreen,
  Medium: dt.colors.warning,
  High: dt.colors.negative,
};

const typeLabels: Record<AiStrategyType, string> = {
  grid: "Grid",
  trend: "Trend",
  arbitrage: "Arbitrage",
  market_making: "Market Making",
};

export function AiMarketPage() {
  const { isZh } = useI18n();
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("All");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [sortBy, setSortBy] = useState<SortKey>("returnRate");
  const [selected, setSelected] = useState<AiStrategy | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const resource = useApiResource(
    useCallback(async (signal: AbortSignal) => {
      const response = await fetchAiStrategies(signal);
      return { data: response.data.data, meta: response.meta };
    }, []),
    emptyStrategyList,
    { isEmpty: (items) => items.length === 0 },
  );

  const strategies = useMemo(() => {
    return [...resource.data]
      .filter((strategy) => riskFilter === "All" || strategy.riskLevel === riskFilter)
      .filter((strategy) => typeFilter === "All" || strategy.type === typeFilter)
      .sort((first, second) => second[sortBy] - first[sortBy]);
  }, [resource.data, riskFilter, sortBy, typeFilter]);

  const createStrategy = useCallback(
    async (config: AiStrategyCreateInput["params"] & { name: string; type: AiStrategyType }) => {
      setActionMessage(null);
      try {
        const { name, type, fundAmount, stopLoss, takeProfit, maxSlippage } = config;
        await createAiStrategy({ name, type, params: { fundAmount, stopLoss, takeProfit, maxSlippage } });
        setActionMessage(isZh ? "策略已写入后端存储。" : "Strategy persisted in backend storage.");
        resource.reload();
      } catch (error) {
        setActionMessage(error instanceof Error ? error.message : isZh ? "创建策略失败。" : "Strategy creation failed.");
      }
    },
    [isZh, resource],
  );

  const runSimulation = useCallback(
    async (strategy: AiStrategy) => {
      setActionMessage(null);
      try {
        const response = await simulateAiStrategy(strategy.id);
        const result = response.data.data;
        setActionMessage(
          result
            ? isZh
              ? `仿真完成：胜率 ${result.winRate}%，交易 ${result.totalTrades} 笔。`
              : `Simulation complete: ${result.winRate}% win rate across ${result.totalTrades} trades.`
            : isZh
              ? "仿真未返回结果。"
              : "Simulation returned no result.",
        );
        resource.reload();
      } catch (error) {
        setActionMessage(error instanceof Error ? error.message : isZh ? "仿真失败。" : "Simulation failed.");
      }
    },
    [isZh, resource],
  );

  return (
    <div className="space-y-5" data-testid="ai-market-page">
      <GlassPanel
        action={<DataSourceBadge fallbackLabel="strategy storage unavailable" meta={resource.meta} testId="ai-market-source" />}
        eyebrow={isZh ? "AI 策略市场" : "AI Strategy Market"}
        flowBorder
        title={isZh ? "链上量化策略指挥台" : "On-chain quant strategy console"}
      >
        <p className="text-sm text-cyan-100/70">
          {isZh
            ? "读取后端真实策略存储，支持风险、收益、类型筛选，并可对单个策略触发确定性仿真。"
            : "Reads backend strategy storage, filters by risk, return and type, and runs deterministic simulations per strategy."}
        </p>
      </GlassPanel>

      <DEXGridHarness testId="ai-market-grid">
        <GlassPanel eyebrow={isZh ? "筛选" : "Filters"} title={isZh ? "策略发现" : "Strategy discovery"}>
          <FilterRow label={isZh ? "风险" : "Risk"}>
            {riskOptions.map((risk) => (
              <FilterButton active={riskFilter === risk} key={risk} onClick={() => setRiskFilter(risk)}>
                {risk === "All" ? (isZh ? "全部风险" : "All risks") : risk}
              </FilterButton>
            ))}
          </FilterRow>
          <FilterRow label={isZh ? "类型" : "Type"}>
            {typeOptions.map((type) => (
              <FilterButton active={typeFilter === type} key={type} onClick={() => setTypeFilter(type)}>
                {type === "All" ? (isZh ? "全部类型" : "All types") : typeLabels[type]}
              </FilterButton>
            ))}
          </FilterRow>
          <label className="mt-4 block text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100/45">
            {isZh ? "排序" : "Sort"}
          </label>
          <select
            className="mt-2 w-full rounded-[var(--btn-radius)] border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none"
            onChange={(event) => setSortBy(event.target.value as SortKey)}
            value={sortBy}
          >
            <option value="returnRate">{isZh ? "按收益率" : "Return rate"}</option>
            <option value="runtime">{isZh ? "按运行时长" : "Runtime"}</option>
            <option value="fundSize">{isZh ? "按资金规模" : "Fund size"}</option>
          </select>
        </GlassPanel>

        <GlassPanel eyebrow={isZh ? "创建" : "Create"} title={isZh ? "参数配置" : "Strategy parameters"}>
          <AiStrategyConfig onSubmit={createStrategy} />
        </GlassPanel>
      </DEXGridHarness>

      {actionMessage ? (
        <GlassPanel testId="ai-market-action-message">
          <p className="text-sm text-cyan-100/75">{actionMessage}</p>
        </GlassPanel>
      ) : null}

      <AsyncState
        emptyMessage={isZh ? "后端策略存储当前为空，请先创建一条策略。" : "Backend strategy storage is empty. Create a strategy first."}
        error={resource.error}
        onRetry={resource.reload}
        state={resource.state}
        testId="ai-market-strategies"
      >
        <DEXGridHarness testId="ai-market-strategy-cards">
          {strategies.map((strategy) => (
            <StrategyCard
              isZh={isZh}
              key={strategy.id}
              onOpen={() => setSelected(strategy)}
              onSimulate={() => void runSimulation(strategy)}
              strategy={strategy}
            />
          ))}
        </DEXGridHarness>
      </AsyncState>

      {selected ? <StrategyDetail isZh={isZh} onClose={() => setSelected(null)} strategy={selected} /> : null}
    </div>
  );
}

function FilterRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100/45">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      className="rounded-[var(--btn-radius)] border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition hover:border-cyan-200/60 disabled:opacity-50"
      onClick={onClick}
      style={{
        background: active ? dt.colors.cyanOverlay : dt.colors.inputBg,
        borderColor: active ? dt.colors.neonCyan : dt.colors.surfaceBorder,
        color: active ? dt.colors.neonCyan : dt.colors.textSecondary,
      }}
      type="button"
    >
      {children}
    </button>
  );
}

function StrategyCard({ isZh, onOpen, onSimulate, strategy }: { isZh: boolean; onOpen: () => void; onSimulate: () => void; strategy: AiStrategy }) {
  return (
    <GlassPanel testId={`ai-strategy-${strategy.id}`}>
      <button className="block w-full text-left" onClick={onOpen} type="button">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-white">{strategy.name}</p>
            <p className="mt-1 text-xs text-cyan-100/55">{typeLabels[strategy.type]}</p>
          </div>
          <span className="rounded-full border px-2 py-1 text-[10px] font-black" style={{ borderColor: riskColors[strategy.riskLevel], color: riskColors[strategy.riskLevel] }}>
            {strategy.riskLevel}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Metric label={isZh ? "收益率" : "Return"} value={`+${strategy.returnRate}%`} valueColor={dt.colors.neonCyan} />
          <Metric label={isZh ? "资金" : "Funds"} value={`$${strategy.fundSize.toLocaleString()}`} />
          <Metric label={isZh ? "运行" : "Runtime"} value={`${Math.floor(strategy.runtime / 86400)}d`} />
          <Metric label={isZh ? "状态" : "Status"} value={strategy.status} valueColor={strategy.status === "running" ? dt.colors.neonGreen : dt.colors.warning} />
        </div>
      </button>
      <NeonButton className="mt-4 w-full py-2 text-xs" onClick={onSimulate} type="button">
        {isZh ? "运行仿真" : "Run simulation"}
      </NeonButton>
    </GlassPanel>
  );
}

function StrategyDetail({ isZh, onClose, strategy }: { isZh: boolean; onClose: () => void; strategy: AiStrategy }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-[var(--glass-blur)]" onClick={onClose}>
      <GlassPanel className="max-h-[80vh] w-full max-w-2xl overflow-auto" flowBorder testId="ai-strategy-detail">
        <div className="mb-4 flex items-start justify-between gap-4" onClick={(event) => event.stopPropagation()}>
          <div>
            <p className="text-lg font-black text-white">{strategy.name}</p>
            <p className="text-sm text-cyan-100/60">{typeLabels[strategy.type]}</p>
          </div>
          <button className="text-sm font-black text-cyan-100/70" onClick={onClose} type="button">
            {isZh ? "关闭" : "Close"}
          </button>
        </div>
        <div className="grid gap-3" onClick={(event) => event.stopPropagation()} style={{ gridTemplateColumns: dt.layout.detailColumns }}>
          <Metric label={isZh ? "风险" : "Risk"} value={strategy.riskLevel} valueColor={riskColors[strategy.riskLevel]} />
          <Metric label={isZh ? "收益率" : "Return"} value={`+${strategy.returnRate}%`} valueColor={dt.colors.neonCyan} />
          <Metric label={isZh ? "最大回撤" : "Max drawdown"} value={`-${strategy.maxDrawdown}%`} valueColor={dt.colors.negative} />
          <Metric label={isZh ? "夏普" : "Sharpe"} value={strategy.sharpeRatio.toFixed(2)} />
          <Metric label={isZh ? "资金规模" : "Fund size"} value={`$${strategy.fundSize.toLocaleString()}`} />
          <Metric label={isZh ? "滑点上限" : "Max slippage"} value={`${strategy.params.maxSlippage}%`} />
        </div>
      </GlassPanel>
    </div>
  );
}

function Metric({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/40">{label}</p>
      <p className="mt-1 text-sm font-black" style={{ color: valueColor ?? dt.colors.textPrimary }}>
        {value}
      </p>
    </div>
  );
}
