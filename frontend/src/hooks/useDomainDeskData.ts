import { useCallback, useMemo } from "react";
import { useApiResource } from "@/hooks/useApiResource";
import {
  domainHeroMetricsFromShowcase,
  formatKycLine,
  listingRowsFromPayload,
} from "@/lib/domainDeskData";
import { fetchDomainShowcase, type DomainShowcasePayload } from "@/lib/ionApi";

const emptyShowcase: DomainShowcasePayload = {
  listings: [],
  identity: {
    primaryIonName: "—",
    kycPass: { level: "—", expiresAt: "", badge: "—" },
  },
  provenance: { source: "mock", note: "" },
};

export function useDomainDeskData() {
  const fetchShowcase = useCallback((signal: AbortSignal) => fetchDomainShowcase(signal), []);
  const showcase = useApiResource(fetchShowcase, emptyShowcase, {
    isEmpty: (data) => data.listings.length === 0,
    timeoutMs: 15_000,
  });

  const heroMetrics = useMemo(
    () =>
      showcase.state === "ready"
        ? domainHeroMetricsFromShowcase(showcase.data)
        : [
            { label: "Primary", value: "—", tone: "cyan" as const },
            { label: "Listed", value: "—", tone: "gold" as const },
            { label: "KYC", value: "—", tone: "magenta" as const },
          ],
    [showcase.data, showcase.state],
  );

  const listings = useMemo(
    () => (showcase.state === "ready" ? listingRowsFromPayload(showcase.data) : []),
    [showcase.data, showcase.state],
  );

  const kycLine = useMemo(
    () => (showcase.state === "ready" ? formatKycLine(showcase.data) : "Loading identity snapshot…"),
    [showcase.data, showcase.state],
  );

  return {
    showcase,
    heroMetrics,
    listings,
    kycLine,
  };
}
