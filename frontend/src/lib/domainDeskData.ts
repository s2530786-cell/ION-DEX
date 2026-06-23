import type { PageHeroMetric } from "@/components/ui/glass/PageHero";
import type { DomainShowcasePayload } from "@/lib/ionApi";

export function domainHeroMetricsFromShowcase(payload: DomainShowcasePayload): PageHeroMetric[] {
  return [
    { label: "Primary", value: payload.identity.primaryIonName, tone: "gold" },
    { label: "KYC", value: payload.identity.kycPass.badge, tone: "cyan" },
    { label: "Listings", value: String(payload.listings.length), tone: "magenta" },
  ];
}

export function formatKycLine(payload: DomainShowcasePayload): string {
  const kyc = payload.identity.kycPass;
  return `${kyc.badge} · ${kyc.level} · expires ${kyc.expiresAt || "—"}`;
}

export function listingRowsFromPayload(payload: DomainShowcasePayload) {
  return payload.listings.map((row) => ({
    name: row.name,
    status: row.status,
    floorIon: row.floorIon,
    owner: row.owner,
  }));
}
