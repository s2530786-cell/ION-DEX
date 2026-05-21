import { useState, useEffect, type FormEvent } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlassInput } from "@/components/ui/GlassInput";
 export function SmartMoneyPanel() {
  const [signals, setSignals] = useState<Array<{ symbol: string; signalType: string; triggerPrice: number; currentPrice: number; maxGain: number; exitRate: number; address: string; tags: string[] }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const { fetchSmartMoneySignals } = await import("@/services/binanceAi");
        const data = await fetchSmartMoneySignals("56");
        if (!cancelled) setSignals(data);
      } catch {
        if (!cancelled) setError("Failed to fetch signals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="grid gap-3" data-testid="ai-smart-money">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/45">Smart Money Signals (BSC)</p>
        <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-black text-cyan-200">On-Chain Intelligence</span>
      </div>
      {loading ? (
        <GlassPanel variant="cyan" noAurora padding="sm">
          <p className="animate-pulse text-sm text-cyan-200">Fetching smart money signals...</p>
        </GlassPanel>
      ) : error ? (
        <GlassPanel variant="magenta" noAurora padding="sm">
          <p className="text-sm text-rose-100">{error}</p>
        </GlassPanel>
      ) : signals.length === 0 ? (
        <GlassPanel variant="cyan" noAurora padding="sm">
          <p className="text-sm text-cyan-200">No signals available right now.</p>
        </GlassPanel>
      ) : (
        <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
          {signals.map((s, i) => (
            <GlassPanel key={`${s.address}-${i}`} variant={s.signalType === "BUY" ? "cyan" : "magenta"} noAurora padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-black ${s.signalType === "BUY" ? "bg-emerald-400/20 text-emerald-200" : "bg-rose-400/20 text-rose-200"}`}>
                    {s.signalType}
                  </span>
                  <span className="text-sm font-bold text-white">{s.symbol || s.address.slice(0, 8) + "..."}</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-cyan-200/60">PnL </span>
                  <span className={s.maxGain >= 0 ? "font-black text-emerald-200" : "font-black text-rose-200"}>
                    {s.maxGain >= 0 ? "+" : ""}{s.maxGain.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="mt-1 flex gap-3 text-[10px] text-cyan-200/50">
                <span>Exit: {s.exitRate.toFixed(0)}%</span>
                <span>Price: {s.currentPrice.toFixed(4)}</span>
                {s.tags?.slice(0, 2).map((t) => (
                  <span key={t} className="rounded bg-amber-400/10 px-1 text-amber-200">{t}</span>
                ))}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
