type MetricTileProps = {
  label: string;
  value: string;
  tone?: "cyan" | "magenta" | "gold" | "emerald";
  testId?: string;
};

const toneClass: Record<NonNullable<MetricTileProps["tone"]>, string> = {
  cyan: "text-cyan-200 shadow-neonCyan",
  magenta: "text-fuchsia-200 shadow-neonMagenta",
  gold: "text-amber-200 shadow-neonGold",
  emerald: "text-emerald-200",
};

export function MetricTile({ label, value, tone = "cyan", testId }: MetricTileProps) {
  return (
    <div className={`glass-surface rounded-2xl px-4 py-3 ${toneClass[tone]}`} data-testid={testId}>
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/45">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}
