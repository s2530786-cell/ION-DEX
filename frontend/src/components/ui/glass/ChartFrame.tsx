import type { PropsWithChildren, ReactNode } from "react";

type ChartFrameProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  testId?: string;
  minHeightClass?: string;
}>;

export function ChartFrame({
  children,
  title,
  subtitle,
  badge,
  testId,
  minHeightClass = "min-h-[22rem]",
}: ChartFrameProps) {
  return (
    <div className="flow-border rounded-[2rem] p-px" data-testid={testId}>
      <div className={`glass-surface depth-stage relative overflow-hidden rounded-[2rem] p-5 ${minHeightClass}`}>
        <div className="absolute inset-0 aurora-noise opacity-70" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/45">{title}</p>
            {subtitle ? <p className="mt-1 text-2xl font-black text-white">{subtitle}</p> : null}
          </div>
          {badge}
        </div>
        <div className="relative z-10 mt-6">{children}</div>
      </div>
    </div>
  );
}
