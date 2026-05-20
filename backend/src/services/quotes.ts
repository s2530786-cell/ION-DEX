import { formatDecimalUnits, parseDecimalUnits, pow10 } from "../lib/decimal.js";
import { computeMinimumOutputUnits, PROTOCOL_FEE_BPS } from "../lib/minimum-output.js";
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
    source: "local-seed";
    priceModel: string;
  };
};

export type QuoteInput = {
  inputToken: string;
  outputToken: string;
  amountIn: string;
  slippageBps: number;
};

const MICRO_USD = 1_000_000n;
const priceUsdMicro: Record<string, bigint> = {
  BNB: 642_200_000n,
  ION: 6_020_000n,
  USDT: MICRO_USD,
};

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
  if (!(normalized in priceUsdMicro)) {
    throw new QuoteInputError(`No price source configured for token: ${symbol}`);
  }
  return token;
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

export function createQuote(input: QuoteInput): QuotePayload {
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

  const inputPrice = priceUsdMicro[inputToken.symbol];
  const outputPrice = priceUsdMicro[outputToken.symbol];
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
      priceModel: "reviewed local seed prices from live-data-reference, replaceable by market-service adapter",
      source: "local-seed",
    },
    route: [`${inputToken.symbol}/USD`, `${outputToken.symbol}/USD`],
    slippageBps: input.slippageBps,
  };
}
