const DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.(\d+))?$/;

export function pow10(decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new Error(`Invalid decimals: ${decimals}`);
  }
  return 10n ** BigInt(decimals);
}

export function parseDecimalUnits(value: string, decimals: number): bigint {
  const trimmed = value.trim();
  const match = DECIMAL_PATTERN.exec(trimmed);
  if (!match) {
    throw new Error("Amount must be a non-negative decimal string.");
  }
  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) {
    throw new Error(`Amount exceeds ${decimals} decimal places.`);
  }
  const paddedFraction = fraction.padEnd(decimals, "0");
  return BigInt(whole) * pow10(decimals) + BigInt(paddedFraction || "0");
}

export function formatDecimalUnits(units: bigint, decimals: number, maxFractionDigits = 6): string {
  const scale = pow10(decimals);
  const whole = units / scale;
  const fraction = units % scale;
  if (fraction === 0n || maxFractionDigits === 0) {
    return whole.toString();
  }
  const normalized = fraction.toString().padStart(decimals, "0").slice(0, maxFractionDigits);
  const trimmed = normalized.replace(/0+$/, "");
  return trimmed.length > 0 ? `${whole}.${trimmed}` : whole.toString();
}

export function applyBpsFloor(value: bigint, bps: number): bigint {
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) {
    throw new Error(`Invalid bps: ${bps}`);
  }
  return (value * BigInt(bps)) / 10_000n;
}
