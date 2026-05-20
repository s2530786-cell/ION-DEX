type StatusPillProps = {
  label: string;
  tone?: "emerald" | "amber" | "rose" | "cyan";
  testId?: string;
};

const toneClass: Record<NonNullable<StatusPillProps["tone"]>, string> = {
  emerald: "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100",
  amber: "border-amber-300/25 bg-amber-300/[0.08] text-amber-100",
  rose: "border-rose-300/25 bg-rose-300/[0.08] text-rose-100",
  cyan: "border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-100",
};

export function StatusPill({ label, tone = "cyan", testId }: StatusPillProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-4 py-2 text-xs font-black ${toneClass[tone]}`}
      data-testid={testId}
    >
      {label}
    </span>
  );
}
