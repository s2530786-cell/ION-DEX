export type WalletCategory = "ion-native" | "evm";

export type WalletEntry = {
  key: string;
  name: string;
  category: WalletCategory;
  status: "ready" | "planned" | "enabled";
  detector: string;
  label: string;
};

export type ProfileAvatarOption = {
  id: string;
  label: string;
  kind: "gradient" | "nft";
  preview: string;
  provenance: string;
};

export type ProfileSession = {
  provenance: {
    source: "local-seed";
    description: string;
  };
  identity: {
    displayName: string;
    primaryIonName: string;
    ionIdStatus: "verified" | "pending" | "unlinked";
    kycPass: {
      level: string;
      expiresAt: string;
      badge: string;
    };
  };
  avatar: {
    selectedId: string;
    options: ProfileAvatarOption[];
    nftSource: {
      label: string;
      status: string;
      mediaUrl: string | null;
    };
  };
  wallets: {
    primaryKey: string | null;
    entries: WalletEntry[];
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
  } | null;
};

const walletEntries: WalletEntry[] = [
  {
    key: "online",
    name: "Online+ Wallet",
    category: "ion-native",
    status: "ready",
    detector: "ion.onlinePlus",
    label: "ION native social wallet",
  },
  {
    key: "ion-browser",
    name: "ION Browser Wallet",
    category: "ion-native",
    status: "planned",
    detector: "ion.browserWallet",
    label: "Native chain signing",
  },
  {
    key: "walletconnect",
    name: "WalletConnect / OKX",
    category: "ion-native",
    status: "ready",
    detector: "walletconnect.v2",
    label: "Mainstream Web3 bridge",
  },
  {
    key: "metamask",
    name: "MetaMask",
    category: "evm",
    status: "enabled",
    detector: "window.ethereum.isMetaMask",
    label: "EVM extension wallet",
  },
  {
    key: "binance-web3",
    name: "Binance Web3",
    category: "evm",
    status: "enabled",
    detector: "window.BinanceChain",
    label: "BNB Chain wallet",
  },
  {
    key: "okx-web3",
    name: "OKX Web3",
    category: "evm",
    status: "enabled",
    detector: "window.okxwallet",
    label: "Multi-chain OKX wallet",
  },
  {
    key: "bitget-web3",
    name: "Bitget Web3",
    category: "evm",
    status: "enabled",
    detector: "window.bitkeep.ethereum",
    label: "Bitget extension wallet",
  },
  {
    key: "trust-wallet",
    name: "Trust Wallet",
    category: "evm",
    status: "enabled",
    detector: "window.trustwallet",
    label: "Mobile and extension wallet",
  },
  {
    key: "coinbase-wallet",
    name: "Coinbase Wallet",
    category: "evm",
    status: "enabled",
    detector: "window.coinbaseWalletExtension",
    label: "Coinbase self-custody wallet",
  },
  {
    key: "rabby",
    name: "Rabby",
    category: "evm",
    status: "enabled",
    detector: "window.rabby",
    label: "Multi-chain DeFi wallet",
  },
];

const avatarOptions: ProfileAvatarOption[] = [
  {
    id: "aurora-cyan",
    label: "Aurora Cyan",
    kind: "gradient",
    preview: "linear-gradient(135deg,#24f7ff,#8d4dff)",
    provenance: "local-seed",
  },
  {
    id: "magenta-orbit",
    label: "Magenta Orbit",
    kind: "gradient",
    preview: "linear-gradient(135deg,#ff3bd4,#8d4dff,#24f7ff)",
    provenance: "local-seed",
  },
  {
    id: "ion-nft-42",
    label: "ION Genesis #42",
    kind: "nft",
    preview: "linear-gradient(135deg,#0ea5e9,#6366f1,#d946ef)",
    provenance: "wallet-media-verified-seed",
  },
];

const providerSessionSeeds: Record<
  string,
  {
    network: string;
    addressFormat: string;
    addressPreview: string;
    ionName: string;
    identityStatus: string;
  }
