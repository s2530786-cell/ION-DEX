import { useState, type FormEvent } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlassInput } from "@/components/ui/GlassInput";
import { RiskBadge } from "@/components/ui/RiskBadge"
import { NeonButton } from "@/components/ui/NeonButton";
import { SegmentedControl } from "@/pages/BusinessPages";
 export function TokenAuditPanel() {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState<"56" | "1" | "8453">("56");
  const [result, setResult] = useState<{ isHoneypot: boolean; isRugPull: boolean; hasMintFunction: boolean; hasProxy: boolean; buyTax: number; sellTax: number; riskScore: number; details: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAudit(e: FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { fetchTokenAudit } = await import("@/services/binanceAi");
      const data = await fetchTokenAudit(address.trim(), chainId);
      if (data) {
        setResult(data);
      } else {
        setError("Audit failed 閳?check the contract address and chain.");
      }
    } catch {
      setError("Network error accessing on-chain scanner.");
    } finally {
      setLoading(false);
    }
  }

  const riskColor = result ? (result.riskScore < 30 ? "text-emerald-200" : result.riskScore < 60 ? "text-amber-200" : "text-rose-200") : "";

  return (
    <div className="grid gap-4" data-testid="ai-token-audit">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/45">Token Security Audit</p>
        <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-black text-cyan-200">Smart Contract Scanner</span>
      </div>

      <form className="grid gap-3" onSubmit={runAudit}>
        <GlassInput
          label="Contract Address"
          onChange={setAddress}
          placeholder="0x..."
          testId="audit-address"
          type="text"
          value={address}
        />
        <SegmentedControl
          label="Chain"
          onChange={(v) => setChainId(v as typeof chainId)}
          options={[
            { label: "BSC", value: "56" },
            { label: "Ethereum", value: "1" },
            { label: "Base", value: "8453" },
          ]}
          testId="audit-chain"
          value={chainId}
        />
        <NeonButton className="w-full" data-testid="audit-submit" disabled={!address.trim() || loading} type="submit">
          {loading ? "Scanning..." : "Run Security Audit"}
        </NeonButton>
      </form>

      {error ? (
        <GlassPanel variant="magenta" noAurora padding="sm">
          <p className="text-sm text-rose-100">{error}</p>
        </GlassPanel>
      ) : null}

      {result ? (
        <div className="grid gap-3">
          <GlassPanel variant={result.riskScore < 30 ? "cyan" : result.riskScore < 60 ? "mixed" : "magenta"} noAurora padding="sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white">Risk Score</p>
              <p className={`text-3xl font-black ${riskColor}`}>{result.riskScore}/100</p>
            </div>
          </GlassPanel>
          <div className="grid grid-cols-2 gap-2">
            <RiskBadge label="Honeypot" dangerous={result.isHoneypot} />
            <RiskBadge label="Rug Pull" dangerous={result.isRugPull} />
            <RiskBadge label="Mintable" dangerous={result.hasMintFunction} />
            <RiskBadge label="Proxy" dangerous={result.hasProxy} />
          </div>
          <GlassPanel variant="cyan" noAurora padding="sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-cyan-200/60">Buy Tax: <span className="font-bold text-white">{result.buyTax}%</span></span>
              <span className="text-cyan-200/60">Sell Tax: <span className="font-bold text-white">{result.sellTax}%</span></span>
            </div>
          </GlassPanel>
          {result.details.length > 0 ? (
            <GlassPanel variant="mixed" noAurora padding="sm">
              <p className="mb-2 text-xs font-bold text-amber-200">Warnings</p>
              {result.details.map((d, i) => (
                <p key={i} className="text-xs text-amber-100/70">閳?{d}</p>
              ))}
            </GlassPanel>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
