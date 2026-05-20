type RiskNoticeProps = {
  title: string;
  body: string;
  tone?: "emerald" | "amber" | "fuchsia";
  testId?: string;
};

const toneBorder: Record<NonNullable<RiskNoticeProps["tone"]>, string> = {
  emerald: "border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-100/85",
  amber: "border-amber-300/25 bg-amber-300/[0.07] text-amber-100/85",
  fuchsia: "border-fuchsia-300/25 bg-fuchsia-300/[0.07] text-fuchsia-100/85",
};

export function RiskNotice({ title, body, tone = "fuchsia", testId }: RiskNoticeProps) {
  return (
    <div className={`rounded-2xl border p-4 text-sm ${toneBorder[tone]}`} data-testid={testId}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{title}</p>
      <p className="mt-2 leading-relaxed">{body}</p>
    </div>
  );
}
