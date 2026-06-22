import { randomUUID } from "node:crypto";
import { CONTRACTS, isDeployed } from "../config/contracts.js";

const evmAddressPattern = /^0x[a-fA-F0-9]{40}$/;
const MAX_BATCH_SIZE = 100;

export type BatchTransferConfig = {
  contractAddress: string;
  ionTokenAddress: string;
  maxRecipients: number;
  feeCurrency: "ION";
  contractDeployed: boolean;
  provenance: {
    source: "batch-transfer-contract" | "local-session";
    note: string;
  };
};

export type BatchTransferRecipient = {
  address: string;
  amount: string;
  amountWei: string;
};

export type BatchTransferValidation = {
  recipients: BatchTransferRecipient[];
  recipientCount: number;
  totalAmount: string;
  totalAmountWei: string;
  lineErrors: string[];
  provenance: BatchTransferConfig["provenance"];
};

export type BatchCollectValidation = {
  mainAddress: string;
  fromAddresses: string[];
  fromCount: number;
  lineErrors: string[];
  provenance: BatchTransferConfig["provenance"];
};

export type BatchTransferResult = {
  batchId: string;
  txHash: string | null;
  totalRecipients: number;
  totalAmount: string;
  tokenSymbol: string;
  status: "pending_signature";
  failedIndices?: number[];
  message: string;
};

export type BatchHistoryItem = {
  id: string;
  timestamp: string;
  mode: "transfer" | "collect";
  recipients: number;
  totalAmount: string;
  tokenSymbol: string;
  txHash: string | null;
  status: "pending_signature" | "submitted";
};

export type BatchHistoryPage = {
  items: BatchHistoryItem[];
  total: number;
  page: number;
  limit: number;
};

export type BatchStats = {
  totalSent: string;
  totalTransactions: number;
  totalRecipients: number;
  avgAmount: string;
  provenance: BatchTransferConfig["provenance"];
};

export class BatchTransferValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BatchTransferValidationError";
  }
}

type RecipientInput = { address: string; amount: string };

const history: BatchHistoryItem[] = [];
let totalSentWei = 0n;
let totalRecipientCount = 0;

function configProvenance(): BatchTransferConfig["provenance"] {
  const deployed = isDeployed(CONTRACTS.batchTransfer.contractAddress);
  return {
    source: deployed ? "batch-transfer-contract" : "local-session",
    note: deployed
      ? "BatchTransfer.sol address configured; wallet must sign calldata — no server-side txHash."
      : "Set BATCH_TRANSFER_CONTRACT_ADDRESS after deploy; payloads queue as pending_signature only.",
  };
}

export function getBatchTransferConfig(): BatchTransferConfig {
  const contractAddress = CONTRACTS.batchTransfer.contractAddress;
  const deployed = isDeployed(contractAddress);
  return {
    contractAddress,
    ionTokenAddress: CONTRACTS.ion.tokenAddress,
    maxRecipients: MAX_BATCH_SIZE,
    feeCurrency: "ION",
    contractDeployed: deployed,
    provenance: configProvenance(),
  };
}

function parseAmountIon(amountRaw: string): { amount: string; amountWei: bigint } | null {
  const trimmed = amountRaw.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = `${frac}000000000000000000`.slice(0, 18);
  const wei = BigInt(whole) * 10n ** 18n + BigInt(fracPadded || "0");
  if (wei <= 0n) {
    return null;
  }
  const amount = frac.length > 0 ? `${whole}.${frac.replace(/0+$/, "") || "0"}` : whole;
  return { amount, amountWei: wei };
}

