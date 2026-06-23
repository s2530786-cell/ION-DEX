import type { PropsWithChildren } from "react";

type PageContentProps = PropsWithChildren<{
  className?: string;
}>;

/** Stable page width, scroll, and grid gap — use as root wrapper on each route. */
export function PageContent({ children, className = "" }: PageContentProps) {
  return (
    <div
      className={`grid w-full min-w-0 auto-rows-min gap-5 ${className}`.trim()}
      data-testid="page-content"
    >
      {children}
    </div>
  );
}
