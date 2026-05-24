import type { ServerConfig } from "../config/server-config.js";
import { fetchJson } from "../lib/http.js";
import type { MarketTicker } from "../services/markets.js";

type CmcQuote = {
  price: number;
  percent_change_24h: number;
};

type CmcQuotesResponse = {
  data: Record<
    string,
    {
      symbol: string;
      quote: {
        USD: CmcQuote;
      };
    }
  >;
};

const MARKET_SYMBOLS = ["ION", "BNB", "BTC", "ETH", "SOL", "USDT"] as const;

function formatUsd(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }
  if (price >= 1) {
    return `$${price.toFixed(2)}`;
  }
  return `$${price.toFixed(4)}`;
}

function formatChange(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function assertCmcConfigured(config: ServerConfig): void {
  if (!config.cmcApiKey) {
    throw new Error(
      "CMC_API_KEY is required for live market data. Set it in backend/.env (see .env.example).",
    );
  }
}

/** 批量查询 symbol → USD 价格 */
export async function fetchCmcUsdPrice(symbols: string[]): Promise<Record<string, number>> {
  try {
    const url = new URL("/v1/cryptocurrency/quotes/latest", "https://pro-api.coinmarketcap.com");
    url.searchParams.set("symbol", symbols.join(","));
    const body = await fetchJson<CmcQuotesResponse>(url.toString(), {
      method: "GET",
      headers: {
        "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY ?? "",
        accept: "application/json",
      },
      timeoutMs: 10000,
    });
    const prices: Record<string, number> = {};
    for (const entry of Object.values(body.data)) {
      if (entry?.quote?.USD) {
        prices[entry.symbol] = entry.quote.USD.price;
      }
    }
    return prices;
  } catch {
    return {};
  }
}

export async function fetchCmcMarketTickers(config: ServerConfig): Promise<MarketTicker[]> {
  assertCmcConfigured(config);

  const url = new URL("/v1/cryptocurrency/quotes/latest", config.cmcApiBaseUrl);
  url.searchParams.set("symbol", MARKET_SYMBOLS.join(","));

  const body = await fetchJson<CmcQuotesResponse>(url.toString(), {
    method: "GET",
    headers: {
      "X-CMC_PRO_API_KEY": config.cmcApiKey as string,
      accept: "application/json",
    },
    timeoutMs: config.httpTimeoutMs,
  });

  const tickers: MarketTicker[] = [];

  for (const symbol of MARKET_SYMBOLS) {
    const entry = Object.values(body.data).find((row) => row.symbol === symbol);
    if (!entry?.quote?.USD) {
      continue;
    }
    const priceUsd = entry.quote.USD.price;
    const change24hPct = entry.quote.USD.percent_change_24h;
    tickers.push({
      symbol,
      priceUsd,
      displayPrice: formatUsd(priceUsd),
      change24hPct,
      displayChange: formatChange(change24hPct),
      provenance: {
        source: "cmc",
        note: "CoinMarketCap quotes/latest (display only; not settlement oracle).",
      },
    });
  }

  if (tickers.length === 0) {
    throw new Error("CMC returned no ticker rows for requested symbols.");
  }

  return tickers;
}