function weiToDecimal(wei: bigint): string {
  if (wei === 0n) {
    return "0";
  }
  const whole = wei / 10n ** 18n;
  const frac = wei % 10n ** 18n;
  if (frac === 0n) {
    return whole.toString();
  }
  const fracStr = frac.toString().padStart(18, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

function validateRecipientInputs(recipients: RecipientInput[]): BatchTransferValidation {
  const lineErrors: string[] = [];
  const parsed: BatchTransferRecipient[] = [];
  if (recipients.length === 0) {
    lineErrors.push("Add at least one recipient.");
  }
  if (recipients.length > MAX_BATCH_SIZE) {
    lineErrors.push(`Batch size exceeds maximum of ${MAX_BATCH_SIZE} recipients.`);
  }
  let totalWei = 0n;
  for (let index = 0; index < recipients.length; index += 1) {
    const row = recipients[index]!;
    const address = row.address.trim();
    if (!evmAddressPattern.test(address)) {
      lineErrors.push(`Recipient ${index + 1}: invalid address.`);
      continue;
    }
    const amountParsed = parseAmountIon(row.amount);
    if (!amountParsed) {
      lineErrors.push(`Recipient ${index + 1}: amount must be a positive decimal.`);
      continue;
    }
    parsed.push({
      address: address.toLowerCase(),
      amount: amountParsed.amount,
      amountWei: amountParsed.amountWei.toString(),
    });
    totalWei += amountParsed.amountWei;
  }
  return {
    recipients: parsed,
    recipientCount: parsed.length,
    totalAmount: weiToDecimal(totalWei),
    totalAmountWei: totalWei.toString(),
    lineErrors,
    provenance: configProvenance(),
  };
}

function parseTransferLines(text: string): BatchTransferValidation {
  const lineErrors: string[] = [];
  const recipients: RecipientInput[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    lineErrors.push("Add at least one address,amount line.");
  }
  if (lines.length > MAX_BATCH_SIZE) {
    lineErrors.push(`Batch size exceeds maximum of ${MAX_BATCH_SIZE} recipients.`);
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    const parts = line.split(",").map((part) => part.trim());
    if (parts.length < 2) {
      lineErrors.push(`Line ${index + 1}: expected address,amount format.`);
      continue;
    }
    recipients.push({ address: parts[0]!, amount: parts.slice(1).join(",").trim() });
  }

  const result = validateRecipientInputs(recipients);
  return {
    ...result,
    lineErrors: [...lineErrors, ...result.lineErrors],
  };
}

export function validateBatchTransfer(text: string): BatchTransferValidation {
  return parseTransferLines(text);
}

export function validateBatchCollect(mainAddress: string, text: string): BatchCollectValidation {
  const lineErrors: string[] = [];
  const main = mainAddress.trim();
  if (!evmAddressPattern.test(main)) {
    lineErrors.push("mainAddress must be a valid EVM address.");
  }

  const fromAddresses: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    lineErrors.push("Add at least one source address.");
  }
  if (lines.length > MAX_BATCH_SIZE) {
    lineErrors.push(`Collect batch exceeds maximum of ${MAX_BATCH_SIZE} addresses.`);
  }

  for (let index = 0; index < lines.length; index += 1) {
    const address = lines[index]!;
    if (!evmAddressPattern.test(address)) {
      lineErrors.push(`Line ${index + 1}: invalid address.`);
      continue;
    }
    fromAddresses.push(address.toLowerCase());
  }

  return {
    mainAddress: main.toLowerCase(),
    fromAddresses,
    fromCount: fromAddresses.length,
    lineErrors,
    provenance: configProvenance(),
  };
}

export function getBatchTransferStats(): BatchStats {
  const avg =
    totalRecipientCount === 0
      ? "0"
      : weiToDecimal(totalSentWei / BigInt(totalRecipientCount));
  return {
    totalSent: weiToDecimal(totalSentWei),
    totalTransactions: history.length,
    totalRecipients: totalRecipientCount,
    avgAmount: avg,
    provenance: configProvenance(),
  };
}

export function getBatchTransferHistory(page: number, limit: number): BatchHistoryPage {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;
  const start = (safePage - 1) * safeLimit;
  const items = [...history].reverse().slice(start, start + safeLimit);
  return {
    items,
    total: history.length,
    page: safePage,
    limit: safeLimit,
  };
}

function recordBatch(
  mode: "transfer" | "collect",
  recipientCount: number,
  totalAmount: string,
  totalAmountWei: bigint,
  message: string,
): BatchTransferResult {
  const batchId = randomUUID();
  const item: BatchHistoryItem = {
    id: batchId,
    timestamp: new Date().toISOString(),
    mode,
    recipients: recipientCount,
    totalAmount,
    tokenSymbol: "ION",
    txHash: null,
    status: "pending_signature",
  };
  history.push(item);
  totalRecipientCount += recipientCount;
  totalSentWei += totalAmountWei;
  return {
    batchId,
    txHash: null,
    totalRecipients: recipientCount,
    totalAmount,
    tokenSymbol: "ION",
    status: "pending_signature",
    message,
  };
}

export function submitBatchTransferSend(
  recipients: RecipientInput[],
  _tokenAddress?: string,
): BatchTransferResult {
  const validation = validateRecipientInputs(recipients);
  if (validation.lineErrors.length > 0) {
    throw new BatchTransferValidationError(validation.lineErrors.join(" "));
  }
  if (validation.recipientCount === 0) {
    throw new BatchTransferValidationError("No valid recipients.");
  }
  const cfg = getBatchTransferConfig();
  const contractNote = cfg.contractDeployed
    ? `Sign batch on ${cfg.contractAddress}.`
    : "Contract address not deployed — configure BATCH_TRANSFER_CONTRACT_ADDRESS before mainnet.";
  return recordBatch(
    "transfer",
    validation.recipientCount,
    validation.totalAmount,
    BigInt(validation.totalAmountWei),
    `${contractNote} Server never fabricates txHash.`,
  );
}

export function submitBatchCollect(
  mainAddress: string,
  fromAddresses: string[],
  _tokenAddress?: string,
): BatchTransferResult {
  const text = fromAddresses.join("\n");
  const validation = validateBatchCollect(mainAddress, text);
  if (validation.lineErrors.length > 0) {
    throw new BatchTransferValidationError(validation.lineErrors.join(" "));
  }
  if (validation.fromCount === 0) {
    throw new BatchTransferValidationError("No valid source addresses.");
  }
  const cfg = getBatchTransferConfig();
  return recordBatch(
    "collect",
    validation.fromCount,
    "0",
    0n,
    `Collect to ${validation.mainAddress} via ${cfg.contractAddress}. Await wallet signature.`,
  );
}

export function resetBatchTransferForTests(): void {
  history.length = 0;
  totalSentWei = 0n;
  totalRecipientCount = 0;
}
