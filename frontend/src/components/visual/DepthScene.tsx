import type { PropsWithChildren } from "react";

type LayerProps = PropsWithChildren<{
  className?: string;
}>;

export function DepthScene({
  children,
  className = "",
  testId,
}: PropsWithChildren<{ className?: string; testId?: string }>) {
  return (
    <div className={`depth-stage relative ${className}`.trim()} data-testid={testId}>
      {children}
    </div>
  );
}

export function DepthLayerBack({ children, className = "" }: LayerProps) {
  return (
    <div
      className={`depth-layer depth-layer-back pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function DepthLayerMid({ children, className = "" }: LayerProps) {
  return (
    <div className={`depth-layer depth-layer-mid relative z-[2] ${className}`.trim()}>{children}</div>
  );
}

export function DepthLayerFront({ children, className = "" }: LayerProps) {
  return (
    <div className={`depth-layer depth-layer-front relative z-[4] ${className}`.trim()}>{children}</div>
  );
}
