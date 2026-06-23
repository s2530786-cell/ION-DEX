type DataProvenanceBadgeProps = {
  label: string;
  stale?: boolean;
  testId?: string;
  className?: string;
};

export function DataProvenanceBadge({
  label,
  stale = false,
  testId = "data-provenance",
  className = "",
}: DataProvenanceBadgeProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${className} ${
        stale
          ? "border-amber-300/30 bg-amber-300/[0.08] text-amber-100"
          : "border-cyan-300/25 bg-cyan-300/[0.06] text-cyan-100/80"
      }`}
      data-testid={testId}
      title={label}
    >
      <span className="truncate">{label}</span>
      {stale ? <span className="shrink-0 text-amber-200">stale</span> : null}
    </span>
  );
}
