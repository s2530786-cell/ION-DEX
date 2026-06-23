import { useEffect, useState } from "react";
import {
  fetchMarketCandles,
  fetchMarketDepth,
  fetchMarketOrderBook,
  fetchSwapMarketStats,
  type MarketCandle,
  type MarketDepthRow,
  type MarketOrderBookPayload,
  type MarketProvenance,
  type SwapMarketStats,
} from "@/lib/ionApi";

type LoadState = "idle" | "loading" | "ready" | "error";

function provenanceLabel(provenance: MarketProvenance | null, stale: boolean): string {
  if (!provenance) {
    return stale ? "API · stale" : "API";
  }
  return `${provenance.source} · ${provenance.model}${stale ? " · stale" : ""}`;
}

export function useMarketCandles(symbol: string, interval = "15m") {
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [provenanceLabelText, setProvenanceLabelText] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoadState("loading");
    fetchMarketCandles({ symbol, interval, limit: 120 }, controller.signal)
      .then((response) => {
        setCandles(response.data.candles);
        setProvenanceLabelText(provenanceLabel(response.data.provenance, response.meta.stale));
        setLoadState("ready");
      })
      .catch(() => {
        setCandles([]);
        setProvenanceLabelText("");
        setLoadState("error");
      });
    return () => controller.abort();
  }, [symbol, interval]);

  return { candles, loadState, provenanceLabel: provenanceLabelText };
}

export function useMarketDepth() {
  const [rows, setRows] = useState<MarketDepthRow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [provenanceLabelText, setProvenanceLabelText] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoadState("loading");
    fetchMarketDepth(controller.signal)
      .then((response) => {
        setRows(response.data.rows);
        setProvenanceLabelText(provenanceLabel(response.data.provenance, response.meta.stale));
        setLoadState("ready");
      })
      .catch(() => {
        setRows([]);
        setLoadState("error");
      });
    return () => controller.abort();
  }, []);

  return { rows, loadState, provenanceLabel: provenanceLabelText };
}

export function useMarketOrderBook(symbol: string) {
  const [book, setBook] = useState<MarketOrderBookPayload | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [provenanceLabelText, setProvenanceLabelText] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoadState("loading");
    fetchMarketOrderBook(symbol, controller.signal)
      .then((response) => {
        setBook(response.data);
        setProvenanceLabelText(provenanceLabel(response.data.provenance, response.meta.stale));
        setLoadState("ready");
      })
      .catch(() => {
        setBook(null);
        setLoadState("error");
      });
    return () => controller.abort();
  }, [symbol]);

  return { book, loadState, provenanceLabel: provenanceLabelText };
}

export function useSwapMarketStats(pair: string) {
  const [stats, setStats] = useState<SwapMarketStats | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [provenanceLabelText, setProvenanceLabelText] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoadState("loading");
    fetchSwapMarketStats(pair, controller.signal)
      .then((response) => {
        setStats(response.data.stats);
        setProvenanceLabelText(provenanceLabel(response.data.provenance, response.meta.stale));
        setLoadState("ready");
      })
      .catch(() => {
        setStats(null);
        setLoadState("error");
      });
    return () => controller.abort();
  }, [pair]);

  return { stats, loadState, provenanceLabel: provenanceLabelText };
}

export function depthToneClass(tone: MarketDepthRow["tone"]): string {
  if (tone === "positive") {
    return "text-emerald-300";
  }
  if (tone === "negative") {
    return "text-rose-300";
  }
  return "text-cyan-200";
}
