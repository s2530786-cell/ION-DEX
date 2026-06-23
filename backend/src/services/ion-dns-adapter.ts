import type { ServerConfig } from "../config/server-config.js";
import { fetchJson } from "../lib/http.js";
import { probeIonIndexer } from "../upstream/ion-indexer.js";
import type { DomainResolution } from "./domain.js";

const CATALOG_OWNED = new Set(["demo.ion", "iondex.ion"]);

function catalogResolution(name: string): DomainResolution {
  const owned = CATALOG_OWNED.has(name);
  return {
    name,
    available: !owned,
    ownerAddress: owned ? "ion1demoowner000000000000000000000000000000000000" : null,
    resolvedAddress: owned ? "ion1resolvedwallet000000000000000000000000000000" : null,
    expiresAt: owned ? "2027-05-18T00:00:00.000Z" : null,
    records: owned
      ? [
          { key: "wallet", value: "ion1resolvedwallet000000000000000000000000000000", status: "planned" },
          { key: "profile", value: "ION DEX demo profile", status: "planned" },
          { key: "avatar", value: "aurora-neon", status: "planned" },
        ]
      : [],
    marketplace: {
      listed: !owned,
      floorIon: owned ? "0.000" : "2500.000",
      lastSaleIon: owned ? "4200.000" : null,
    },
    provenance: {
      source: "session-catalog",
      note: "Demo catalog entry until official ION DNS read API is wired.",
    },
  };
}

function unavailableResolution(name: string, note: string): DomainResolution {
  return {
    name,
    available: !CATALOG_OWNED.has(name),
    ownerAddress: null,
    resolvedAddress: null,
    expiresAt: null,
    records: [],
    marketplace: {
      listed: false,
      floorIon: "0.000",
      lastSaleIon: null,
    },
    provenance: {
      source: "upstream-unavailable",
      note,
    },
  };
}

export async function resolveDomainWithAdapter(
  config: ServerConfig,
  name: string,
): Promise<DomainResolution> {
  if (config.dataMode === "test-mock") {
    return catalogResolution(name);
  }

  if (CATALOG_OWNED.has(name)) {
    return catalogResolution(name);
  }

  const probe = await probeIonIndexer(config);
  if (!probe.reachable) {
    return unavailableResolution(name, probe.note);
  }

  const base = probe.baseUrl.replace(/\/$/, "");
  try {
    const payload = await fetchJson<{ name?: string; owner?: string; resolved?: string }>(
      `${base}/dns/resolve?name=${encodeURIComponent(name)}`,
      { timeoutMs: config.httpTimeoutMs },
    );
    if (payload && typeof payload === "object" && payload.name) {
      return {
        name: payload.name,
        available: !payload.owner,
        ownerAddress: payload.owner ?? null,
        resolvedAddress: payload.resolved ?? null,
        expiresAt: null,
        records: payload.resolved
          ? [{ key: "wallet", value: payload.resolved, status: "planned" }]
          : [],
        marketplace: {
          listed: false,
          floorIon: "0.000",
          lastSaleIon: null,
        },
        provenance: {
          source: "ion-indexer",
          note: "Resolved via ION Indexer v3 DNS route.",
        },
      };
    }
  } catch {
    // fall through — indexer reachable but DNS route not published yet
  }

  return {
    name,
    available: true,
    ownerAddress: null,
    resolvedAddress: null,
    expiresAt: null,
    records: [],
    marketplace: {
      listed: true,
      floorIon: "2500.000",
      lastSaleIon: null,
    },
    provenance: {
      source: "ion-indexer",
      note: "Indexer reachable; per-name DNS resolve route pending — no mock wallet injected.",
    },
  };
}