> = {
  online: {
    network: "ION Mainnet",
    addressFormat: "ION user-friendly",
    addressPreview: "UQC…8LiA",
    ionName: "trader.ion",
    identityStatus: "ION ID verified · KYC Pass L2",
  },
  "ion-browser": {
    network: "ION Mainnet",
    addressFormat: "ION raw",
    addressPreview: "0:91c…f2a1",
    ionName: "trader.ion",
    identityStatus: "ION ID pending review",
  },
  walletconnect: {
    network: "BNB Smart Chain",
    addressFormat: "EVM checksummed",
    addressPreview: "0x71C…9f3E",
    ionName: "trader.ion",
    identityStatus: "ION ID verified · KYC Pass L2",
  },
  metamask: {
    network: "BNB Smart Chain",
    addressFormat: "EVM checksummed",
    addressPreview: "0x71C…9f3E",
    ionName: "trader.ion",
    identityStatus: "ION ID verified · KYC Pass L2",
  },
  "binance-web3": {
    network: "BNB Smart Chain",
    addressFormat: "EVM checksummed",
    addressPreview: "0x9A2…4B11",
    ionName: "trader.ion",
    identityStatus: "ION ID verified · KYC Pass L2",
  },
  "okx-web3": {
    network: "BNB Smart Chain",
    addressFormat: "EVM checksummed",
    addressPreview: "0x4E8…C902",
    ionName: "trader.ion",
    identityStatus: "ION ID verified · KYC Pass L2",
  },
  "bitget-web3": {
    network: "BNB Smart Chain",
    addressFormat: "EVM checksummed",
    addressPreview: "0x2F1…88AA",
    ionName: "trader.ion",
    identityStatus: "ION ID verified · KYC Pass L2",
  },
  "trust-wallet": {
    network: "BNB Smart Chain",
    addressFormat: "EVM checksummed",
    addressPreview: "0xB03…7710",
    ionName: "trader.ion",
    identityStatus: "ION ID verified · KYC Pass L2",
  },
  "coinbase-wallet": {
    network: "BNB Smart Chain",
    addressFormat: "EVM checksummed",
    addressPreview: "0x6D4…21C0",
    ionName: "trader.ion",
    identityStatus: "ION ID verified · KYC Pass L2",
  },
  rabby: {
    network: "BNB Smart Chain",
    addressFormat: "EVM checksummed",
    addressPreview: "0x1AC…55DE",
    ionName: "trader.ion",
    identityStatus: "ION ID verified · KYC Pass L2",
  },
};

export function getProfileSession(providerKey?: string | null): ProfileSession {
  const wallet = walletEntries.find((entry) => entry.key === providerKey) ?? null;
  const sessionSeed = providerKey ? providerSessionSeeds[providerKey] : null;

  return {
    provenance: {
      source: "local-seed",
      description:
        "Reviewed local profile session for UI wiring. Replace with wallet/session service once adapters are enabled.",
    },
    identity: {
      displayName: "ION Trader",
      primaryIonName: "trader.ion",
      ionIdStatus: wallet ? "verified" : "unlinked",
      kycPass: {
        level: "L2",
        expiresAt: "2026-11-30T00:00:00.000Z",
        badge: "KYC Pass",
      },
    },
    avatar: {
      selectedId: "aurora-cyan",
      options: avatarOptions,
      nftSource: {
        label: "Verified wallet media",
        status: "Indexed from Online+ profile media seed",
        mediaUrl: null,
      },
    },
    wallets: {
      primaryKey: wallet?.key ?? null,
      entries: walletEntries,
    },
    domains: {
      primaryName: "trader.ion",
      records: [
        { name: "trader.ion", type: "wallet", value: "UQC…8LiA" },
        { name: "trader.ion", type: "dns", value: "swap.ion" },
      ],
    },
    preferences: {
      language: "zh-CN",
      region: "Asia/Shanghai",
      theme: "galaxy-neon",
      animation: "full",
      privacyMode: false,
    },
    quickActions: [
      { key: "security-logs", label: "Security logs", description: "Recent sign-in and device events", routeHint: "profile/security", count: 3 },
      { key: "approvals", label: "Approvals", description: "Token and contract allowances", routeHint: "profile/approvals", count: 2 },
      { key: "orders", label: "Orders", description: "Spot and limit order history", routeHint: "trade/orders", count: 12 },
      { key: "grid", label: "Grid strategies", description: "Active and paused grid bots", routeHint: "grid/strategies", count: 1 },
      { key: "staking", label: "Staking", description: "DEX and official staking positions", routeHint: "stake/positions", count: 4 },
      { key: "bridge", label: "Bridge history", description: "Cross-chain transfer timeline", routeHint: "bridge/history", count: 6 },
      { key: "notifications", label: "Notifications", description: "Price, risk, and identity alerts", routeHint: "profile/notifications", count: 5 },
      { key: "referral", label: "Referral & badges", description: "Invite rewards and achievement badges", routeHint: "profile/referral", count: 7 },
    ],
    sessionDetection: wallet && sessionSeed
      ? {
          network: sessionSeed.network,
          walletProvider: wallet.name,
          addressFormat: sessionSeed.addressFormat,
          language: "zh-CN",
          ionName: sessionSeed.ionName,
          identityStatus: sessionSeed.identityStatus,
          addressPreview: sessionSeed.addressPreview,
        }
      : null,
  };
}

export function listWalletEntries(): WalletEntry[] {
  return walletEntries;
}
