import type { DomainListingRow, DomainShowcasePayload } from "@/lib/ionApi";

export function domainHeroMetricsFromShowcase(
  payload: DomainShowcasePayload,
): Array<{ label: string; value: string; tone: "cyan" | "gold" | "magenta"; testId?: string }> {
  const primary = payload.listings.find((row) => row.status === "Primary") ?? payload.listings[0];
  const listed = payload.listings.filter((row) => row.status === "Listed").length;
  return [
    {
      label: "Primary",
      value: primary?.name ?? payload.identity.primaryIonName,
      tone: "cyan",
      testId: "domain-metric-primary",
    },
    {
      label: "Listed",
      value: String(listed),
      tone: "gold",
      testId: "domain-metric-listed",
    },
    {
      label: "KYC",
      value: payload.identity.kycPass.badge,
      tone: "magenta",
      testId: "domain-metric-kyc",
    },
  ];
}

export function formatKycLine(payload: DomainShowcasePayload): string {
  const expires = payload.identity.kycPass.expiresAt.slice(0, 10);
  return `${payload.identity.kycPass.badge} ${payload.identity.kycPass.level} · expires ${expires} · profile hub linked`;
}

export function listingRowsFromPayload(payload: DomainShowcasePayload): DomainListingRow[] {
  return payload.listings;
}
