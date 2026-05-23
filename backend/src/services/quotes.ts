import { formatDecimalUnits, parseDecimalUnits, pow10 } from "../lib/decimal.js";
import { computeMinimumOutputUnits, PROTOCOL_FEE_BPS } from "../lib/minimum-output.js";
import { getTokens, type TokenMetadata } from "./tokens.js";
import { getIonPriceUsd, getBnbPriceUsd } from "../upstream/geckoterminal.js";
import { loadServerConfig } from "../config/server-config.js";

export type QuotePayload = {
  inputToken: string;
  outputToken: string;
  amountIn: string;
  amountInUnits: string;
  estimatedOutput: string;
  estimatedOutputUnits: string;
  minimumReceived: string;
  minimumReceivedUnits: string;
  protocolFee: string;
  protocolFeeUnits: string;
  protocolFeeBps: number;
  slippageBps: number;
  priceImpactBps: number;
  route: string[];
  precision: {
    inputDecimals: number;
    outputDecimals: number;
    math: "bigint-floor";
  };
  provenance: {
    source: "geckoterminal" | "local-seed";
    priceModel: string;
  };
};

export type QuoteInput = {
  inputToken: string;
  outputToken: string;
  amountIn: string;
  slippageBps: number;
};

const MICRO_USD = BigInt(1_000_000);

/** Test-only seed prices (micro-USD) when ION_DATA_MODE=test-mock */
const TEST_SEED_PRICES: Record<string, bigint> = {
  BNB: 642_200_000n,
  ION: 6_020_000n,
  USDT: MICRO_USD,
};

/** GeckoTerminal cached prices, auto-refreshed every 60s */
let cachedPrices: Record<string, bigint> | null = null;
let cachedAt = 0;
const PRICE_CACHE_TTL_MS = 60_000;

async function refreshPrices(): Promise<void> {
  const now = Date.now();
  if (cachedPrices && now - cachedAt < PRICE_CACHE_TTL_MS) return;
  const config = loadServerConfig();
  const [ionUsd, bnbUsd] = await Promise.all([
    getIonPriceUsd(config.httpTimeoutMs),
    getBnbPriceUsd(config.httpTimeoutMs),
  ]);
  cachedPrices = {
    BNB: BigInt(Math.round(bnbUsd * 1_000_000)),
    ION: BigInt(Math.round(ionUsd * 1_000_000)),
    USDT: MICRO_USD,
  };
  cachedAt = now;
}

export class QuoteInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuoteInputError";
  }
}

function getToken(symbol: string): TokenMetadata {
  const normalized = symbol.trim().toUpperCase();
  const token = getTokens().find((candidate) => candidate.symbol === normalized);
  if (!token) {
    throw new QuoteInputError(`Unsupported token: ${symbol}`);
  }
  return token;
}

async function getLivePrice(symbol: string): Promise<bigint> {
  if (symbol === "USDT") return MICRO_USD;
  const config = loadServerConfig();
  if (config.dataMode === "test-mock") {
    const seed = TEST_SEED_PRICES[symbol];
    if (!seed) throw new QuoteInputError(`No price source configured for token: ${symbol}`);
    return seed;
  }
  await refreshPrices();
  const price = cachedPrices?.[symbol];
  if (!price) throw new QuoteInputError(`No price source configured for token: ${symbol}`);
  return price;
}

function validateSlippageBps(slippageBps: number): void {
  if (!Number.isInteger(slippageBps) || slippageBps < 10 || slippageBps > 500) {
    throw new QuoteInputError("slippageBps must be an integer between 10 and 500.");
  }
}

function priceImpactBps(amountUsdMicro: bigint): number {
  if (amountUsdMicro < 5_000n * MICRO_USD) {
    return 24;
  }
  if (amountUsdMicro < 25_000n * MICRO_USD) {
    return 78;
  }
  return 118;
}

export async function createQuote(input: QuoteInput): Promise<QuotePayload> {
  const inputToken = getToken(input.inputToken);
  const outputToken = getToken(input.outputToken);
  if (inputToken.symbol === outputToken.symbol) {
    throw new QuoteInputError("inputToken and outputToken must differ.");
  }
  validateSlippageBps(input.slippageBps);

  let amountInUnits: bigint;
  try {
    amountInUnits = parseDecimalUnits(input.amountIn, inputToken.decimals);
  } catch (error) {
    throw new QuoteInputError(error instanceof Error ? error.message : "Invalid amountIn.");
  }
  if (amountInUnits <= 0n) {
    throw new QuoteInputError("amountIn must be greater than zero.");
  }

  const inputPrice = await getLivePrice(inputToken.symbol);
  const outputPrice = await getLivePrice(outputToken.symbol);
  const grossOutputUnits =
    (amountInUnits * inputPrice * pow10(outputToken.decimals)) /
    (pow10(inputToken.decimals) * outputPrice);
  const { estimatedOutputUnits, minimumOutputUnits: minimumReceivedUnits, protocolFeeUnits } =
    computeMinimumOutputUnits(grossOutputUnits, input.slippageBps, PROTOCOL_FEE_BPS);
  const amountUsdMicro = (amountInUnits * inputPrice) / pow10(inputToken.decimals);

  return {
    amountIn: formatDecimalUnits(amountInUnits, inputToken.decimals, 8),
    amountInUnits: amountInUnits.toString(),
    estimatedOutput: formatDecimalUnits(estimatedOutputUnits, outputToken.decimals, 6),
    estimatedOutputUnits: estimatedOutputUnits.toString(),
    inputToken: inputToken.symbol,
    minimumReceived: formatDecimalUnits(minimumReceivedUnits, outputToken.decimals, 6),
    minimumReceivedUnits: minimumReceivedUnits.toString(),
    outputToken: outputToken.symbol,
    precision: {
      inputDecimals: inputToken.decimals,
      math: "bigint-floor",
      outputDecimals: outputToken.decimals,
    },
    priceImpactBps: priceImpactBps(amountUsdMicro),
    protocolFee: formatDecimalUnits(protocolFeeUnits, outputToken.decimals, 6),
    protocolFeeBps: PROTOCOL_FEE_BPS,
    protocolFeeUnits: protocolFeeUnits.toString(),
    provenance: {
      priceModel: "geckoterminal ION/BNB pool live price",
      source: "geckoterminal",
    },
    route: [`${inputToken.symbol}/USD`, `${outputToken.symbol}/USD`],
    slippageBps: input.slippageBps,
  };
}
