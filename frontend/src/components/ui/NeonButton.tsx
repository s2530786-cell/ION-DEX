import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type NeonButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function NeonButton({ children, className = "", ...props }: NeonButtonProps) {
  return (
    <button
      className={`rounded-[var(--btn-radius)] bg-[linear-gradient(90deg,var(--ion-cyan),var(--ion-purple),var(--ion-magenta))] px-5 py-3 text-sm font-black text-white shadow-[var(--glow-cyan)] transition hover:scale-[1.02] hover:shadow-[var(--glow-magenta)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
