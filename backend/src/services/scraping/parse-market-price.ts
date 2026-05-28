export type ParsedMarketPrice = {
  priceUsd: number;
  change24hPct: number | null;
  source: "coinmarketcap" | "coingecko" | "okx-web3";
};

function formatUsd(priceUsd: number): string {
  if (priceUsd >= 1000) {
    return `$${priceUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }
  if (priceUsd >= 1) {
    return `$${priceUsd.toFixed(2)}`;
  }
  return `$${priceUsd.toFixed(6)}`;
}

export function formatScrapedPriceUsd(priceUsd: number): string {
  return formatUsd(priceUsd);
}

/** CoinMarketCap coin detail pages embed live stats in __NEXT_DATA__. */
export function parseCoinMarketCapPrice(html: string): ParsedMarketPrice | null {
  const next = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!next?.[1]) return null;
  try {
    const data = JSON.parse(next[1]) as {
      props?: { pageProps?: { detailRes?: { detail?: { statistics?: { price?: number; priceChangePercentage24h?: number } } } } };
    };
    const stats = data.props?.pageProps?.detailRes?.detail?.statistics;
    const priceUsd = stats?.price;
    if (typeof priceUsd !== "number" || !Number.isFinite(priceUsd) || priceUsd <= 0) return null;
    const change24hPct =
      typeof stats?.priceChangePercentage24h === "number" && Number.isFinite(stats.priceChangePercentage24h)
        ? stats.priceChangePercentage24h
        : null;
    return { priceUsd, change24hPct, source: "coinmarketcap" };
  } catch {
    return null;
  }
}

/** CoinGecko coin pages expose USD in ExchangeRateSpecification JSON-LD when HTML is returned. */
/** OKX Web3 token pages embed live USD in og:description and <title> (SSR meta). */
export function parseOkxWeb3TokenPrice(html: string): ParsedMarketPrice | null {
  const og = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
  );
  const title = html.match(/<title>([^<]+)<\/title>/i);
  const blobs = [og?.[1], title?.[1]].filter((s): s is string => Boolean(s));

  for (const text of blobs) {
    const m =
      text.match(/实时价格为\s*\$([0-9]+(?:\.[0-9]+)?)/i) ??
      text.match(/real[- ]time price(?: is)?\s*\$([0-9]+(?:\.[0-9]+)?)/i) ??
      text.match(/ION\s*\$([0-9]+(?:\.[0-9]+)?)/i);
    if (!m?.[1]) continue;
    const priceUsd = Number.parseFloat(m[1]);
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) continue;
    return { priceUsd, change24hPct: null, source: "okx-web3" };
  }
  return null;
}

export function parseCoinGeckoPrice(html: string): ParsedMarketPrice | null {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const j = JSON.parse(block[1]) as {
        "@type"?: string;
        currentExchangeRate?: { price?: number | string };
      };
      if (j["@type"] !== "ExchangeRateSpecification" && !j.currentExchangeRate) continue;
      const raw = j.currentExchangeRate?.price;
      const priceUsd = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? ""));
      if (!Number.isFinite(priceUsd) || priceUsd <= 0) continue;
      return { priceUsd, change24hPct: null, source: "coingecko" };
    } catch {
      /* try next block */
    }
  }
  return null;
}

export function parseMarketPriceFromHtml(url: string, html: string): ParsedMarketPrice | null {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("coinmarketcap.com")) {
    return parseCoinMarketCapPrice(html);
  }
  if (host.includes("coingecko.com")) {
    return parseCoinGeckoPrice(html);
  }
  if (host.includes("okx.com") && url.includes("/token/")) {
    return parseOkxWeb3TokenPrice(html);
  }
  return null;
}
