import type { LucideIcon } from "lucide-react";

export type FeatureTileVariant = "cyan" | "purple" | "bridge" | "burn" | "magenta" | "gold";

export type FeatureTileProps = {
  title: string;
  label: string;
  icon: LucideIcon;
  variant: FeatureTileVariant;
  testId: string;
  onClick: () => void;
};

const iconGlow: Record<FeatureTileVariant, string> = {
  cyan: "shadow-neonCyan text-cyan-200 drop-shadow-[0_0_14px_rgba(0,255,255,0.6)]",
  purple: "text-violet-200 drop-shadow-[0_0_14px_rgba(96,32,255,0.75)]",
  bridge:
    "text-cyan-100 drop-shadow-[0_0_16px_rgba(96,32,255,0.8)] drop-shadow-[0_0_22px_rgba(0,255,255,0.35)]",
  burn: "text-fuchsia-200 drop-shadow-[0_0_12px_rgba(0,255,255,0.45)] drop-shadow-[0_0_16px_rgba(255,0,255,0.55)]",
  magenta: "shadow-neonMagenta text-fuchsia-200 drop-shadow-[0_0_14px_rgba(255,0,255,0.6)]",
  gold: "shadow-neonGold text-amber-200 drop-shadow-[0_0_12px_rgba(255,0,255,0.45)]",
};

const rimGlow: Record<FeatureTileVariant, string> = {
  cyan: "from-cyan-400/35 via-transparent to-fuchsia-500/12",
  purple: "from-violet-500/30 via-purple-400/10 to-cyan-400/12",
  bridge: "from-cyan-400/25 via-violet-500/35 to-fuchsia-500/15",
  burn: "from-cyan-400/28 via-sky-500/8 to-fuchsia-500/28",
  magenta: "from-fuchsia-500/28 via-transparent to-cyan-400/14",
  gold: "from-fuchsia-400/22 via-amber-300/18 to-cyan-300/12",
};

const iconShell: Record<FeatureTileVariant, string> = {
  cyan: "bg-white/[0.08]",
  purple: "bg-white/[0.08]",
  bridge:
    "bg-[radial-gradient(circle_at_32%_28%,rgba(0,255,255,0.38),rgba(96,32,255,0.55)_52%,rgba(8,6,28,0.92)_100%)]",
  burn: "bg-white/[0.08]",
  magenta: "bg-white/[0.08]",
  gold: "bg-white/[0.08]",
};

/** Compact dashboard nav tile — bottom feature grid (design ref 04 / 02). */
export function FeatureTile({ title, label, icon: Icon, variant, testId, onClick }: FeatureTileProps) {
  return (
    <button
      className="group w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
      data-testid={testId}
      onClick={onClick}
      type="button"
    >
      <div className="flow-border rounded-[1.35rem] p-px transition-transform duration-300 group-hover:scale-[1.02]">
        <div
          className={[
            "relative flex min-h-[7.25rem] flex-col justify-between overflow-hidden rounded-[1.35rem]",
            "border border-white/10 bg-[linear-gradient(155deg,rgba(10,22,48,0.92),rgba(14,10,36,0.78))]",
            "p-4 backdrop-blur-xl",
          ].join(" ")}
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${rimGlow[variant]} opacity-80`}
          />
          <div
            className={`float-3d relative z-10 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 ${iconShell[variant]} ${iconGlow[variant]}`}
          >
            <Icon aria-hidden size={24} strokeWidth={1.75} />
          </div>
          <div className="relative z-10">
            <p className="text-lg font-black leading-tight text-white">{title}</p>
            <p className="mt-0.5 text-xs text-cyan-100/55">{label}</p>
          </div>
        </div>
      </div>
    </button>
  );
}
