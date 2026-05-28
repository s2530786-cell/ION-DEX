import { fetchPublicConfig } from "./config-gateway.js";

export type ProfileSession = {
  provenance: { source: string; description: string };
  identity: {
    displayName: string;
    primaryIonName: string;
    ionIdStatus: "verified" | "pending" | "unlinked";
    kycPass: { level: string; expiresAt: string; badge: string };
  };
  avatar: {
    selectedId: string;
    options: Array<{
      id: string;
      label: string;
      kind: "gradient" | "nft";
      preview: string;
      provenance: string;
    }>;
    nftSource: { label: string; status: string; mediaUrl: string | null };
  };
  wallets: {
    primaryKey: string | null;
    entries: Array<{
      key: string;
      name: string;
      category: "ion-native" | "evm";
      status: "ready" | "planned" | "enabled";
      detector: string;
      label: string;
    }>;
  };
  domains: {
    primaryName: string;
    records: Array<{ name: string; type: string; value: string }>;
  };
  preferences: {
    language: string;
    region: string;
    theme: "galaxy-neon" | "aurora-dark";
    animation: "full" | "reduced";
    privacyMode: boolean;
  };
  quickActions: Array<{
    key: string;
    label: string;
    description: string;
    routeHint: string;
    count: number | null;
  }>;
  sessionDetection: {
    network: string;
    walletProvider: string;
    addressFormat: string;
    language: string;
    ionName: string;
    identityStatus: string;
    addressPreview: string;
    detectionSource: "browser-injected" | "local-seed";
  } | null;
};

export type ProfileSessionQuery = {
  provider?: string | null;
  address?: string | null;
  chainId?: number | null;
};

const avatarOptions: ProfileSession["avatar"]["options"] = [
  {
    id: "aurora-cyan",
    label: "Aurora Cyan",
    kind: "gradient",
    preview: "linear-gradient(135deg, #24f7ff 0%, #7c3aed 55%, #030818 100%)",
    provenance: "local-gradient",
  },
  {
    id: "neon-magenta",
    label: "Neon Magenta",
    kind: "gradient",
    preview: "linear-gradient(135deg, #ff4fd8 0%, #24f7ff 45%, #030818 100%)",
    provenance: "local-gradient",
  },
  {
    id: "ion-vault",
    label: "ION Vault",
    kind: "gradient",
    preview: "linear-gradient(160deg, #fbbf24 0%, #7c3aed 40%, #030818 100%)",
    provenance: "local-gradient",
  },
];

function shortenAddress(address: string): string {
  if (address.length <= 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function resolveNetwork(chainId: number | null): string {
  if (chainId === 56) {
    return "BNB Smart Chain";
  }
  if (chainId === 1) {
    return "Ethereum";
  }
  if (chainId && Number.isFinite(chainId)) {
    return `EVM chain ${chainId}`;
  }
  return "ION / multi-chain";
}

export async function buildProfileSession(query: ProfileSessionQuery = {}): Promise<ProfileSession> {
  const config = await fetchPublicConfig();
  const provider = query.provider?.trim() || null;
  const address = query.address?.trim() || "";
  const chainId =
    typeof query.chainId === "number" && Number.isFinite(query.chainId) ? query.chainId : null;

  const walletEntry = provider
    ? config.supportedWallets.find((entry) => entry.key === provider) ?? null
    : null;

  const primaryIonName = address ? "trader.ion" : "guest.ion";
  const ionIdStatus: ProfileSession["identity"]["ionIdStatus"] = address ? "pending" : "unlinked";

  return {
    provenance: {
      source: config.provenance.source,
      description: "Gateway profile session seeded from public config and optional wallet query.",
    },
    identity: {
      displayName: address ? `ION Trader ${shortenAddress(address)}` : "ION DEX Guest",
      primaryIonName,
      ionIdStatus,
      kycPass: {
        level: address ? "L1" : "—",
        expiresAt: address ? "2027-12-31" : "",
        badge: address ? "KYC Pass" : "Not linked",
      },
    },
    avatar: {
      selectedId: avatarOptions[0].id,
      options: avatarOptions,
      nftSource: {
        label: "ION NFT Gallery",
        status: "planned",
        mediaUrl: null,
      },
    },
    wallets: {
      primaryKey: provider,
      entries: config.supportedWallets,
    },
    domains: {
      primaryName: primaryIonName,
      records: [
        { name: primaryIonName, type: "A", value: address || "unbound" },
        { name: "_ion.wallet", type: "TXT", value: address || "pending-bind" },
      ],
    },
    preferences: {
      language: "zh-CN",
      region: "APAC",
      theme: "aurora-dark",
      animation: "full",
      privacyMode: false,
    },
    quickActions: [
      {
        key: "swap",
        label: "Swap",
        description: "Open instant swap desk",
        routeHint: "/#/swap",
        count: null,
      },
      {
        key: "domain",
        label: "ION DNS",
        description: "Manage .ion domains",
        routeHint: "/#/domain",
        count: 2,
      },
      {
        key: "ai",
        label: "AI Sentinel",
        description: "Subscription and rights",
        routeHint: "/#/ai",
        count: null,
      },
    ],
    sessionDetection: provider
      ? {
          network: resolveNetwork(chainId),
          walletProvider: walletEntry?.name ?? provider,
          addressFormat: address.startsWith("0x") ? "EVM" : "ION/TVM",
          language: "zh-CN",
          ionName: primaryIonName,
          identityStatus: ionIdStatus,
          addressPreview: address ? shortenAddress(address) : "—",
          detectionSource: "browser-injected",
        }
      : {
          network: "ION DEX",
          walletProvider: "Not connected",
          addressFormat: "—",
          language: "zh-CN",
          ionName: primaryIonName,
          identityStatus: ionIdStatus,
          addressPreview: "—",
          detectionSource: "local-seed",
        },
  };
}
