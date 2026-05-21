import { useState, useEffect } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { SegmentedControl } from "@/pages/BusinessPages";
 export function CryptoPanel() {
  interface SentimentSignal {
    source: string; category?: string; influencer?: string; weight: number;
    title: string; link: string; date: string; outlet: string;
    ai: { sentiment: string; confidence: number; reason: string };
  }
  interface TrendingCoin {
    name: string; symbol: string; marketCapRank: number;
    priceChange24h: number | null; sparkline: string; source: string;
  }
  interface SentimentData {
    updated: string; totalSignals: number;
    marketSentiment: { netScore: string; mood: string; color: string; totalSignals: number; bullCount: number; bearCount: number } | null;
    trending: TrendingCoin[];
    signals: { bullish: SentimentSignal[]; bearish: SentimentSignal[]; neutral: SentimentSignal[] };
  }

  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState<"bullish" | "bearish" | "neutral" | "trending">("bullish");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/crypto-sentiment.json");
        if (!cancelled) { setData(await res.json()); setLoading(false); }
      } catch { if (!cancelled) setLoading(false); }
    }
    load();
    const interval = setInterval(load, 300000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <div className="grid gap-3" data-testid="ai-crypto-sentiment">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/45">Market Sentiment Engine</p>
        <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-black text-cyan-200">Market Intelligence</span>
      </div>
      {loading ? (
        <GlassPanel variant="cyan" noAurora padding="sm"><p className="animate-pulse text-sm text-cyan-200">Aggregating signals...</p></GlassPanel>
      ) : data?.marketSentiment ? (
        <>
          <GlassPanel variant="mixed" noAurora padding="sm">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-cyan-100/45">Market Mood</p><p className="mt-1 text-2xl font-black text-white">{data.marketSentiment.mood}</p></div>
              <div className="text-right"><p className="text-xs text-cyan-100/45">Net Score</p><p className={`mt-1 text-3xl font-black ${Number(data.marketSentiment.netScore) >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{data.marketSentiment.netScore}</p></div>
            </div>
            <div className="mt-2 flex gap-2 text-[10px]">
              <span className="rounded bg-emerald-400/10 px-2 py-0.5 text-emerald-200">馃煝 {data.marketSentiment.bullCount} bullish</span>
              <span className="rounded bg-rose-400/10 px-2 py-0.5 text-rose-200">馃敶 {data.marketSentiment.bearCount} bearish</span>
              <span className="text-cyan-200/40 ml-auto">{data.totalSignals} signals</span>
            </div>
          </GlassPanel>
          <SegmentedControl label="Feed" onChange={(v) => setFeedTab(v as typeof feedTab)}
            options={[{ label: "馃煝 Bullish", value: "bullish" },{ label: "馃敶 Bearish", value: "bearish" },{ label: "鈿?Neutral", value: "neutral" },{ label: "馃搳 Trending", value: "trending" }]}
            testId="sentiment-feed-tab" value={feedTab} />
          <div className="grid gap-2 max-h-[45vh] overflow-y-auto">
            {feedTab === "trending" ? (
              data.trending.map((coin, i) => (
                <GlassPanel key={`${coin.symbol}-${i}`} variant="cyan" noAurora padding="sm">
                  <div className="flex items-center justify-between">
                    <div><span className="text-sm font-bold text-white">{coin.name}</span><span className="ml-2 text-[10px] text-cyan-200/50">#{coin.marketCapRank}</span></div>
                    {coin.priceChange24h != null && <span className={`text-xs font-black ${coin.priceChange24h >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{coin.priceChange24h >= 0 ? "+" : ""}{coin.priceChange24h.toFixed(1)}%</span>}
                  </div>
                </GlassPanel>
              ))
            ) : (
              data.signals[feedTab]?.map((sig, i) => (
                <GlassPanel key={i} variant={feedTab === "bullish" ? "cyan" : feedTab === "bearish" ? "magenta" : "mixed"} noAurora padding="sm">
                  <p className="text-xs font-bold text-white leading-relaxed">{sig.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px]">
                    <span className="text-cyan-200/50">{sig.category || "news"}</span>
                    {sig.influencer && <span className="rounded bg-amber-400/10 px-1 text-amber-200">@{sig.influencer}</span>}
                    {sig.category && <span className="text-cyan-200/30">{sig.category}</span>}
                    <span className="ml-auto text-cyan-200/40">{sig.ai.confidence}% conf</span>
                  </div>
                </GlassPanel>
              ))
            )}
          </div>
        </>
      ) : (
        <GlassPanel variant="cyan" noAurora padding="sm"><p className="text-sm text-cyan-200">No sentiment data. Run crypto-sentinel.</p></GlassPanel>
      )}
    </div>
  );
}
