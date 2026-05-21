export type DomainResolution = {
  name: string;
  available: boolean;
  ownerAddress: string | null;
  resolvedAddress: string | null;
  expiresAt: string | null;
  records: Array<{
    key: "wallet" | "profile" | "avatar";
    value: string;
    status: "mock" | "planned";
  }>;
  marketplace: {
    listed: boolean;
    floorIon: string;
    lastSaleIon: string | null;
  };
  provenance: {
    source: "mock";
    note: string;
  };
};

export type DomainListingRow = {
  name: string;
  status: "Owned" | "Listed" | "Available" | "Primary";
  priceIon: string;
  available: boolean;
};

export type DomainShowcasePayload = {
  listings: DomainListingRow[];
  identity: {
    primaryIonName: string;
    kycPass: {
      level: string;
      expiresAt: string;
      badge: string;
    };
  };
  provenance: DomainResolution["provenance"];
};

/** Names resolved for the domain desk marketplace (gateway mock; not hardcoded UI seeds). */
const SHOWCASE_NAMES = ["trader.ion", "swap.ion", "vault.ion", "custodian.ion", "demo.ion"] as const;

function formatListingPrice(resolution: DomainResolution): string {
  if (!resolution.available) {
    return resolution.marketplace.lastSaleIon
      ? `${resolution.marketplace.lastSaleIon} ION`
      : "—";
  }
  if (resolution.marketplace.listed && resolution.marketplace.floorIon !== "0.000") {
    return `${resolution.marketplace.floorIon} ION`;
  }
  return "—";
}

function listingStatus(
  resolution: DomainResolution,
  primaryIonName: string,
): DomainListingRow["status"] {
  if (resolution.name === primaryIonName) {
    return "Primary";
  }
  if (!resolution.available && resolution.ownerAddress) {
    return "Owned";
  }
  if (resolution.marketplace.listed) {
    return "Listed";
  }
  return "Available";
}

export function getDomainShowcase(): DomainShowcasePayload {
  const primaryIonName = "trader.ion";
  const listings = SHOWCASE_NAMES.map((name) => {
    const resolution = resolveDomain(name);
    return {
      name: resolution.name,
      status: listingStatus(resolution, primaryIonName),
      priceIon: formatListingPrice(resolution),
      available: resolution.available,
    };
  });
  return {
    listings,
    identity: {
      primaryIonName,
      kycPass: {
        level: "L2",
        expiresAt: "2026-11-30T00:00:00.000Z",
        badge: "KYC Pass",
      },
    },
    provenance: {
      source: "mock",
      note: "Showcase built from GET /api/domain/resolve for each catalog name; official ION DNS adapter pending.",
    },
  };
}

export function resolveDomain(name: string): DomainResolution {
  const demoOwned = name === "demo.ion" || name === "iondex.ion";
  return {
    name,
    available: !demoOwned,
    ownerAddress: demoOwned ? "ion1demoowner000000000000000000000000000000000000" : null,
    resolvedAddress: demoOwned ? "ion1resolvedwallet000000000000000000000000000000" : null,
    expiresAt: demoOwned ? "2027-05-18T00:00:00.000Z" : null,
    records: demoOwned
      ? [
          { key: "wallet", value: "ion1resolvedwallet000000000000000000000000000000", status: "mock" },
          { key: "profile", value: "ION DEX demo profile", status: "mock" },
          { key: "avatar", value: "aurora-neon", status: "planned" },
        ]
      : [],
    marketplace: {
      listed: !demoOwned,
      floorIon: demoOwned ? "0.000" : "2500.000",
      lastSaleIon: demoOwned ? "4200.000" : null,
    },
    provenance: {
      source: "mock",
      note: "Phase 3 mock resolver; official ION DNS adapter is pending.",
    },
  };
}
