import { getDomainManageOverview } from "./domainManage.js";

export type DomainShowcasePayload = {
  listings: Array<{
    name: string;
    status: string;
    floorIon: string;
    owner: string;
  }>;
  identity: {
    primaryIonName: string;
    kycPass: { level: string; expiresAt: string; badge: string };
  };
  provenance: { source: string; note: string };
};

function formatFloorIon(feeRegister: string): string {
  const parsed = Number.parseFloat(feeRegister);
  if (!Number.isFinite(parsed)) {
    return feeRegister;
  }
  return parsed.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function getDomainShowcase(): DomainShowcasePayload {
  const overview = getDomainManageOverview();
  const primary =
    overview.owned.find((entry) => entry.status === "active")?.name ??
    overview.owned[0]?.name ??
    "demo.ion";

  const listings = overview.owned.map((entry) => ({
    name: entry.name,
    status: entry.status === "expiring" ? "Expiring soon" : "Active",
    floorIon: formatFloorIon(overview.feeIon.register),
    owner: shortenOwner(entry.ownerAddress),
  }));

  if (listings.length === 0) {
    listings.push({
      name: "demo.ion",
      status: "Available",
      floorIon: formatFloorIon(overview.feeIon.register),
      owner: "—",
    });
  }

  return {
    listings,
    identity: {
      primaryIonName: primary,
      kycPass: {
        level: "L1",
        expiresAt: "2027-12-31",
        badge: "KYC Pass",
      },
    },
    provenance: {
      source: overview.provenance.source,
      note: overview.provenance.note,
    },
  };
}

function shortenOwner(address: string): string {
  if (address.length <= 14) {
    return address;
  }
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}
