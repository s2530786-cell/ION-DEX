import { resolveDomain, type DomainResolution } from "./domain.js";
import { validateIonDomainName } from "../lib/validation.js";

export type OwnedDomain = {
  name: string;
  ownerAddress: string;
  resolvedAddress: string | null;
  expiresAt: string;
  status: "active" | "expiring";
  bindTarget: string | null;
};

export type DomainManageOverview = {
  ownedCount: number;
  expiringSoon: number;
  lastLookup: DomainResolution | null;
  owned: OwnedDomain[];
  feeIon: {
    register: string;
    renew: string;
    transfer: string;
  };
  provenance: {
    source: "local-session";
    note: string;
  };
};

export type DomainManageActionResult = DomainManageOverview & {
  message: string;
};

export class DomainManageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainManageValidationError";
  }
}

const demoWallet = "ion1sessionwallet000000000000000000000000000000000000";
const feeRegisterIon = "2500.000";
const feeRenewIon = "420.000";
const feeTransferIon = "120.000";

const ownedDomains = new Map<string, OwnedDomain>();
let lastLookup: DomainResolution | null = null;

console.warn("[domain-manage] ION DNS contracts not wired; portfolio uses local session + mock resolver.");

function seedOwnedIfEmpty() {
  if (ownedDomains.size > 0) {
    return;
  }
  const demo = resolveDomain("demo.ion");
  ownedDomains.set("demo.ion", {
    name: "demo.ion",
    ownerAddress: demoWallet,
    resolvedAddress: demo.resolvedAddress,
    expiresAt: demo.expiresAt ?? "2027-05-18T00:00:00.000Z",
    status: "active",
    bindTarget: demo.resolvedAddress,
  });
}

function normalizeName(raw: string): string {
  const validation = validateIonDomainName(raw);
  if (!validation.ok) {
    throw new DomainManageValidationError(validation.message);
  }
  return validation.value;
}

function isExpiringSoon(expiresAt: string): boolean {
  const ms = Date.parse(expiresAt);
  if (!Number.isFinite(ms)) {
    return false;
  }
  const days = (ms - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 30;
}

function buildOverview(message?: string): DomainManageActionResult {
  seedOwnedIfEmpty();
  const owned = [...ownedDomains.values()].map((entry) => ({
    ...entry,
    status: isExpiringSoon(entry.expiresAt) ? ("expiring" as const) : entry.status,
  }));
  const expiringSoon = owned.filter((entry) => entry.status === "expiring").length;
  const base: DomainManageOverview = {
    ownedCount: owned.length,
    expiringSoon,
    lastLookup,
    owned,
    feeIon: {
      register: feeRegisterIon,
      renew: feeRenewIon,
      transfer: feeTransferIon,
    },
    provenance: {
      source: "local-session",
      note: "Domain portfolio is session-scoped until official ION DNS adapter ships.",
    },
  };
  return {
    ...base,
    message: message ?? "OK",
  };
}

export function getDomainManageOverview(): DomainManageOverview {
  const { message: _message, ...overview } = buildOverview();
  return overview;
}

export function lookupDomainManage(nameRaw: string): DomainManageActionResult {
  const name = normalizeName(nameRaw);
  lastLookup = resolveDomain(name);
  return buildOverview(`Lookup ready for ${name}.`);
}

export function registerDomainManage(nameRaw: string): DomainManageActionResult {
  const name = normalizeName(nameRaw);
  const resolution = resolveDomain(name);
  lastLookup = resolution;
  if (!resolution.available) {
    throw new DomainManageValidationError(`Domain ${name} is already registered.`);
  }
  if (ownedDomains.has(name)) {
    throw new DomainManageValidationError(`Domain ${name} is already in your portfolio.`);
  }
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  ownedDomains.set(name, {
    name,
    ownerAddress: demoWallet,
    resolvedAddress: null,
    expiresAt,
    status: "active",
    bindTarget: null,
  });
  return buildOverview(`Register intent recorded for ${name} (${feeRegisterIon} ION fee). No chain tx sent.`);
}

export function bindDomainManage(nameRaw: string, walletRaw: string): DomainManageActionResult {
  const name = normalizeName(nameRaw);
  const wallet = walletRaw.trim();
  if (wallet.length < 8) {
    throw new DomainManageValidationError("Bind target wallet must be at least 8 characters.");
  }
  const entry = ownedDomains.get(name);
  if (!entry) {
    throw new DomainManageValidationError(`Domain ${name} is not in your portfolio. Register first.`);
  }
  entry.bindTarget = wallet;
  entry.resolvedAddress = wallet;
  ownedDomains.set(name, entry);
  lastLookup = resolveDomain(name);
  return buildOverview(`Bind payload prepared for ${name} → ${wallet}.`);
}

export function transferDomainManage(nameRaw: string, toAddressRaw: string): DomainManageActionResult {
  const name = normalizeName(nameRaw);
  const toAddress = toAddressRaw.trim();
  if (toAddress.length < 8) {
    throw new DomainManageValidationError("Transfer recipient must be at least 8 characters.");
  }
  const entry = ownedDomains.get(name);
  if (!entry) {
    throw new DomainManageValidationError(`Domain ${name} is not in your portfolio.`);
  }
  entry.ownerAddress = toAddress;
  entry.bindTarget = null;
  ownedDomains.set(name, entry);
  lastLookup = resolveDomain(name);
  return buildOverview(`Transfer intent recorded for ${name} (${feeTransferIon} ION fee).`);
}

export function renewDomainManage(nameRaw: string): DomainManageActionResult {
  const name = normalizeName(nameRaw);
  const entry = ownedDomains.get(name);
  if (!entry) {
    throw new DomainManageValidationError(`Domain ${name} is not in your portfolio.`);
  }
  const renewed = new Date(Date.parse(entry.expiresAt) + 365 * 24 * 60 * 60 * 1000);
  entry.expiresAt = renewed.toISOString();
  entry.status = "active";
  ownedDomains.set(name, entry);
  lastLookup = resolveDomain(name);
  return buildOverview(`Renewal intent recorded for ${name} (${feeRenewIon} ION fee).`);
}

export function resetDomainManageSessionForTests(): void {
  ownedDomains.clear();
  lastLookup = null;
}
