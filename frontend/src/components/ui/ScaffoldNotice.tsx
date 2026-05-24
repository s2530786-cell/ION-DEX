type ScaffoldNoticeProps = {
  title?: string;
  detail: string;
  testId?: string;
};

/** Visible banner for preview/scaffold surfaces — not live chain or backend integration. */
export function ScaffoldNotice({
  title = "预览 / Scaffold",
  detail,
  testId = "scaffold-notice",
}: ScaffoldNoticeProps) {
  return (
    <div
      className="rounded-2xl border border-amber-300/30 bg-amber-300/[0.08] px-4 py-3 text-sm text-amber-100"
      data-testid={testId}
      role="status"
    >
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-amber-100/85">{detail}</p>
    </div>
  );
}
