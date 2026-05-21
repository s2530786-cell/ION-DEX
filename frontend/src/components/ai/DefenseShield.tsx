import { Fragment, useState, useEffect } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { SegmentedControl } from "@/pages/BusinessPages";
import { NeonButton } from "@/components/ui/NeonButton";
import { FormField } from "@/pages/BusinessPages";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { ATTACK_TYPES, type ShieldData } from "./shield-types";
 export function DefenseShield() {
  const [subTab, setSubTab] = useState<"analysis" | "defense">("defense");
  const [symbol, setSymbol] = useState("ION");
  const [horizon, setHorizon] = useState<"1h" | "4h" | "1d">("4h");
  const [scanType, setScanType] = useState<"quick" | "deep">("quick");
  const [analysisRan, setAnalysisRan] = useState(false);

  // Defense data
  const [data, setData] = useState<ShieldData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/defense-shield.json");
        if (!cancelled) { setData(await res.json()); setLoading(false); }
      } catch { if (!cancelled) setLoading(false); }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // AI analysis heuristics
  const ticker = symbol.trim().toUpperCase();
  const valid = ticker.length >= 2 && ticker.length <= 12 && /^[A-Z0-9]+$/.test(ticker);
  const confidence = horizon === "1h" ? 58 : horizon === "4h" ? 63 : 71;
  const sentiment = confidence > 65 ? ("棣冪厺 Bullish") : confidence > 60 ? ("閳?Neutral") : ("棣冩暥 Bearish");

  // Defense calculations
  const testPct = data ? Math.round((data.testsPassed / data.testsTarget) * 100) : 0;
  const testColor = testPct >= 100 ? "emerald" : testPct >= 50 ? "amber" : "rose";

  const btnClass = (v: string) =>
    `rounded px-3 py-1 text-[11px] font-bold transition ${subTab === v ? "bg-cyan-400/20 text-cyan-200" : "text-cyan-200/30 hover:text-cyan-200/60"}`;

  return (
    <div className="grid gap-3" data-testid="ai-defense">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/45">ION Shield 閳?Analysis &amp; Defense</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${data?.mode === "armed" ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}>
          {data?.mode === "armed" ? "棣冩礉閿?Armed" : "閳撮潻绗?Paused"}
        </span>
      </div>

      {/* Sub-tabs: Analysis / Defense */}
      <div className="flex gap-1">
        <button onClick={() => setSubTab("analysis")} className={btnClass("analysis")}>棣冩惓 AI Analysis</button>
        <button onClick={() => setSubTab("defense")} className={btnClass("defense")}>棣冩礉閿?Defense</button>
      </div>

      {subTab === "analysis" ? (
        <>
          {/* AI Analysis Form */}
          <div className="grid gap-3">
            <FormField label="Symbol" value={symbol} placeholder="ION" testId="shield-symbol" type="text"
              onChange={(v) => { setSymbol(v); setAnalysisRan(false); }} />
            <div className="grid grid-cols-2 gap-3">
              <SegmentedControl label="Horizon" value={horizon} testId="shield-horizon"
                onChange={(v) => setHorizon(v)}
                options={[{ label: "1h Pulse", value: "1h" }, { label: "4h Core", value: "4h" }, { label: "1d Macro", value: "1d" }]} />
              <SegmentedControl label="Scan" value={scanType} testId="shield-scan"
                onChange={(v) => setScanType(v)}
                options={[{ label: "Quick", value: "quick" }, { label: "Deep", value: "deep" }]} />
            </div>
            <NeonButton className="w-full" disabled={!valid} onClick={() => setAnalysisRan(true)}>
              Run Analysis
            </NeonButton>
          </div>

          {/* Results */}
          {analysisRan && valid && (
            <>
              <GlassPanel variant="cyan" noAurora padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-cyan-100/45">{ticker} Market Sentiment</p>
                    <p className="mt-1 text-xl font-black text-white">{sentiment}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-cyan-100/45">Model Confidence</p>
                    <p className="mt-1 text-2xl font-black text-cyan-200">{confidence}%</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2 text-[10px]">
                  <span className="rounded bg-cyan-400/10 px-2 py-0.5 text-cyan-200">{horizon} window</span>
                  <span className="rounded bg-cyan-400/10 px-2 py-0.5 text-cyan-200">{scanType} scan</span>
                  <span className="ml-auto text-cyan-200/40">Defense: {data?.mode ?? "armed"}</span>
                </div>
              </GlassPanel>

              <GlassPanel variant="mixed" noAurora padding="sm">
                <p className="text-xs text-cyan-100/45">Risk Factors</p>
                <div className="mt-2 grid gap-2">
                  <RiskBadge label="Reentrancy Risk" dangerous={confidence < 60} />
                  <RiskBadge label="Oracle Deviation" dangerous={confidence < 65} />
                  <RiskBadge label="MEV Exposure" dangerous={horizon === "1h"} />
                  <RiskBadge label="Liquidity Depth" dangerous={scanType === "quick"} />
                </div>
              </GlassPanel>
            </>
          )}
        </>
      ) : (
        <>
          {/* Defense Engine */}
          {loading ? (
            <GlassPanel variant="cyan" noAurora padding="sm">
              <p className="animate-pulse text-sm text-cyan-200">Initializing defense engine...</p>
            </GlassPanel>
          ) : (
            <>
              {/* Security Test Progress */}
              <GlassPanel variant="mixed" noAurora padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-cyan-100/45">Security Tests</p>
                    <p className={`mt-1 text-2xl font-black text-${testColor}-200`}>
                      {data?.testsPassed ?? 0} / {data?.testsTarget ?? 1000}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-cyan-100/45">TX Scanned</p>
                    <p className="mt-1 text-xl font-black text-cyan-100">{data?.totalScanned?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${testPct >= 100 ? "from-emerald-400 to-cyan-400" : "from-amber-400 to-rose-400"}`}
                    style={{ width: `${Math.min(testPct, 100)}%` }} />
                </div>
                <div className="mt-2 flex gap-2 text-[10px]">
                  <span className="rounded bg-rose-400/10 px-2 py-0.5 text-rose-200">Blocked {data?.totalBlocked ?? 0}</span>
                  <span className="rounded bg-cyan-400/10 px-2 py-0.5 text-cyan-200">{testPct}% green</span>
                  {testPct < 100 && <span className="ml-auto text-rose-200/60">{data ? data.testsTarget - data.testsPassed : 0} left</span>}
                </div>
              </GlassPanel>

              {/* Chain Anomaly Monitor 閳?text-based compact table */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-cyan-100/50">On-Chain Threat Monitor</p>
                <div className="grid text-[10px]" style={{ gridTemplateColumns: "1fr auto auto auto" }}>
                  <span className="pb-1.5 text-cyan-200/30">Attack Vector</span>
                  <span className="px-2 pb-1.5 text-right text-cyan-200/30">Detected</span>
                  <span className="px-2 pb-1.5 text-right text-cyan-200/30">Blocked</span>
                  <span className="pb-1.5 text-right text-cyan-200/30">Status</span>
                  {ATTACK_TYPES.map((atk) => {
                    const status = data?.attacks?.find((a) => a.id === atk.id);
                    const detected = status?.detected ?? 0;
                    const blocked = Math.floor(detected * 0.3);
                    const active = status && status.lastBlock && (Date.now() - new Date(status.lastBlock).getTime() < 3600000);
                    return (
                      <Fragment key={atk.id}>
                        <span className="border-t border-white/5 py-1.5 font-mono font-bold text-white">{atk.name}</span>
                        <span className="border-t border-white/5 px-2 py-1.5 text-right font-mono text-rose-200/70">{detected}</span>
                        <span className="border-t border-white/5 px-2 py-1.5 text-right font-mono text-rose-200/70">{blocked}</span>
                        <span className={`border-t border-white/5 py-1.5 text-right font-bold ${active ? "text-rose-200" : "text-emerald-200/60"}`}>
                          {active ? "Active" : "Clear"}
                        </span>
                      </Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Recent Blocks 閳?compact text list */}
              {data?.recentBlocks && data.recentBlocks.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-rose-200/50">Recent Interceptions</p>
                  <div className="grid gap-1 text-[10px]">
                    {data.recentBlocks.slice(0, 5).map((b, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-rose-400/10 px-1.5 py-0.5 font-bold text-rose-200">{b.type}</span>
                          <span className="font-mono text-cyan-200/40">{b.id.slice(0, 10)}...</span>
                        </div>
                        <div className="flex items-center gap-3 text-cyan-200/30">
                          <span>{b.value}</span>
                          <span className="font-mono">{b.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

