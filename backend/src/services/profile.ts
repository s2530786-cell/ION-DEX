export type DemoProfile = {
  walletAddress: string;
  displayName: string;
  ionIdStatus: "draft" | "unverified" | "verified";
  kycPass: {
    status: "not_connected" | "draft" | "verified";
    storesRawKyc: false;
  };
  linkedDomains: string[];
  badges: Array<{
    key: string;
    label: string;
    status: "draft" | "planned" | "active";
  }>;
  preferences: {
    language: "zh-CN" | "en-US";
    theme: "aurora-dark";
    riskWarnings: true;
  };
};

export function getDemoProfile(): DemoProfile {
  return {
    walletAddress: "ion1demo0000000000000000000000000000000000000000",
    displayName: "ION DEX Demo",
    ionIdStatus: "draft",
    kycPass: {
      status: "not_connected",
      storesRawKyc: false,
    },
    linkedDomains: ["demo.ion", "iondex.ion"],
    badges: [
      { key: "early-builder", label: "Early Builder", status: "draft" },
      { key: "liquidity-miner", label: "Liquidity Miner", status: "planned" },
      { key: "domain-holder", label: "ION DNS Holder", status: "draft" },
    ],
    preferences: {
      language: "zh-CN",
      theme: "aurora-dark",
      riskWarnings: true,
    },
  };
}
