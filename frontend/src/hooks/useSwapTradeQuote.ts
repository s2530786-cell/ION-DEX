import { useEffect, useMemo, useState } from "react";
import {
  fetchTradeQuote,
  type ApiMeta,
  type TradeQuote,
} from "@/lib/ionApi";
import type { ApiLoadState } from "@/hooks/useApiResource";

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

export type SwapTradeQuoteRequest = {
  inputToken: string;
  outputToken: string;
  amountIn: string;
  slippageBps: number;
};

export type SwapTradeQuoteParams = {
  fromToken: string;
  toToken: string;
  payAmount: string;
  slippagePct: string;
};

function parseSlippageBps(slippagePct: string): number {
  const pct = Number(slippagePct);
  if (!Number.isFinite(pct) || pct <= 0) {
    return 100;
  }
  return Math.round(pct * 100);
}

function parseAmount(amount: string): string | null {
  const trimmed = amount.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return trimmed;
}

/** Dashboard / compact swap — live P1 quote from `/api/trade/quote`. */
export function useSwapTradeQuote(params: SwapTradeQuoteParams) {
  const request = useMemo((): SwapTradeQuoteRequest | null => {
    if (params.fromToken === params.toToken) {
      return null;
    }
    const amountIn = parseAmount(params.payAmount);
    if (!amountIn) {
      return null;
    }
    return {
      inputToken: params.fromToken,
      outputToken: params.toToken,
      amountIn,
      slippageBps: parseSlippageBps(params.slippagePct),
    };
  }, [params.fromToken, params.toToken, params.payAmount, params.slippagePct]);

  const [data, setData] = useState<TradeQuote>(emptyQuote);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [state, setState] = useState<ApiLoadState>("empty");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!request) {
      setData(emptyQuote);
      setMeta(null);
      setError(null);
      setState("empty");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    let cancelled = false;

    setState("loading");
    setError(null);

    fetchTradeQuote(request, controller.signal)
      .then((response) => {
        if (cancelled) {
          return;
        }
        setData(response.data);
        setMeta(response.meta);
        setState("ready");
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        setData(emptyQuote);
        setMeta(null);
        setState("error");
        setError(cause instanceof Error ? cause.message : "Quote request failed");
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [request]);

  return { data, meta, state, error, request };
}
