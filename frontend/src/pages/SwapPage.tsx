import { ArrowDownUp } from "lucide-react";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { useApiResource } from "@/hooks/useApiResource";
import { fetchMarketTickers, type MarketTicker } from "@/lib/ionApi";

type SwapToken = "BNB" | "ION" | "USDT";

const tokens: SwapToken[] = ["BNB", "ION", "USDT"];

const fallbackRates: Record<SwapToken, number> = {
  BNB: 642.2,
  ION: 6.02,
  USDT: 1,
};

const fallbackTickers: MarketTicker[] = [
  { symbol: "BNB", priceUsd: 642.2, displayPrice: "$642.20", change24hPct: 1.18, displayChange: "+1.18%" },
  { symbol: "ION", priceUsd: 6.02, displayPrice: "$6.02", change24hPct: 8.42, displayChange: "+8.42%" },
  { symbol: "USDT", priceUsd: 1, displayPrice: "$1.00", change24hPct: 0.01, displayChange: "+0.01%" },
];

function ratesFromTickers(tickers: MarketTicker[]): Record<SwapToken, number> {
  const rates = { ...fallbackRates };
  for (const ticker of tickers) {
    if (ticker.symbol === "BNB" || ticker.symbol === "ION" || ticker.symbol === "USDT") {
      rates[ticker.symbol] = ticker.priceUsd;
    }
  }
  return rates;
}

export function SwapPage() {
  const fetchTickers = useCallback(
    (signal: AbortSignal) => fetchMarketTickers(signal),
    [],
  );
  const tickers = useApiResource(fetchTickers, fallbackTickers, {
    isEmpty: (data) => data.length === 0,
  });
  const rates = useMemo(() => ratesFromTickers(tickers.data), [tickers.data]);

  const [fromToken, setFromToken] = useState<SwapToken>("BNB");
  const [toToken, setToToken] = useState<SwapToken>("ION");
  const [payAmount, setPayAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [submitted, setSubmitted] = useState(false);

  const validation = useMemo(() => {
    const parsedPay = Number(payAmount);
    const parsedSlippage = Number(slippage);
    const payValid = Number.isFinite(parsedPay) && parsedPay > 0;
    const slippageValid =
      Number.isFinite(parsedSlippage) && parsedSlippage >= 0.1 && parsedSlippage <= 5;
    const sameToken = fromToken === toToken;

    const fromUsd = rates[fromToken];
    const toUsd = rates[toToken];
    const receive = payValid && toUsd > 0 ? (parsedPay * fromUsd) / toUsd : null;
    const impactPct =
      payValid && receive !== null
        ? Math.min(3.5, Math.max(0.05, (parsedPay / 1000) * 0.4))
        : null;

    return {
      payValid,
      slippageValid,
      sameToken,
      isValid: payValid && slippageValid && !sameToken,
      receive,
      impactPct,
    };
  }, [fromToken, payAmount, rates, slippage, toToken]);

  function flipPair() {
    setFromToken(toToken);
    setToToken(fromToken);
    setSubmitted(false);
  }

  function submitSwap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validation.isValid) {
      setSubmitted(true);
    }
  }

  return (
    <div className="mx-auto max-w-lg" data-testid="page-swap">
      <NeonCard className="min-h-[28rem]" variant="magenta">
        <form className="grid gap-4" onSubmit={submitSwap}>
          <div className="mb-1 flex items-center justify-between">
            <div>
              <p className="text-2xl font-black">Swap</p>
              <p className="text-sm text-cyan-100/55">BNB / ION market buy and pair routes</p>
            </div>
            <ArrowDownUp className="text-cyan-200" />
          </div>

          <DataSourceBadge meta={tickers.meta} testId="swap-quote-source" />

          <AsyncState
            emptyMessage="Market prices unavailable."
            error={tickers.error}
            onRetry={tickers.reload}
            state={tickers.state}
            testId="swap-tickers"
          >
            <span className="sr-only">Ticker feed loaded</span>
          </AsyncState>

          <TokenRow
            label="From"
            onSelect={(token) => {
              setFromToken(token);
              setSubmitted(false);
            }}
            selected={fromToken}
            testId="swap-from-token"
          />

          <div className="flex justify-center">
            <button
              className="rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] p-2 text-cyan-100"
              data-testid="swap-flip"
              onClick={flipPair}
              type="button"
            >
              <ArrowDownUp size={18} />
            </button>
          </div>

          <TokenRow
            label="To"
            onSelect={(token) => {
              setToToken(token);
              setSubmitted(false);
            }}
            selected={toToken}
            testId="swap-to-token"
          />

          <label className="block rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">
              Pay amount
            </span>
            <input
              className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none"
              data-testid="swap-pay-amount"
              inputMode="decimal"
              onChange={(event) => {
                setPayAmount(event.target.value);
                setSubmitted(false);
              }}
              placeholder="0.00"
              value={payAmount}
            />
          </label>

          <label className="block rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">
              Slippage %
            </span>
            <input
              className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none"
              data-testid="swap-slippage"
              inputMode="decimal"
              onChange={(event) => {
                setSlippage(event.target.value);
                setSubmitted(false);
              }}
              value={slippage}
            />
          </label>

          {validation.sameToken ? (
            <p
              className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100"
              data-testid="swap-error"
            >
              Pick two different tokens before requesting a quote.
            </p>
          ) : null}

          {!validation.slippageValid ? (
            <p
              className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100"
              data-testid="swap-error"
            >
              Slippage must stay between 0.1% and 5%.
            </p>
          ) : null}

          <div
            className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-3 text-xs text-cyan-100/75"
            data-testid="swap-quote"
          >
            {validation.isValid && validation.receive !== null ? (
              <span>
                Quote: receive ~{validation.receive.toFixed(4)} {toToken} · price impact ~
                {validation.impactPct?.toFixed(2)}% · min received after {slippage}% slip · protocol
                fee in ION · source {tickers.meta?.source ?? "offline"}
              </span>
            ) : (
              <span>Enter amount and slippage to preview minimum received, impact, and ION fee.</span>
            )}
          </div>

          <NeonButton
            className="w-full"
            data-testid="swap-submit"
            disabled={!validation.isValid}
            type="submit"
          >
            Swap
          </NeonButton>

          {submitted ? (
            <p
              className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
              data-testid="swap-confirmation"
            >
              Swap draft ready for wallet signing. On-chain routing remains gated behind DEX contracts.
            </p>
          ) : null}
        </form>
      </NeonCard>
    </div>
  );
}

function TokenRow({
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">{label}</p>
      <div className="flex flex-wrap gap-2" data-testid={testId}>
        {tokens.map((token) => (
          <button
            className={`rounded-full px-3 py-1 text-sm font-black ${
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
