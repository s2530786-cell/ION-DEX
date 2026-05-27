import type { IncomingMessage, ServerResponse } from "node:http";
import { ApiErrorCodes, apiError, apiResponse, writeJson, type ApiMeta } from "../gateway/response.js";

type Tier = "Basic" | "Premium" | "King" | "Institutional" | "Free";
type Period = "monthly" | "quarterly" | "yearly";

const USD_PRICE: Record<Exclude<Tier, "Free">, Record<Period, number>> = {
  Basic: { monthly: 99, quarterly: 247.5, yearly: 1089 },
  Premium: { monthly: 499, quarterly: 1247.5, yearly: 5489 },
  King: { monthly: 2999, quarterly: 7497.5, yearly: 32989 },
  Institutional: { monthly: 19999, quarterly: 49997.5, yearly: 219989 },
};

const rightsByTier: Record<Tier, string[]> = {
  Free: [],
  Basic: ["基础行情", "AI 基础问答", "每日情绪播报"],
  Premium: ["基础量化", "手动触发交易", "7 日预测"],
  King: ["全自动量化", "AI 自我进化", "滑点优化"],
  Institutional: ["机构 API", "私有集群", "专属 AI 节点"],
};

const userTier = new Map<string, Tier>();
const autoRenewByWallet = new Map<string, boolean>();

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? (JSON.parse(raw) as unknown) : {};
}

function parseTier(input: string | null): Exclude<Tier, "Free"> | null {
  if (!input) {
    return null;
  }
  if (input === "Basic" || input === "Premium" || input === "King" || input === "Institutional") {
    return input;
  }
  return null;
}

function parsePeriod(input: string | null): Period {
  if (input === "quarterly" || input === "yearly") {
    return input;
  }
  return "monthly";
}

export async function handleAiRoute(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  meta: ApiMeta,
): Promise<boolean> {
  if (pathname === "/api/ai/price" && request.method === "GET") {
    const url = new URL(request.url ?? "/", "http://localhost");
    const tier = parseTier(url.searchParams.get("tier"));
    if (!tier) {
      writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "tier is required.", meta));
      return true;
    }
    const period = parsePeriod(url.searchParams.get("period"));
    const usd = USD_PRICE[tier][period];
    writeJson(
      response,
      200,
      apiResponse(
        {
          tier,
          period,
          usd_price: usd,
          ion_estimate: Number((usd / 0.8).toFixed(2)),
          fx_rate: 0.8,
        },
        meta,
      ),
    );
    return true;
  }

  if (pathname === "/api/ai/rights" && request.method === "GET") {
    const url = new URL(request.url ?? "/", "http://localhost");
    const wallet = (url.searchParams.get("wallet_addr") ?? "").trim();
    if (!wallet) {
      writeJson(response, 400, apiError(ApiErrorCodes.invalidAddress, "wallet_addr is required.", meta));
      return true;
    }
    const tier = userTier.get(wallet) ?? "Free";
    writeJson(
      response,
      200,
      apiResponse(
        {
          wallet_addr: wallet,
          tier,
          expires_at: tier === "Free" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          rights: rightsByTier[tier],
          auto_renew: autoRenewByWallet.get(wallet) ?? true,
        },
        meta,
      ),
    );
    return true;
  }

  if (pathname === "/api/ai/subscribe" && request.method === "POST") {
    try {
      const body = (await readJsonBody(request)) as Record<string, unknown>;
      const wallet = String(body.wallet_addr ?? "").trim();
      const tier = parseTier(String(body.tier ?? ""));
      const period = parsePeriod(typeof body.period === "string" ? body.period : null);
      const txHash = String(body.tx_hash ?? "").trim();
      const autoRenew = body.auto_renew === undefined ? true : Boolean(body.auto_renew);
      if (!wallet || !tier || !txHash) {
        writeJson(
          response,
          400,
          apiError(ApiErrorCodes.invalidQuoteRequest, "wallet_addr, tier and tx_hash are required.", meta),
        );
        return true;
      }
      userTier.set(wallet, tier);
      autoRenewByWallet.set(wallet, autoRenew);
      writeJson(response, 200, apiResponse({ ok: true, wallet_addr: wallet, tier, period, tx_hash: txHash }, meta));
    } catch (error) {
      if (error instanceof SyntaxError) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Request body must be valid JSON.", meta));
        return true;
      }
      throw error;
    }
    return true;
  }

  if (pathname === "/api/ai/auto-renewal" && request.method === "POST") {
    try {
      const body = (await readJsonBody(request)) as Record<string, unknown>;
      const wallet = String(body.wallet_addr ?? "").trim();
      if (!wallet) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidAddress, "wallet_addr is required.", meta));
        return true;
      }
      const enabled = Boolean(body.auto_renew);
      autoRenewByWallet.set(wallet, enabled);
      writeJson(response, 200, apiResponse({ wallet_addr: wallet, auto_renew: enabled }, meta));
    } catch (error) {
      if (error instanceof SyntaxError) {
        writeJson(response, 400, apiError(ApiErrorCodes.invalidQuoteRequest, "Request body must be valid JSON.", meta));
        return true;
      }
      throw error;
    }
    return true;
  }

  return false;
}
