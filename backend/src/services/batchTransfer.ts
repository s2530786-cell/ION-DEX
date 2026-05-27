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
    source: "local-session";
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

export class BatchTransferValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BatchTransferValidationError";
  }
}

console.warn("[batch-transfer] on-chain batch contract not yet wired; validation is local until deployment.");

export function getBatchTransferConfig(): BatchTransferConfig {
  const contractAddress = CONTRACTS.batchTransfer.contractAddress;
  const deployed = isDeployed(contractAddress);
  return {
    contractAddress,
    ionTokenAddress: CONTRACTS.ion.tokenAddress,
    maxRecipients: MAX_BATCH_SIZE,
    feeCurrency: "ION",
    contractDeployed: deployed,
    provenance: {
      source: "local-session",
      note: deployed
        ? "BatchTransfer contract address configured; execution requires wallet approval."
        : "BatchTransfer contract address is a placeholder — validate payloads only until deploy.",
    },
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

function parseTransferLines(text: string): BatchTransferValidation {
  const lineErrors: string[] = [];
  const recipients: BatchTransferRecipient[] = [];
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

  let totalWei = 0n;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    const parts = line.split(",").map((part) => part.trim());
    if (parts.length < 2) {
      lineErrors.push(`Line ${index + 1}: expected address,amount format.`);
      continue;
    }
    const address = parts[0]!;
    const amountRaw = parts.slice(1).join(",").trim();
    if (!evmAddressPattern.test(address)) {
      lineErrors.push(`Line ${index + 1}: invalid address.`);
      continue;
    }
    const parsed = parseAmountIon(amountRaw);
    if (!parsed) {
      lineErrors.push(`Line ${index + 1}: amount must be a positive decimal.`);
      continue;
    }
    recipients.push({
      address: address.toLowerCase(),
      amount: parsed.amount,
      amountWei: parsed.amountWei.toString(),
    });
    totalWei += parsed.amountWei;
  }

  const totalAmount =
    totalWei === 0n
      ? "0"
      : (() => {
          const whole = totalWei / 10n ** 18n;
          const frac = totalWei % 10n ** 18n;
          if (frac === 0n) {
            return whole.toString();
          }
          const fracStr = frac.toString().padStart(18, "0").replace(/0+$/, "");
          return `${whole}.${fracStr}`;
        })();

  return {
    recipients,
    recipientCount: recipients.length,
    totalAmount,
    totalAmountWei: totalWei.toString(),
    lineErrors,
    provenance: getBatchTransferConfig().provenance,
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
    provenance: getBatchTransferConfig().provenance,
  };
}
