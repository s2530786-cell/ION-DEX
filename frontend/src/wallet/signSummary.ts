export type SignSummaryItem = {
  label: string;
  value: string;
};

export type SignSummaryPayload = {
  title: string;
  items: SignSummaryItem[];
  raw?: unknown;
};

export type SignSummaryLocale = "zh-CN" | "en-US";

export type AssetSignSummary = {
  action: string;
  token: string;
  amount: string;
  fee: string;
  chainId: number;
  destination?: string;
  slippage?: string;
};

export function assetSignSummaryToPayload(
  summary: AssetSignSummary,
  locale: SignSummaryLocale = "en-US",
): SignSummaryPayload {
  const isZh = locale === "zh-CN";
  const items: SignSummaryItem[] = [
    { label: isZh ? "代币" : "Token", value: summary.token },
    { label: isZh ? "数量" : "Amount", value: summary.amount },
    { label: isZh ? "费用" : "Fee", value: summary.fee },
    { label: isZh ? "链" : "Chain", value: String(summary.chainId) },
  ];
  if (summary.slippage) {
    items.push({ label: isZh ? "滑点" : "Slippage", value: summary.slippage });
  }
  if (summary.destination) {
    items.push({ label: isZh ? "目标地址" : "Destination", value: summary.destination });
  }
  return { title: summary.action, items, raw: summary };
}

export function buildSignSummaryPayload(
  raw: unknown,
  locale: SignSummaryLocale = "en-US",
): SignSummaryPayload {
  const fallbackTitle = locale === "zh-CN" ? "签名请求" : "Signature request";
  if (raw && typeof raw === "object" && "title" in raw) {
    const record = raw as Record<string, unknown>;
    const title = String(record.title ?? fallbackTitle);
    const items = Array.isArray(record.items)
      ? (record.items as Array<{ label: unknown; value: unknown }>).map((row) => ({
          label: String(row.label),
          value: String(row.value),
        }))
      : [];
    return { title, items, raw };
  }
  return {
    title: fallbackTitle,
    items: [],
    raw,
  };
}
