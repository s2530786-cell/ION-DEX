import type { PageKey } from "@/components/layout/AppShell";

export type NavItemDef = {
  key: PageKey;
  label: string;
  /** Preview / demo routes — shown with muted styling in sidebar */
  preview?: boolean;
};

export type NavGroupDef = {
  id: string;
  label: string;
  items: NavItemDef[];
};

export const navGroups: NavGroupDef[] = [
  {
    id: "trade",
    label: "交易",
    items: [
      { key: "dashboard", label: "Dashboard" },
      { key: "swap", label: "Swap" },
      { key: "trade", label: "Trade" },
      { key: "grid", label: "Grid" },
      { key: "pool", label: "Pool" },
    ],
  },
  {
    id: "earn",
    label: "收益",
    items: [
      { key: "stake", label: "Stake" },
      { key: "liquidity-mine", label: "Liquidity Mine" },
      { key: "copy-trade", label: "Copy Trade" },
    ],
  },
  {
    id: "ecosystem",
    label: "生态",
    items: [
      { key: "bridge", label: "Bridge" },
      { key: "burn", label: "Burn" },
      { key: "domain", label: "Domain" },
      { key: "batch-transfer", label: "Batch Transfer" },
      { key: "ai", label: "AI" },
    ],
  },
  {
    id: "preview",
    label: "预览",
    items: [
      { key: "trade-pro", label: "Trade Pro", preview: true },
      { key: "approve-manager", label: "Approve", preview: true },
      { key: "vault-stake", label: "Vault", preview: true },
      { key: "ai-trading", label: "AI Quant", preview: true },
    ],
  },
  {
    id: "system",
    label: "系统",
    items: [{ key: "settings", label: "Settings" }],
  },
];

/** Flat list for page titles and legacy imports */
export const navItems: Array<{ key: PageKey; label: string }> = navGroups.flatMap((group) =>
  group.items.map(({ key, label }) => ({ key, label })),
);

export function navLabelForPage(page: PageKey): string {
  return navItems.find((item) => item.key === page)?.label ?? "Dashboard";
}
