const evmAddressPattern = /^0x[a-fA-F0-9]{40}$/;

export type ParsedRecipientRow = {
  address: string;
  amount: string;
};

export function parseTransferCsv(text: string): { rows: ParsedRecipientRow[]; errors: string[] } {
  const rows: ParsedRecipientRow[] = [];
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line, index) => {
    const [addressPart, amountPart, ...rest] = line.split(",");
    if (rest.length > 0 || !addressPart || !amountPart) {
      errors.push(`Line ${index + 1}: use address,amount format.`);
      return;
    }
    const address = addressPart.trim();
    const amount = amountPart.trim();
    if (!evmAddressPattern.test(address)) {
      errors.push(`Line ${index + 1}: invalid address.`);
      return;
    }
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      errors.push(`Line ${index + 1}: amount must be greater than zero.`);
      return;
    }
    rows.push({ address, amount });
  });

  return { rows, errors };
}

export function parseAddressLines(text: string): { addresses: string[]; errors: string[] } {
  const addresses: string[] = [];
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line, index) => {
    const address = line.split(",")[0]?.trim() ?? "";
    if (!evmAddressPattern.test(address)) {
      errors.push(`Line ${index + 1}: invalid address.`);
      return;
    }
    addresses.push(address);
  });

  return { addresses, errors };
}
