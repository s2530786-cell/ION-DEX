import type { PropsWithChildren } from "react";
import { DesignTokens as dt } from "@/lib/design-tokens";

type DEXGridHarnessProps = PropsWithChildren<{
  className?: string;
  testId?: string;
}>;

export function DEXGridHarness({ children, className = "", testId }: DEXGridHarnessProps) {
  return (
    <div
      className={`w-full ${className}`}
      data-testid={testId}
      style={{
        display: "grid",
        gap: dt.spacing.sectionGap,
        gridTemplateColumns: dt.layout.marketColumns,
      }}
    >
      {children}
    </div>
  );
}
