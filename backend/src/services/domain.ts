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
