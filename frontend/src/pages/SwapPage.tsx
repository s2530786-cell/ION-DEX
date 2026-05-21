import { ArrowDownUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlassPlaceholderSkeleton } from "@/components/ui/GlassPlaceholderSkeleton";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { useIonWallet } from "@/context/IonWalletContext";
import { useEvmWallet } from "@/context/EvmWalletContext";
import { usePreviewResource } from "@/hooks/usePreviewResource";
import { useMockData } from "@/context/MockDataContext";
import { mockPreviewMeta } from "@/lib/MOCK_DATA";
import type { ApiMeta, TradeQuote } from "@/lib/ionApi";
import { ION_API_LIVE_ENABLED, fetchTradeQuote } from "@/lib/ionApi";

type SwapToken = "BNB" | "ION" | "USDT";

const tokens: SwapToken[] = ["BNB", "ION", "USDT"];

function swapNeedsIonWallet(fromToken: SwapToken, toToken: SwapToken): boolean {
  return fromToken === "ION" || toToken === "ION";
}

function swapNeedsEvmWallet(fromToken: SwapToken): boolean {
  return fromToken === "BNB" || fromToken === "USDT";
}

export function SwapPage() {
  const ionWallet = useIonWallet();
  const evmWallet = useEvmWallet();
  const mockData = useMockData();
  const tickers = usePreviewResource((m) => m.marketTickers, {
    isEmpty: (data) => data.length === 0,
    metaKey: "markets/tickers",
  });

  const [fromToken, setFromToken] = useState<SwapToken>("BNB");
  const [toToken, setToToken] = useState<SwapToken>("ION");
  const [payAmount, setPayAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [quote, setQuote] = useState<TradeQuote | null>(null);
  const [quoteMeta, setQuoteMeta] = useState<ApiMeta | null>(null);
  const [quoteState, setQuoteState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const slippageBps = useMemo(() => {
    const slip = Number(slippage);
    return Number.isFinite(slip) ? Math.round(slip * 100) : Number.NaN;
  }, [slippage]);

  const inputValid = useMemo(() => {
    const parsedPay = Number(payAmount);
    return (
      Number.isFinite(parsedPay) &&
      parsedPay > 0 &&
      Number.isInteger(slippageBps) &&
      slippageBps >= 10 &&
      slippageBps <= 500 &&
      fromToken !== toToken
    );
  }, [fromToken, payAmount, slippageBps, toToken]);

  useEffect(() => {
    if (!inputValid) {
      setQuote(null);
      setQuoteMeta(null);
      setQuoteState("idle");
      setQuoteError(null);
      return undefined;
    }

    const controller = new AbortController();

    if (!ION_API_LIVE_ENABLED) {
      setQuote(
        mockData.buildTradeQuote({
          amountIn: payAmount,
          inputToken: fromToken,
          outputToken: toToken,
          slippageBps,
        }),
      );
      setQuoteMeta(mockPreviewMeta("trade/quote"));
      setQuoteState("ready");
      setQuoteError(null);
      return () => controller.abort();
    }

    setQuoteState("loading");
    setQuoteError(null);

    fetchTradeQuote(
      {
        amountIn: payAmount,
        inputToken: fromToken,
        outputToken: toToken,
        slippageBps,
      },
      controller.signal,
    )
      .then((response) => {
        setQuote(response.data);
        setQuoteMeta(response.meta);
        setQuoteState("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setQuote(null);
        setQuoteMeta(null);
        setQuoteState("error");
        setQuoteError(
          error instanceof Error
            ? error.message
            : "Quote request failed. Start backend on :8787 or check API proxy.",
        );
      });

    return () => controller.abort();
  }, [fromToken, inputValid, mockData, payAmount, slippageBps, toToken]);

  const validation = useMemo(() => {
    const parsedSlippage = Number(slippage);
    const slippageValid =
      Number.isFinite(parsedSlippage) && parsedSlippage >= 0.1 && parsedSlippage <= 5;
    const sameToken = fromToken === toToken;
    const payValid = Number.isFinite(Number(payAmount)) && Number(payAmount) > 0;

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

    const quoteReady = quoteState === "ready" && quote !== null;

    return {
      payValid,
      slippageValid,
      sameToken,
      isValid: payValid && slippageValid && !sameToken && !walletBlock && quoteReady,
      quote,
      quoteReady,
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
    quote,
    quoteState,
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
          receiveEstimate: validation.quote.minimumReceived,
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
    <div className="mx-auto max-w-lg" data-testid="page-swap">
      <NeonCard className="min-h-[28rem]" variant="magenta">
        <form className="grid gap-4" onSubmit={(event) => void submitSwap(event)}>
          <div className="mb-1 flex items-center justify-between">
            <div>
              <p className="text-2xl font-black">Swap</p>
              <p className="text-sm text-cyan-100/55">BNB / ION market buy and pair routes</p>
            </div>
            <ArrowDownUp className="text-cyan-200" />
          </div>

          <DataSourceBadge meta={quoteMeta ?? tickers.meta} testId="swap-quote-source" />

          <AsyncState error={tickers.error} state={tickers.state} testId="swap-tickers">
            <span className="sr-only">Ticker feed loaded</span>
          </AsyncState>

          {validation.walletBlock ? (
            <p
              className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] px-4 py-3 text-sm text-amber-100"
              data-testid="swap-wallet-hint"
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
              setConfirmation(null);
              setSubmitError(null);
            }}
            selected={toToken}
            testId="swap-to-token"
          />

          <GlassInput
            label="Pay amount"
            onChange={(value) => {
              setPayAmount(value);
              setConfirmation(null);
              setSubmitError(null);
            }}
            placeholder="0.00"
            testId="swap-pay-amount"
            type="number"
            value={payAmount}
          />

          <GlassInput
            label="Slippage %"
            onChange={(value) => {
              setSlippage(value);
              setConfirmation(null);
              setSubmitError(null);
            }}
            testId="swap-slippage"
            type="number"
            value={slippage}
          />

          {validation.sameToken ? (
            <GlassPanel variant="magenta" noAurora padding="sm">
              <p className="text-sm text-rose-100" data-testid="swap-error">Pick two different tokens before requesting a quote.</p>
            </GlassPanel>
          ) : null}

          {!validation.slippageValid ? (
            <GlassPanel variant="magenta" noAurora padding="sm">
              <p className="text-sm text-rose-100" data-testid="swap-error">Slippage must stay between 0.1% and 5%.</p>
            </GlassPanel>
          ) : null}

          {quoteState === "error" || quoteState === "loading" ? (
            <GlassPlaceholderSkeleton
              embedded
              lines={2}
              minHeight="5.5rem"
              testId="swap-quote-placeholder"
            />
          ) : null}

          {submitError ? (
            <GlassPanel variant="magenta" noAurora padding="sm">
              <p className="text-sm text-rose-100" data-testid="swap-error">{submitError}</p>
            </GlassPanel>
          ) : null}

          {quoteState !== "loading" && quoteState !== "error" ? (
            <GlassPanel variant="cyan" noAurora padding="sm">
              <div className="text-xs text-cyan-100/75" data-testid="swap-quote">
              {validation.quoteReady && validation.quote !== null ? (
                <span>
                  Quote: est. ~{validation.quote.estimatedOutput} {toToken} · protocol fee ~
                  {validation.quote.protocolFee} {toToken} · min received ~
                  <span data-testid="swap-min-received">{validation.quote.minimumReceived}</span>{" "}
                  {toToken} (after {slippage}% slip) · impact ~{validation.quote.priceImpactBps / 100}% ·
                  route {validation.quote.route.join(" → ")} · price via{" "}
                  {validation.quote.provenance.source} ({validation.quote.provenance.priceModel})
                </span>
              ) : (
                <span>Enter amount and slippage to preview quote from MOCK_DATA.</span>
              )}
              </div>
            </GlassPanel>
          ) : null}

          <NeonButton
            className="w-full"
            data-testid="swap-submit"
            disabled={!validation.isValid || submitting || quoteState === "loading"}
            type="submit"
          >
            {submitting ? "等待钱包签名…" : "Swap"}
          </NeonButton>

          {confirmation ? (
            <GlassPanel variant="cyan" noAurora padding="sm">
              <p className="text-sm font-bold text-emerald-100" data-testid="swap-confirmation">{confirmation}</p>
            </GlassPanel>
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
    <GlassPanel variant="cyan" noAurora padding="sm">
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
    </GlassPanel>
  );
}
