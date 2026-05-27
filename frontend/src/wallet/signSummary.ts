export type SignSummaryItem = {
  label: string;
  value: string;
};

export type SignSummaryPayload = {
  title: string;
  items: SignSummaryItem[];
  raw?: unknown;
};

export type AssetSignSummary = {
  action: string;
  token: string;
  amount: string;
  fee: string;
  chainId: number;
  destination?: string;
  slippage?: string;
};

export function assetSignSummaryToPayload(summary: AssetSignSummary): SignSummaryPayload {
  const items: SignSummaryItem[] = [
    { label: "Token", value: summary.token },
    { label: "Amount", value: summary.amount },
    { label: "Fee", value: summary.fee },
    { label: "Chain", value: String(summary.chainId) },
  ];
  if (summary.slippage) {
    items.push({ label: "Slippage", value: summary.slippage });
  }
  if (summary.destination) {
    items.push({ label: "Destination", value: summary.destination });
  }
  return { title: summary.action, items, raw: summary };
}

export function buildSignSummaryPayload(raw: unknown): SignSummaryPayload {
  if (raw && typeof raw === "object" && "title" in raw) {
    const record = raw as Record<string, unknown>;
    const title = String(record.title ?? "Signature request");
    const items = Array.isArray(record.items)
      ? (record.items as Array<{ label: unknown; value: unknown }>).map((row) => ({
          label: String(row.label),
          value: String(row.value),
        }))
      : [];
    return { title, items, raw };
  }
  return {
    title: "Signature request",
    items: [],
    raw,
  };
}
