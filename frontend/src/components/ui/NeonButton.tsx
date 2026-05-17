import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type NeonButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function NeonButton({ children, className = "", ...props }: NeonButtonProps) {
  return (
    <button
      className={`rounded-full bg-[linear-gradient(110deg,#24f7ff,#8d4dff_48%,#ff3bd4)] px-5 py-3 text-sm font-black text-white shadow-[0_0_26px_rgba(36,247,255,0.35)] transition hover:scale-[1.02] hover:shadow-[0_0_34px_rgba(255,59,212,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
