import type { PropsWithChildren, ReactNode } from "react";

type GlassPanelProps = PropsWithChildren<{
  className?: string;
  testId?: string;
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
}>;

export function GlassPanel({ children, className = "", testId, title, eyebrow, action }: GlassPanelProps) {
  return (
    <section className={`glass-surface rounded-[1.4rem] p-4 ${className}`} data-testid={testId}>
      {eyebrow || title || action ? (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {eyebrow ? (
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/45">{eyebrow}</p>
            ) : null}
            {title ? <p className="mt-1 text-sm font-black text-white">{title}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
