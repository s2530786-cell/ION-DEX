import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type NeonButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "cyan" | "magenta" | "gold" | "mixed";
  }
>;

const COLOR_MAP = {
  cyan: {
    gradient: "linear-gradient(110deg,#24f7ff,#00c8d6_48%,#24f7ff)",
    shadow: "0_0_26px_rgba(36,247,255,0.4)",
    hoverShadow: "0_0_38px_rgba(36,247,255,0.6)",
  },
  magenta: {
    gradient: "linear-gradient(110deg,#ff3bd4,#d41ba0_48%,#ff3bd4)",
    shadow: "0_0_26px_rgba(255,59,212,0.4)",
    hoverShadow: "0_0_38px_rgba(255,59,212,0.6)",
  },
  gold: {
    gradient: "linear-gradient(110deg,#ffd166,#d4a832_48%,#ffd166)",
    shadow: "0_0_26px_rgba(255,209,102,0.4)",
    hoverShadow: "0_0_38px_rgba(255,209,102,0.6)",
  },
  mixed: {
    gradient: "linear-gradient(110deg,#24f7ff,#8d4dff_48%,#ff3bd4)",
    shadow: "0_0_26px_rgba(36,247,255,0.35)",
    hoverShadow: "0_0_34px_rgba(255,59,212,0.45)",
  },
};

export function NeonButton({
  children,
  className = "",
  variant = "mixed",
  ...props
}: NeonButtonProps) {
  const c = COLOR_MAP[variant];
  return (
    <button
      style={{
        background: c.gradient,
        boxShadow: c.shadow,
      }}
      className={`relative rounded-full px-5 py-3 text-sm font-black text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = c.hoverShadow;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = c.shadow;
      }}
      {...props}
    >
      {/* Inner glass highlight */}
      <span className="pointer-events-none absolute inset-[1px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_55%)]" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
