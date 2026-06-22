import type { ServerConfig } from "../config/server-config.js";
import { fetchJson } from "../lib/http.js";

const BINANCE_API = "https://api.binance.com";

export type Binance24hrTicker = {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
};

type Binance24hrRow = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
  quoteVolume: string;
};

export async function fetchBinanceSpotPrice(
  config: ServerConfig,
  symbol: string,
): Promise<number> {
  const url = new URL("/api/v3/ticker/price", BINANCE_API);
  url.searchParams.set("symbol", symbol);
  const body = await fetchJson<{ symbol: string; price: string }>(url.toString(), {
    timeoutMs: config.httpTimeoutMs,
  });
  const price = Number.parseFloat(body.price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Binance returned invalid price for ${symbol}`);
  }
  return price;
}

export async function fetchBinance24hr(
  config: ServerConfig,
  symbol: string,
): Promise<Binance24hrTicker> {
  const url = new URL("/api/v3/ticker/24hr", BINANCE_API);
  url.searchParams.set("symbol", symbol);
  const body = await fetchJson<Binance24hrRow>(url.toString(), {
    timeoutMs: config.httpTimeoutMs,
  });
  const lastPrice = Number.parseFloat(body.lastPrice);
  const priceChangePercent = Number.parseFloat(body.priceChangePercent);
  if (!Number.isFinite(lastPrice) || lastPrice <= 0) {
    throw new Error(`Binance 24hr invalid lastPrice for ${symbol}`);
  }
  return {
    symbol: body.symbol,
    lastPrice,
    priceChangePercent: Number.isFinite(priceChangePercent) ? priceChangePercent : 0,
    volume: Number.parseFloat(body.volume) || 0,
    quoteVolume: Number.parseFloat(body.quoteVolume) || 0,
  };
}
