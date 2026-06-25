import { useCallback, useEffect, useMemo, useState } from "react";
import { useApiResource } from "@/hooks/useApiResource";
import { useI18n } from "@/i18n/I18nProvider";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonCard } from "@/components/ui/NeonCard";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { writePageHash } from "@/lib/pageRouting";
import { fetchDiscoverMarket, type ApiMeta, type DiscoverToken } from "@/lib/ionApi";

type DiscoverPageProps = Record<string, never>;

const FAVS_KEY = "ion-favs";

type CategoryDef = { id: string; labelEn: string; labelZh: string };

const CATEGORIES: CategoryDef[] = [
  { id: "all", labelEn: "All", labelZh: "全部" },
  { id: "trending", labelEn: "🔥 Trending", labelZh: "🔥 热门" },
  { id: "gainer", labelEn: "Gainers", labelZh: "涨幅榜" },
  { id: "loser", labelEn: "Losers", labelZh: "跌幅榜" },
  { id: "new", labelEn: "New", labelZh: "新币" },
  { id: "favorites", labelEn: "★ Favorites", labelZh: "★ 自选" },
];

const fallbackTokens: DiscoverToken[] = [];

function readFavs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  if (value < 0.01) return `$${value}`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

export function DiscoverPage(_props: DiscoverPageProps) {
  const { isZh } = useI18n();
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [favs, setFavs] = useState<string[]>(() => readFavs());

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  // "favorites" is a client-side view over the full catalog.
  const fetchCat = cat === "favorites" ? "all" : cat;

  const fetchTokens = useCallback(
    async (signal: AbortSignal): Promise<{ data: DiscoverToken[]; meta: ApiMeta }> => {
      const data = await fetchDiscoverMarket(fetchCat, debouncedQuery, signal);
      const meta: ApiMeta = {
        source: "upstream",
        updatedAt: new Date().toISOString(),
        stale: false,
        requestId: "discover-market-ui",
      };
      return { data, meta };
    },
    [fetchCat, debouncedQuery],
  );

  const market = useApiResource(fetchTokens, fallbackTokens, {
    isEmpty: (data) => data.length === 0,
  });

  const tokens = useMemo(() => {
    if (cat === "favorites") {
      return market.data.filter((token) => favs.includes(token.symbol));
    }
    return market.data;
  }, [cat, favs, market.data]);

  const toggleFav = useCallback((symbol: string) => {
    setFavs((prev) => {
      const next = prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol];
      try {
        window.localStorage.setItem(FAVS_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota / privacy-mode errors */
      }
      return next;
    });
  }, []);

  return (
    <div className="flex w-full min-w-0 flex-col gap-5" data-testid="page-discover">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/45">Discover</p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            {isZh ? "发现" : "Discover"}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-cyan-100/60">
            {isZh
              ? "探索 ION、BSC 与以太坊上的热门代币。"
              : "Explore trending tokens across ION, BSC and Ethereum."}
          </p>
        </div>
        <div className="w-full sm:w-72">
          <input
            className="w-full rounded-full border border-cyan-400/20 bg-white/[0.04] px-4 py-2.5 text-sm text-cyan-100 outline-none transition focus:border-cyan-300/50"
            data-testid="market-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isZh ? "搜索代币或符号" : "Search token or symbol"}
            value={query}
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const active = cat === category.id;
          return (
            <button
              key={category.id}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition ${
                active
                  ? "border-cyan-300/60 bg-cyan-300/10 text-cyan-200"
                  : "border-white/10 bg-white/[0.03] text-cyan-100/55 hover:text-cyan-100"
              }`}
              data-testid={`cat-${category.id}`}
              onClick={() => setCat(category.id)}
              type="button"
            >
              {isZh ? category.labelZh : category.labelEn}
            </button>
          );
        })}
      </div>

      <DataSourceBadge meta={market.meta} testId="discover-source" />

      <NeonCard density="compact" variant="mixed">
        {/* Table header */}
        <div
          className="grid items-center gap-2 border-b border-white/10 px-2 pb-3 text-[0.65rem] uppercase tracking-[0.14em] text-cyan-100/45"
          style={{ gridTemplateColumns: "32px 1.6fr 1fr 0.8fr 1fr 1fr" }}
        >
          <span aria-hidden="true" />
          <span>{isZh ? "代币" : "Token"}</span>
          <span className="text-right">{isZh ? "价格" : "Price"}</span>
          <span className="text-right">24h</span>
          <span className="text-right">{isZh ? "成交量" : "Volume"}</span>
          <span className="text-right">{isZh ? "市值" : "Market Cap"}</span>
        </div>

        <AsyncState
          emptyMessage={isZh ? "未找到代币。" : "No tokens found."}
          error={market.error}
          onRetry={market.reload}
          state={cat === "favorites" && tokens.length === 0 ? "empty" : market.state}
          testId="discover-market"
        >
          <div className="mt-1 flex flex-col">
            {tokens.map((token) => {
              const positive = token.change24h >= 0;
              const isFav = favs.includes(token.symbol);
              return (
                <div
                  key={token.symbol}
                  className="grid items-center gap-2 rounded-xl px-2 py-3 transition hover:bg-white/[0.04]"
                  data-testid={`market-row-${token.symbol}`}
                  style={{ gridTemplateColumns: "32px 1.6fr 1fr 0.8fr 1fr 1fr" }}
                >
                  <button
                    aria-label={isFav ? "Remove favorite" : "Add favorite"}
                    className={`text-lg leading-none ${isFav ? "text-amber-300" : "text-cyan-100/35"}`}
                    data-testid={`fav-${token.symbol}`}
                    onClick={() => toggleFav(token.symbol)}
                    type="button"
                  >
                    {isFav ? "★" : "☆"}
                  </button>
                  <button
                    className="flex items-center gap-2 text-left"
                    onClick={() => writePageHash("swap")}
                    type="button"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/30 to-purple-500/30 text-xs font-bold text-white">
                      {token.symbol.charAt(0)}
                    </span>
                    <span>
                      <span className="flex items-center gap-1.5 font-bold text-white">
                        {token.symbol}
                        <span className="rounded border border-white/10 px-1 py-0.5 text-[0.6rem] text-cyan-100/55">
                          {token.chain}
                        </span>
                      </span>
                      <span className="block text-[0.7rem] text-cyan-100/50">{token.name}</span>
                    </span>
                  </button>
                  <span className="text-right font-mono text-sm text-white">
                    {formatPrice(token.price)}
                  </span>
                  <span
                    className={`text-right font-mono text-sm ${positive ? "text-emerald-300" : "text-rose-300"}`}
                  >
                    {positive ? "+" : ""}
                    {token.change24h}%
                  </span>
                  <span className="text-right font-mono text-sm text-cyan-100/60">
                    {formatCompactUsd(token.volume)}
                  </span>
                  <span className="text-right font-mono text-sm text-cyan-100/60">
                    {formatCompactUsd(token.mcap)}
                  </span>
                </div>
              );
            })}
          </div>
        </AsyncState>
      </NeonCard>
    </div>
  );
}

export default DiscoverPage;
