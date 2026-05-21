import { GlassPanel } from "@/components/ui/GlassPanel";

export function RiskBadge({ label, dangerous }: { label: string; dangerous: boolean }) {
  return (
    <GlassPanel variant={dangerous ? "magenta" : "cyan"} noAurora padding="sm">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${dangerous ? "bg-rose-400 shadow-neonMagenta" : "bg-emerald-400 shadow-neonCyan"}`} />
        <span className="text-xs font-bold text-white">{label}</span>
        <span className={`ml-auto text-[10px] font-black ${dangerous ? "text-rose-200" : "text-emerald-200"}`}>
          {dangerous ? "⚠️ RISK" : "✅ SAFE"}
        </span>
      </div>
    </GlassPanel>
  );
}
