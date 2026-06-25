import type { PageKey } from "@/components/layout/AppShell";
import { pickLocaleValue, type AppLocale } from "@/i18n/types";

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

const navGroupsByLocale: Record<AppLocale, NavGroupDef[]> = {
  "zh-CN": [
    {
      id: "trade",
      label: "交易",
      items: [
        { key: "dashboard", label: "总览" },
        { key: "swap", label: "兑换" },
        { key: "discover", label: "发现" },
        { key: "trade", label: "交易" },
        { key: "grid", label: "网格" },
        { key: "pool", label: "资金池" },
      ],
    },
    {
      id: "earn",
      label: "收益",
      items: [
        { key: "stake", label: "质押" },
        { key: "liquidity-mine", label: "流动性挖矿" },
        { key: "copy-trade", label: "跟单" },
        { key: "portfolio", label: "我的资产" },
      ],
    },
    {
      id: "ecosystem",
      label: "生态",
      items: [
        { key: "bridge", label: "跨链桥" },
        { key: "burn", label: "销毁" },
        { key: "domain", label: "域名" },
        { key: "batch-transfer", label: "批量转账" },
        { key: "ai", label: "AI" },
        { key: "ai-market", label: "AI 策略市场" },
      ],
    },
    {
      id: "preview",
      label: "预览",
      items: [
        { key: "trade-pro", label: "专业交易", preview: true },
        { key: "approve-manager", label: "授权管理", preview: true },
        { key: "vault-stake", label: "金库质押", preview: true },
        { key: "ai-trading", label: "AI 量化", preview: true },
      ],
    },
    {
      id: "system",
      label: "系统",
      items: [{ key: "settings", label: "设置" }],
    },
  ],
  "en-US": [
    {
      id: "trade",
      label: "Trade",
      items: [
        { key: "dashboard", label: "Dashboard" },
        { key: "swap", label: "Swap" },
        { key: "discover", label: "Discover" },
        { key: "trade", label: "Trade" },
        { key: "grid", label: "Grid" },
        { key: "pool", label: "Pool" },
      ],
    },
    {
      id: "earn",
      label: "Earn",
      items: [
        { key: "stake", label: "Stake" },
        { key: "liquidity-mine", label: "Liquidity Mine" },
        { key: "copy-trade", label: "Copy Trade" },
        { key: "portfolio", label: "Portfolio" },
      ],
    },
    {
      id: "ecosystem",
      label: "Ecosystem",
      items: [
        { key: "bridge", label: "Bridge" },
        { key: "burn", label: "Burn" },
        { key: "domain", label: "Domain" },
        { key: "batch-transfer", label: "Batch Transfer" },
        { key: "ai", label: "AI" },
        { key: "ai-market", label: "AI Strategy Market" },
      ],
    },
    {
      id: "preview",
      label: "Preview",
      items: [
        { key: "trade-pro", label: "Trade Pro", preview: true },
        { key: "approve-manager", label: "Approve", preview: true },
        { key: "vault-stake", label: "Vault", preview: true },
        { key: "ai-trading", label: "AI Quant", preview: true },
      ],
    },
    {
      id: "system",
      label: "System",
      items: [{ key: "settings", label: "Settings" }],
    },
  ],
};

export const navGroups: NavGroupDef[] = navGroupsByLocale["en-US"];

export function getNavGroups(locale: AppLocale): NavGroupDef[] {
  return pickLocaleValue(locale, navGroupsByLocale);
}

export function getNavItems(locale: AppLocale): Array<{ key: PageKey; label: string }> {
  return getNavGroups(locale).flatMap((group) => group.items.map(({ key, label }) => ({ key, label })));
}

export const navItems: Array<{ key: PageKey; label: string }> = getNavItems("en-US");

export function navLabelForPage(page: PageKey, locale: AppLocale = "en-US"): string {
  return getNavItems(locale).find((item) => item.key === page)?.label ?? (locale === "zh-CN" ? "总览" : "Dashboard");
}
