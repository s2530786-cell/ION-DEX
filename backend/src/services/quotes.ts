import { formatDecimalUnits, parseDecimalUnits, pow10 } from "../lib/decimal.js";
import { computeMinimumOutputUnits, PROTOCOL_FEE_BPS } from "../lib/minimum-output.js";
import { loadServerConfig } from "../config/server-config.js";
import { loadLiveQuotePrices } from "./live/quotes-live.js";
import { getTokens, type TokenMetadata } from "./tokens.js";

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
    source: "geckoterminal" | "test-mock";
    priceModel: string;
    priceImpactModel?: string;
    poolId?: string;
    ionPriceUsd?: string;
    bnbPriceUsd?: string;
    reserveInUsd?: string;
  };
};

export type QuoteInput = {
  inputToken: string;
  outputToken: string;
  amountIn: string;
  slippageBps: number;
};

const MICRO_USD = BigInt(1_000_000);

/** Deterministic prices for NODE_ENV=test / ION_DATA_MODE=test-mock only. */
const TEST_MOCK_PRICES_MICRO_USD: Record<string, bigint> = {
  BNB: 642_200_000n,
  ION: 6_020_000n,
  USDT: MICRO_USD,
};

const PRICE_IMPACT_MODEL =
  "size-tier estimate (not on-chain AMM reserve math; pending pool reserve integration)";

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

async function resolveQuotePricing(): Promise<{
  pricesMicroUsd: Record<string, bigint>;
  provenance: QuotePayload["provenance"];
}> {
  const config = loadServerConfig();
  if (config.dataMode === "test-mock") {
    return {
      pricesMicroUsd: TEST_MOCK_PRICES_MICRO_USD,
      provenance: {
        source: "test-mock",
        priceModel: "Deterministic test-mock USD prices for gateway unit tests",
        priceImpactModel: PRICE_IMPACT_MODEL,
      },
    };
  }

  const live = await loadLiveQuotePrices(config.httpTimeoutMs);
  return {
    pricesMicroUsd: live.pricesMicroUsd,
    provenance: {
      ...live.provenance,
      priceImpactModel: PRICE_IMPACT_MODEL,
    },
  };
}

function getPriceForSymbol(pricesMicroUsd: Record<string, bigint>, symbol: string): bigint {
  const price = pricesMicroUsd[symbol];
  if (!price) {
    throw new QuoteInputError(`No price source configured for token: ${symbol}`);
  }
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

  const { pricesMicroUsd, provenance } = await resolveQuotePricing();
  const inputPrice = getPriceForSymbol(pricesMicroUsd, inputToken.symbol);
  const outputPrice = getPriceForSymbol(pricesMicroUsd, outputToken.symbol);
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
    provenance,
    route: [`${inputToken.symbol}/USD`, `${outputToken.symbol}/USD`],
    slippageBps: input.slippageBps,
  };
}
