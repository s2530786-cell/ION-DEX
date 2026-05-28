import type { PropsWithChildren } from "react";

type ChartStageProps = PropsWithChildren<{
  className?: string;
  innerClassName?: string;
  testId?: string;
}>;

/** K-line / market chart frame — hero wave border + inner aurora fog (design ref 04). */
export function ChartStage({
  children,
  className = "",
  innerClassName = "",
  testId,
}: ChartStageProps) {
  return (
    <div
      className={`flow-border-hero min-h-0 rounded-[1.75rem] p-px ${className}`.trim()}
      data-testid={testId}
    >
      <div
        className={`glass-surface chart-stage-inner depth-stage relative min-h-0 overflow-hidden rounded-[1.75rem] ${innerClassName}`.trim()}
      >
        <div className="aurora-noise pointer-events-none absolute inset-0 opacity-75" aria-hidden />
        <div className="chart-stage-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-10 min-h-0">{children}</div>
      </div>
    </div>
  );
}
