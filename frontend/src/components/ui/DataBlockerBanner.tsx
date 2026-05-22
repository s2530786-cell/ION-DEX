type DataBlockerBannerProps = {
  title: string;
  detail: string;
  testId?: string;
  className?: string;
};

export function DataBlockerBanner({ title, detail, testId, className = "" }: DataBlockerBannerProps) {
  return (
    <div
      className={`rounded-2xl border border-amber-300/25 bg-amber-400/[0.07] px-4 py-3 text-sm text-amber-100/90 ${className}`.trim()}
      data-testid={testId ?? "data-blocker"}
      role="status"
    >
      <p className="font-black uppercase tracking-wide text-amber-200/90">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-amber-100/75">{detail}</p>
    </div>
  );
}
