import { useCallback, useState } from "react";
import { useApiResource } from "@/hooks/useApiResource";
import { useI18n } from "@/i18n/I18nProvider";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { useEvmWallet } from "@/context/EvmWalletContext";
import {
  fetchAiStrategies,
  subscribeAiStrategy,
  type AiStrategy,
  type ApiMeta,
} from "@/lib/ionApi";

type AiMarketPageProps = Record<string, never>;

const fallbackStrategies: AiStrategy[] = [];

function riskTone(risk: string): { label: string; className: string } {
  const normalized = risk.toLowerCase();
  if (normalized === "high") {
    return { label: risk, className: "border-rose-300/30 bg-rose-400/10 text-rose-200" };
  }
  if (normalized === "medium") {
    return { label: risk, className: "border-amber-300/30 bg-amber-300/10 text-amber-200" };
  }
  return { label: risk, className: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" };
}

function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function AiMarketPage(_props: AiMarketPageProps) {
  const { isZh } = useI18n();
  const evmWallet = useEvmWallet();
  const evmAddress = evmWallet.snapshot?.address ?? null;
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [subscribedId, setSubscribedId] = useState<string | null>(null);

  const fetchStrategies = useCallback(
    async (signal: AbortSignal): Promise<{ data: AiStrategy[]; meta: ApiMeta }> => {
      const data = await fetchAiStrategies(signal);
      const meta: ApiMeta = {
        source: "upstream",
        updatedAt: new Date().toISOString(),
        stale: false,
        requestId: "ai-strategies-ui",
      };
      return { data, meta };
    },
    [],
  );

  const strategies = useApiResource(fetchStrategies, fallbackStrategies, {
    isEmpty: (data) => data.length === 0,
  });

  const subscribe = useCallback(
    async (strategy: AiStrategy) => {
      setActionError(null);
      if (!evmAddress) {
        setActionError(isZh ? "请先连接钱包再订阅。" : "Connect your wallet before subscribing.");
        return;
      }
      setPendingId(strategy.id);
      try {
        await subscribeAiStrategy(evmAddress, strategy.id);
        setSubscribedId(strategy.id);
      } catch (cause) {
        setActionError(cause instanceof Error ? cause.message : "Subscription failed");
      } finally {
        setPendingId(null);
      }
    },
    [evmAddress, isZh],
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-5" data-testid="page-ai-market">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/45">
            {isZh ? "AI Strategy Market" : "AI Strategy Market"}
          </p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            {isZh ? "AI 策略市场" : "AI Strategy Market"}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-cyan-100/60">
            {isZh
              ? "订阅算法策略，收益以 ION 自动复投。"
              : "Subscribe to algorithmic strategies — yields auto-compounded in ION."}
          </p>
        </div>
        {subscribedId ? (
          <p className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-300">
            {isZh ? "已提交订阅" : "Subscription submitted"}
          </p>
        ) : null}
      </div>

      <DataSourceBadge meta={strategies.meta} testId="ai-market-source" />

      {actionError ? (
        <div
          className="rounded-2xl border border-rose-300/25 bg-rose-400/[0.08] p-3 text-sm text-rose-100"
          data-testid="ai-market-action-error"
        >
          {actionError}
        </div>
      ) : null}

      <AsyncState
        emptyMessage={isZh ? "暂无可用策略。" : "No strategies available yet."}
        error={strategies.error}
        onRetry={strategies.reload}
        state={strategies.state}
        testId="ai-market-strategies"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {strategies.data.map((strategy) => {
            const tone = riskTone(strategy.risk);
            const isPending = pendingId === strategy.id;
            const isSubscribed = subscribedId === strategy.id;
            return (
              <NeonCard key={strategy.id} density="compact" variant="cyan">
                <div data-testid={`strategy-${strategy.id}`} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-white">{strategy.name}</p>
                    <p className="text-xs text-cyan-100/55">
                      {strategy.type} {isZh ? "策略" : "Strategy"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${tone.className}`}
                  >
                    {tone.label}
                  </span>
                </div>

                <p className="mt-3 min-h-[2.4rem] text-sm text-cyan-100/65">{strategy.desc}</p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.16em] text-cyan-100/45">APY</p>
                    <p className="mt-0.5 text-xl font-black text-glow-cyan">{strategy.apy}%</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.16em] text-cyan-100/45">TVL</p>
                    <p className="mt-0.5 text-sm font-bold text-white">{formatUsd(strategy.tvl)}</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.16em] text-cyan-100/45">
                      {isZh ? "订阅" : "Subs"}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-white">
                      {formatCount(strategy.subscribers)}
                    </p>
                  </div>
                </div>

                <NeonButton
                  className="mt-5 w-full"
                  disabled={isPending}
                  onClick={() => subscribe(strategy)}
                  data-testid={`subscribe-${strategy.id}`}
                >
                  {isPending
                    ? isZh
                      ? "提交中…"
                      : "Submitting…"
                    : isSubscribed
                      ? isZh
                        ? "已订阅"
                        : "Subscribed"
                      : isZh
                        ? "订阅"
                        : "Subscribe"}
                </NeonButton>
              </NeonCard>
            );
          })}
        </div>
      </AsyncState>
    </div>
  );
}

export default AiMarketPage;
