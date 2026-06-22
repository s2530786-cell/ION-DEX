import { useCallback, useMemo } from "react";
import {
  normalizeChartPoints,
  type MarketChartPoint,
} from "@/components/charts/MarketChart";
import { useApiResource } from "@/hooks/useApiResource";
import { useMarketCandles } from "@/hooks/useMarketSurface";
import {
  fetchMarketTickers,
  fetchTradeQuote,
  type MarketTicker,
  type TradeQuote,
} from "@/lib/ionApi";

const emptyQuote: TradeQuote = {
  inputToken: "BNB",
  outputToken: "ION",
  amountIn: "",
  amountInUnits: "0",
  estimatedOutput: "",
  estimatedOutputUnits: "0",
  minimumReceived: "",
  minimumReceivedUnits: "0",
  protocolFee: "",
  protocolFeeUnits: "0",
  protocolFeeBps: 0,
  slippageBps: 0,
  priceImpactBps: 0,
  route: [],
  precision: { inputDecimals: 9, outputDecimals: 9, math: "bigint-floor" },
  provenance: { source: "local-seed", priceModel: "" },
};

function formatBpsAsPercent(bps: number): string {
  return (bps / 100).toFixed(2);
}

/** Full P1 swap quote summary for dashboard / compact swap surfaces. */
export function buildP1QuoteSummary(quote: TradeQuote): string {
  const route = quote.route.length > 0 ? quote.route.join(" → ") : "—";
  const source = quote.provenance?.source ?? "unknown";
  const amountIn = quote.amountIn || "1";
  return (
    `${amountIn} ${quote.inputToken} → est ${quote.estimatedOutput} ${quote.outputToken} · ` +
    `min ${quote.minimumReceived} · fee ${quote.protocolFee} (${quote.protocolFeeBps} bps) · ` +
    `slip ${formatBpsAsPercent(quote.slippageBps)}% · impact ~${formatBpsAsPercent(quote.priceImpactBps)}% · ` +
    `route ${route} · ${source}`
  );
}

export function useDashboardMarket() {
  const fetchTickers = useCallback((signal: AbortSignal) => fetchMarketTickers(signal), []);
  const fetchQuote = useCallback(
    (signal: AbortSignal) =>
      fetchTradeQuote(
        { inputToken: "BNB", outputToken: "ION", amountIn: "1", slippageBps: 100 },
        signal,
      ),
    [],
  );

  const tickers = useApiResource(fetchTickers, [] as MarketTicker[], {
    isEmpty: (data) => data.length === 0,
  });
  const quote = useApiResource(fetchQuote, emptyQuote);
  const { candles, loadState: candleState, provenanceLabel: candleProv } = useMarketCandles(
    "BNB/ION",
    "15m",
  );

  const ionTicker = useMemo(
    () =>
      tickers.state === "ready"
        ? (tickers.data.find((ticker) => ticker.symbol === "ION") ?? tickers.data[0])
        : undefined,
    [tickers.data, tickers.state],
  );

  const chartPoints = useMemo((): MarketChartPoint[] => {
    if (candleState !== "ready" || candles.length === 0) {
      return [];
    }
    return normalizeChartPoints(
      candles.map((candle) => ({
        time: candle.time,
        value: candle.close,
      })),
    );
  }, [candleState, candles]);

  const quoteLine = useMemo(() => {
    if (quote.state !== "ready" || !ionTicker) {
      return null;
    }
    return {
      ticker: `ION ${ionTicker.displayPrice} · ${ionTicker.displayChange}`,
      swap: buildP1QuoteSummary(quote.data),
      quoteMeta: quote.meta,
      tickerMeta: tickers.meta,
    };
  }, [ionTicker, quote.data, quote.meta, quote.state, tickers.meta]);

  return {
    tickers,
    quote,
    ionTicker,
    candles,
    chartPoints,
    candleState,
    candleProv,
    quoteLine,
  };
}
