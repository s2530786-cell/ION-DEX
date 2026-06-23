import { ArrowDownUp } from "lucide-react";
import { useMemo, useState } from "react";
import { buildP1QuoteSummary } from "@/hooks/useDashboardMarket";
import { useSwapTradeQuote } from "@/hooks/useSwapTradeQuote";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonGlassCard } from "@/components/ui/NeonGlassCard";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDataSourceLabel } from "@/lib/ionApi";

type SwapToken = "BNB" | "ION" | "USDT";

const tokens: SwapToken[] = ["BNB", "ION", "USDT"];

type DashboardSwapPanelProps = {
  onOpenFullSwap: () => void;
};

/**
 * Dashboard left rail — compact swap surface aligned with design reference (token pair + amount + CTA).
 */
export function DashboardSwapPanel({ onOpenFullSwap }: DashboardSwapPanelProps) {
  const { isZh } = useI18n();
  const [fromToken, setFromToken] = useState<SwapToken>("BNB");
  const [toToken, setToToken] = useState<SwapToken>("ION");
  const [payAmount, setPayAmount] = useState("");

  const pairLabel = useMemo(() => `${fromToken} → ${toToken}`, [fromToken, toToken]);
  const amountForQuote = payAmount.trim() || "1";
  const tradeQuote = useSwapTradeQuote({
    fromToken,
    toToken,
    payAmount: amountForQuote,
    slippagePct: "1",
  });

  const quotePreview = useMemo(() => {
    if (tradeQuote.state === "loading") {
      return { kind: "loading" as const, text: isZh ? "正在加载 P1 报价…" : "Loading P1 quote…" };
    }
    if (tradeQuote.state === "error") {
      return {
        kind: "error" as const,
        text: tradeQuote.error ?? (isZh ? "报价暂不可用" : "Quote unavailable"),
      };
    }
    if (tradeQuote.state === "ready" && tradeQuote.request) {
      const summary = buildP1QuoteSummary(tradeQuote.data);
      const text = tradeQuote.meta
        ? `${summary} · ${formatDataSourceLabel(tradeQuote.meta)}`
        : summary;
      return { kind: "ready" as const, text };
    }
    return {
      kind: "fallback" as const,
      text: isZh ? `路由预览：${pairLabel}${payAmount ? ` · ${payAmount}` : ""}` : `Route preview: ${pairLabel}${payAmount ? ` · ${payAmount}` : ""}`,
    };
  }, [isZh, pairLabel, payAmount, tradeQuote.data, tradeQuote.error, tradeQuote.meta, tradeQuote.request, tradeQuote.state]);

  function flipPair() {
    setFromToken(toToken);
    setToToken(fromToken);
  }

  return (
    <NeonGlassCard className="h-full min-h-0" rim="hero" testId="dashboard-swap-panel">
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/45">{isZh ? "兑换" : "Swap"}</p>
            <p className="mt-1 text-xl font-black text-white">{isZh ? "币种组合" : "Token pair"}</p>
          </div>
          <ArrowDownUp aria-hidden className="shrink-0 text-cyan-200/80" size={20} />
        </div>

        <CompactTokenRow
          label={isZh ? "支付" : "From"}
          onSelect={setFromToken}
          selected={fromToken}
          testId="dashboard-swap-from"
        />

        <div className="flex justify-center">
          <button
            className="rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] p-1.5 text-cyan-100"
            data-testid="dashboard-swap-flip"
            onClick={flipPair}
            type="button"
          >
            <ArrowDownUp size={16} />
          </button>
        </div>

        <CompactTokenRow
          label={isZh ? "接收" : "To"}
          onSelect={setToToken}
          selected={toToken}
          testId="dashboard-swap-to"
        />

        <label className="block rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-cyan-100/45">
            {isZh ? "数量" : "Amount"}
          </span>
          <input
            className="mt-0.5 w-full bg-transparent text-base font-black text-white outline-none"
            data-testid="dashboard-swap-amount"
            inputMode="decimal"
            onChange={(event) => setPayAmount(event.target.value)}
            value={payAmount}
          />
        </label>

        <p
          className={`text-xs leading-relaxed ${
            quotePreview.kind === "error" ? "text-rose-200/80" : "text-cyan-100/55"
          }`}
          data-testid="dashboard-p1-quote-line"
        >
          {quotePreview.text}
        </p>

        <NeonButton
          className="mt-auto w-full py-2.5 text-sm"
          data-testid="dashboard-open-swap"
          onClick={onOpenFullSwap}
          type="button"
        >
          {isZh ? "前往兑换" : "Swap"}
        </NeonButton>
      </div>
    </NeonGlassCard>
  );
}

function CompactTokenRow({
  label,
  selected,
  onSelect,
  testId,
}: {
  label: string;
  selected: SwapToken;
  onSelect: (token: SwapToken) => void;
  testId: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-cyan-100/45">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5" data-testid={testId}>
        {tokens.map((token) => (
          <button
            className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
              selected === token
                ? "bg-cyan-300/20 text-cyan-100 shadow-neonCyan"
                : "bg-white/5 text-cyan-100/60"
            }`}
            key={token}
            onClick={() => onSelect(token)}
            type="button"
          >
            {token}
          </button>
        ))}
      </div>
    </div>
  );
}
