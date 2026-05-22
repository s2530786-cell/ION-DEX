import { ArrowDownUp } from "lucide-react";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { useIonWallet } from "@/context/IonWalletContext";
import { useEvmWallet } from "@/context/EvmWalletContext";
import { useApiResource } from "@/hooks/useApiResource";
import { fetchMarketTickers, type MarketTicker } from "@/lib/ionApi";
import { computeSwapQuoteBreakdown } from "@/lib/swapQuote";

export type SwapToken = "BNB" | "ION" | "USDT";

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

function swapNeedsIonWallet(fromToken: SwapToken, toToken: SwapToken): boolean {
  return fromToken === "ION" || toToken === "ION";
}

function swapNeedsEvmWallet(fromToken: SwapToken): boolean {
  return fromToken === "BNB" || fromToken === "USDT";
}

export type SwapPanelProps = {
  /** Prefix for data-testid attributes, e.g. `swap` or `dashboard-swap`. */
  testIdPrefix?: string;
  variant?: "cyan" | "magenta";
  compact?: boolean;
  className?: string;
};

export function SwapPanel({
  testIdPrefix = "swap",
  variant = "magenta",
  compact = false,
  className = "",
}: SwapPanelProps) {
  const tid = (suffix: string) => `${testIdPrefix}-${suffix}`;

  const ionWallet = useIonWallet();
  const evmWallet = useEvmWallet();
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
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validation = useMemo(() => {
    const parsedPay = Number(payAmount);
    const parsedSlippage = Number(slippage);
    const payValid = Number.isFinite(parsedPay) && parsedPay > 0;
    const slippageValid =
      Number.isFinite(parsedSlippage) && parsedSlippage >= 0.1 && parsedSlippage <= 5;
    const sameToken = fromToken === toToken;

    const fromUsd = rates[fromToken];
    const toUsd = rates[toToken];
    const grossOut = payValid && toUsd > 0 ? (parsedPay * fromUsd) / toUsd : null;
    const impactPct =
      payValid && grossOut !== null
        ? Math.min(3.5, Math.max(0.05, (parsedPay / 1000) * 0.4))
        : null;
    const quote =
      grossOut !== null && impactPct !== null && slippageValid
        ? computeSwapQuoteBreakdown(grossOut, parsedSlippage, impactPct)
        : null;

    const needsIon = swapNeedsIonWallet(fromToken, toToken);
    const needsEvm = swapNeedsEvmWallet(fromToken);
    const ionReady = ionWallet.status === "connected" && ionWallet.snapshot;
    const evmReady = evmWallet.status === "connected" && evmWallet.snapshot;

    let walletBlock: string | null = null;
    if (needsIon && !ionReady) {
      walletBlock = "连接 ION 钱包（扩展 / Online+ / TonConnect QR）以签名 swap。";
    } else if (needsEvm && !needsIon && !evmReady) {
      walletBlock = "连接 MetaMask / Injected 以在 BSC 上支付。";
    } else if (needsIon && needsEvm && !ionReady) {
      walletBlock = "跨链报价需要 ION 钱包签名 swap intent。";
    }

    return {
      payValid,
      slippageValid,
      sameToken,
      isValid: payValid && slippageValid && !sameToken && !walletBlock && quote !== null,
      grossOut,
      quote,
      impactPct,
      walletBlock,
      needsIon,
      ionReady,
    };
  }, [
    evmWallet.snapshot,
    evmWallet.status,
    fromToken,
    ionWallet.snapshot,
    ionWallet.status,
    payAmount,
    rates,
    slippage,
    toToken,
  ]);

  function flipPair() {
    setFromToken(toToken);
    setToToken(fromToken);
    setConfirmation(null);
    setSubmitError(null);
  }

  async function submitSwap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validation.isValid || validation.quote === null) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setConfirmation(null);

    try {
      if (validation.needsIon) {
        const result = await ionWallet.sendSwapIntent({
          fromToken,
          toToken,
          payAmount,
          slippagePct: slippage,
          receiveEstimate: validation.quote.minReceived.toFixed(6),
        });
        const proof =
          result.kind === "tonconnect-sdk"
            ? `TonConnect BOC ${result.proof.slice(0, 18)}…`
            : "扩展已确认 ton_sendTransaction";
        setConfirmation(
          `Swap intent 已通过 ION 钱包签名上链（${proof}）。AMM 路由合约接入后将把同一 intent 路由到池子。`,
        );
      } else {
        setSubmitError("当前交易对需要 ION 链签名；请将 ION 加入交易对并连接 ION 钱包。");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Swap 签名失败。";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <NeonCard className={`min-h-[28rem] ${className}`} floating={false} variant={variant}>
      <form className="grid gap-4" onSubmit={(event) => void submitSwap(event)}>
        <div className="mb-1 flex items-center justify-between">
          <div>
            <p className={compact ? "text-xl font-black" : "text-2xl font-black"}>Swap</p>
            <p className="text-sm text-cyan-100/55">BNB / ION market buy and pair routes</p>
          </div>
          <ArrowDownUp className="text-cyan-200" />
        </div>

        <DataSourceBadge meta={tickers.meta} testId={`${testIdPrefix}-quote-source`} />

        <AsyncState
          emptyMessage="Market prices unavailable."
          error={tickers.error}
          onRetry={tickers.reload}
          state={tickers.state}
          testId={`${testIdPrefix}-tickers`}
        >
          <span className="sr-only">Ticker feed loaded</span>
        </AsyncState>

        {validation.walletBlock ? (
          <p
            className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] px-4 py-3 text-sm text-amber-100"
            data-testid={tid("wallet-hint")}
          >
            {validation.walletBlock}
          </p>
        ) : null}

        <TokenRow
          label="From"
          onSelect={(token) => {
            setFromToken(token);
            setConfirmation(null);
            setSubmitError(null);
          }}
          selected={fromToken}
          testId={tid("from-token")}
        />

        {/* Brand emblem removed per Master — too large on mobile */}

        <div className="ion-swap-flip-row">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/[0.1] px-4 py-2 text-sm font-bold text-cyan-100 shadow-[0_0_18px_rgba(36,247,255,0.28)] backdrop-blur-md transition hover:border-cyan-200/45 hover:bg-cyan-300/[0.16]"
            data-testid={tid("flip")}
            onClick={flipPair}
            type="button"
          >
            <ArrowDownUp size={18} />
            Switch pair
          </button>
        </div>

        <TokenRow
          label="To"
          onSelect={(token) => {
            setToToken(token);
            setConfirmation(null);
            setSubmitError(null);
          }}
          selected={toToken}
          testId={tid("to-token")}
        />

        <label className="block rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">
            Pay amount
          </span>
          <input
            className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none"
            data-testid={tid("pay-amount")}
            inputMode="decimal"
            onChange={(event) => {
              setPayAmount(event.target.value);
              setConfirmation(null);
              setSubmitError(null);
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
            data-testid={tid("slippage")}
            inputMode="decimal"
            onChange={(event) => {
              setSlippage(event.target.value);
              setConfirmation(null);
              setSubmitError(null);
            }}
            value={slippage}
          />
        </label>

        {validation.sameToken ? (
          <p
            className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100"
            data-testid={tid("error")}
          >
            Pick two different tokens before requesting a quote.
          </p>
        ) : null}

        {!validation.slippageValid ? (
          <p
            className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100"
            data-testid={tid("error")}
          >
            Slippage must stay between 0.1% and 5%.
          </p>
        ) : null}

        {submitError ? (
          <p
            className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100"
            data-testid={tid("error")}
          >
            {submitError}
          </p>
        ) : null}

        <div
          className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-3 text-xs text-cyan-100/75"
          data-testid={tid("quote")}
        >
          {validation.isValid && validation.quote !== null ? (
            <span>
              Quote: gross ~{validation.quote.grossOut.toFixed(4)} {toToken} · protocol fee ~
              {validation.quote.protocolFee.toFixed(6)} {toToken} · min received ~
              <span data-testid={tid("min-received")}>
                {validation.quote.minReceived.toFixed(6)}
              </span>{" "}
              {toToken} (after {slippage}% slip) · impact ~{validation.quote.priceImpactPct.toFixed(2)}
              % · ION pairs use <code className="text-cyan-50">ton_sendTransaction</code> intent ·
              source {tickers.meta?.source ?? "offline"}
            </span>
          ) : (
            <span>Enter amount and slippage to preview minimum received, impact, and ION fee.</span>
          )}
        </div>

        <NeonButton
          className="w-full"
          data-testid={tid("submit")}
          disabled={!validation.isValid || submitting}
          type="submit"
        >
          {submitting ? "等待钱包签名…" : "Swap"}
        </NeonButton>

        {confirmation ? (
          <p
            className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
            data-testid={tid("confirmation")}
          >
            {confirmation}
          </p>
        ) : null}
      </form>
    </NeonCard>
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
