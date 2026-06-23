/**
 * ION Domain Resolver — ION Indexer v3 DNS Records
 * 
 * Forward: .ion name → wallet address
 * Reverse: wallet address → .ion name(s)
 * 
 * Endpoint: GET /indexer/v3/dns/records?domain={domain}&wallet={address}
 * Cache: 5 minutes local
 */

const INDEXER_BASE = 'https://api.mainnet.ice.io/indexer/v3';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

interface DnsRecord {
  domain: string;
  wallet: string;
  category?: string;
  expires_at?: number;
}

interface CacheEntry {
  data: string | null;
  ts: number;
}

const domainCache = new Map<string, CacheEntry>();
const reverseCache = new Map<string, CacheEntry>();

async function fetchDns(params: Record<string, string>): Promise<DnsRecord | null> {
  const url = new URL(`${INDEXER_BASE}/dns/records`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();
    const records = json.records || json.data || [];
    return records[0] || null;
  } catch {
    return null;
  }
}

/** Forward resolve: swap.ion → UQCMEAB... */
export async function resolveDomain(domain: string): Promise<string | null> {
  const cached = domainCache.get(domain);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const record = await fetchDns({ domain });
  const wallet = record?.wallet || null;

  domainCache.set(domain, { data: wallet, ts: Date.now() });
  return wallet;
}

/** Reverse resolve: UQCMEAB... → swap.ion */
export async function reverseResolve(address: string): Promise<string | null> {
  const cached = reverseCache.get(address);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const record = await fetchDns({ wallet: address });
  const domain = record?.domain || null;

  reverseCache.set(address, { data: domain, ts: Date.now() });
  return domain;
}

/** Format address for display: show .ion if available, fallback to truncated hex */
export function formatAddress(address: string, domain?: string | null): string {
  if (domain) return domain;
  if (address.length <= 20) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Check if string looks like a .ion domain */
export function isIonDomain(input: string): boolean {
  return /\.ion$/i.test(input);
}

/** Check if string looks like an ION address (UQ... 48-char hex) */
export function isIonAddress(input: string): boolean {
  return /^[UE][Qk][A-Za-z0-9_-]{46}$/.test(input);
}
