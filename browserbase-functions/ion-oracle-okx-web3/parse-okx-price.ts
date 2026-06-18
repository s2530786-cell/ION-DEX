/** Mirrors backend parseOkxWeb3TokenPrice — kept local for Browserbase deploy bundle. */
export type ParsedOkxPrice = {
  priceUsd: number;
  change24hPct: number | null;
  source: "okx-web3";
};

export function parseOkxWeb3TokenPrice(html: string): ParsedOkxPrice | null {
  const og = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
  );
  const title = html.match(/<title>([^<]+)<\/title>/i);
  const blobs = [og?.[1], title?.[1]].filter((s): s is string => Boolean(s));

  for (const blob of blobs) {
    const zh = blob.match(/实时价格为\s*\$([0-9]+(?:\.[0-9]+)?)/i);
    if (zh?.[1]) {
      const priceUsd = Number.parseFloat(zh[1]);
      if (Number.isFinite(priceUsd) && priceUsd > 0) {
        return { priceUsd, change24hPct: null, source: "okx-web3" };
      }
    }
    const en = blob.match(/real-time price\s*\$([0-9]+(?:\.[0-9]+)?)/i);
    if (en?.[1]) {
      const priceUsd = Number.parseFloat(en[1]);
      if (Number.isFinite(priceUsd) && priceUsd > 0) {
        return { priceUsd, change24hPct: null, source: "okx-web3" };
      }
    }
    const titleUsd = blob.match(/ION\s+\$([0-9]+(?:\.[0-9]+)?)/i);
    if (titleUsd?.[1]) {
      const priceUsd = Number.parseFloat(titleUsd[1]);
      if (Number.isFinite(priceUsd) && priceUsd > 0) {
        return { priceUsd, change24hPct: null, source: "okx-web3" };
      }
    }
  }
  return null;
}
