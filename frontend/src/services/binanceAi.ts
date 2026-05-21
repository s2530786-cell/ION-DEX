/**
 * Binance Web3 AI 公共服务 — 免 API Key
 * 数据来源: binance/binance-skills-hub (MIT)
 */

const BINANCE_WEB3 = "https://web3.binance.com/bapi/defi/v1/public";

// ===================== Smart Money Signals =====================

export interface SmartMoneySignal {
  symbol: string;
  signalType: "BUY" | "SELL";
  triggerPrice: number;
  currentPrice: number;
  maxGain: number;
  exitRate: number;
  address: string;
  chainId: string;
  tags: string[];
}

export interface SmartMoneyResponse {
  list: SmartMoneySignal[];
  total: number;
}

export async function fetchSmartMoneySignals(
  chainId: string = "56"
): Promise<SmartMoneySignal[]> {
  const res = await fetch(
    `${BINANCE_WEB3}/wallet-direct/buw/wallet/web/signal/smart-money/ai`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "identity",
        "User-Agent": "ion-dex/1.0 (Binance Web3 Skill)",
      },
      body: JSON.stringify({
        smartSignalType: "",
        page: 1,
        pageSize: 20,
        chainId,
      }),
    }
  );

  if (!res.ok) return [];
  const data: SmartMoneyResponse = await res.json();
  return (data.list ?? []).slice(0, 10);
}

// ===================== Token Security Audit =====================

export interface TokenAuditResult {
  isHoneypot: boolean;
  isRugPull: boolean;
  hasMintFunction: boolean;
  hasProxy: boolean;
  buyTax: number;
  sellTax: number;
  riskScore: number; // 0-100, higher = riskier
  contractAddress: string;
  chainId: string;
  details: string[];
}

interface BinanceTokenAuditRaw {
  data: {
    risk: {
      isHoneypot: boolean;
      honeypotRisk: "LOW" | "MEDIUM" | "HIGH";
      rugPullRisk: "LOW" | "MEDIUM" | "HIGH";
      tradingRisk: "LOW" | "MEDIUM" | "HIGH";
      scamRisk: "LOW" | "MEDIUM" | "HIGH";
    };
    contract: {
      hasMintFunction: boolean;
      isProxyContract: boolean;
      ownerAddress: string | null;
      buyTax: string;
      sellTax: string;
    };
    warnings: string[];
  };
}

function riskLevel(val: string): number {
  switch (val.toUpperCase()) {
    case "LOW":
      return 25;
    case "MEDIUM":
      return 55;
    case "HIGH":
      return 85;
    default:
      return 50;
  }
}

export async function fetchTokenAudit(
  contractAddress: string,
  chainId: string = "56"
): Promise<TokenAuditResult | null> {
  try {
    const res = await fetch(
      `${BINANCE_WEB3}/wallet-direct/security/token/audit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Encoding": "identity",
          "User-Agent": "ion-dex/1.0 (Binance Web3 Skill)",
        },
        body: JSON.stringify({
          binanceChainId: chainId,
          contractAddress,
          requestId: crypto.randomUUID(),
        }),
      }
    );

    if (!res.ok) return null;
    const raw: BinanceTokenAuditRaw = await res.json();

    const { risk, contract, warnings } = raw.data;
    const score = Math.round(
      (riskLevel(risk.honeypotRisk) +
        riskLevel(risk.rugPullRisk) +
        riskLevel(risk.tradingRisk) +
        riskLevel(risk.scamRisk)) /
        4
    );

    return {
      isHoneypot: risk.isHoneypot,
      isRugPull: risk.rugPullRisk === "HIGH",
      hasMintFunction: contract.hasMintFunction,
      hasProxy: contract.isProxyContract,
      buyTax: Number(contract.buyTax),
      sellTax: Number(contract.sellTax),
      riskScore: score,
      contractAddress,
      chainId,
      details: warnings ?? [],
    };
  } catch {
    return null;
  }
}
