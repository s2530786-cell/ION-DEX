import { useState, useEffect } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
 export function TwitterFeedPanel() {
  interface TweetSignal {
    accountId: string; name: string; tier: string; tags: string[];
    text: string; url: string; created_at: string;
    likes: number; retweets: number; replies: number; views: number;
    ai: { sentiment: string; confidence: number; reason: string };
  }
  interface TwitterData {
    updated: string; source: string; totalAccounts: number; accountsFetched: number;
    totalFetched: number; newTweets: number;
    marketSentiment: { netScore: string; mood: string; color: string; totalSignals: number; bullCount: number; bearCount: number } | null;
    signals: TweetSignal[];
  }

  const [data, setData] = useState<TwitterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState<"all" | "S" | "A" | "B" | "C">("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/twitter-feeds.json");
        if (!cancelled) { setData(await res.json()); setLoading(false); }
      } catch { if (!cancelled) setLoading(false); }
    }
    load();
    const interval = setInterval(load, 180000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const filtered = data?.signals.filter((s) => filterTier === "all" || s.tier === filterTier) ?? [];

  return (
    <div className="grid gap-3" data-testid="ai-twitter-feed">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/45">Twitter Intelligence Feed</p>
        <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-black text-sky-200">
          Social Signals
        </span>
      </div>

      {loading ? (
        <GlassPanel variant="cyan" noAurora padding="sm"><p className="animate-pulse text-sm text-cyan-200">Fetching tweets...</p></GlassPanel>
      ) : data?.marketSentiment ? (
        <>
          <GlassPanel variant="mixed" noAurora padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-cyan-100/45">Twitter Mood</p>
                <p className="mt-1 text-2xl font-black text-white">{data.marketSentiment.mood}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-cyan-100/45">Net Score</p>
                <p className={`mt-1 text-3xl font-black ${Number(data.marketSentiment.netScore) >= 0 ? "text-emerald-200" : "text-rose-200"}`}>
                  {data.marketSentiment.netScore}
                </p>
              </div>
            </div>
            <div className="mt-2 flex gap-2 text-[10px]">
              <span className="rounded bg-emerald-400/10 px-2 py-0.5 text-emerald-200">馃煝 {data.marketSentiment.bullCount}</span>
              <span className="rounded bg-rose-400/10 px-2 py-0.5 text-rose-200">馃敶 {data.marketSentiment.bearCount}</span>
              <span className="rounded bg-cyan-400/10 px-2 py-0.5 text-cyan-200">{data.accountsFetched}/{data.totalAccounts} accts</span>
              <span className="text-cyan-200/40 ml-auto">{data.totalFetched} tweets</span>
            </div>
          </GlassPanel>

          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-cyan-200/40">Filter:</span>
            {(["all","S","A","B","C"] as const).map((t) => (
              <button key={t} onClick={() => setFilterTier(t)}
                className={`rounded px-2 py-0.5 font-bold transition ${filterTier === t ? "bg-cyan-400/20 text-cyan-200" : "text-cyan-200/30 hover:text-cyan-200/60"}`}>
                {t === "all" ? "All" : `Tier ${t}`}
              </button>
            ))}
          </div>

          <div className="grid gap-2 max-h-[50vh] overflow-y-auto">
            {filtered.map((sig, i) => (
              <GlassPanel key={`${sig.accountId}-${i}`}
                variant={sig.ai.sentiment === "bullish" ? "cyan" : sig.ai.sentiment === "bearish" ? "magenta" : "mixed"}
                noAurora padding="sm">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded ${sig.tier === "S" ? "bg-amber-400/20 text-amber-200" : sig.tier === "A" ? "bg-cyan-400/15 text-cyan-200" : "text-cyan-200/40"}`}>
                    {sig.tier}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">@{sig.accountId}</span>
                      <span className="text-[10px] text-cyan-200/40">{sig.name}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-cyan-100/80">{sig.text}</p>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-cyan-200/40">
                      <span>鉂わ笍 {sig.likes.toLocaleString()}</span>
                      <span>馃攧 {sig.retweets.toLocaleString()}</span>
                      <span>馃挰 {sig.replies.toLocaleString()}</span>
                      <span className={`ml-auto rounded px-1.5 py-0.5 font-bold ${sig.ai.sentiment === "bullish" ? "bg-emerald-400/10 text-emerald-200" : sig.ai.sentiment === "bearish" ? "bg-rose-400/10 text-rose-200" : "text-cyan-200/30"}`}>
                        {sig.ai.sentiment} {sig.ai.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            ))}
            {filtered.length === 0 && (
              <GlassPanel variant="mixed" noAurora padding="sm">
                <p className="text-xs text-cyan-200/40">No tweets for Tier {filterTier}</p>
              </GlassPanel>
            )}
          </div>
        </>
      ) : (
        <GlassPanel variant="cyan" noAurora padding="sm"><p className="text-sm text-cyan-200">Run: node scripts/twitter-feeds.mjs</p></GlassPanel>
      )}
    </div>
  );
}
