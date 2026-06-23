import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type NeonButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function NeonButton({ children, className = "", ...props }: NeonButtonProps) {
  return (
    <button
      className={`rounded-[var(--btn-radius)] bg-[linear-gradient(90deg,var(--ion-cyan),var(--ion-purple),var(--ion-magenta))] px-5 py-3 text-sm font-black tracking-wide text-white shadow-[var(--glow-cyan),var(--glow-magenta)] transition hover:scale-[1.02] hover:brightness-110 hover:shadow-[var(--glow-magenta),0_0_40px_rgba(0,255,255,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
