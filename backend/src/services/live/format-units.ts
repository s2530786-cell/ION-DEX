export function formatUnits(value: bigint, decimals: number): string {
  if (decimals <= 0) {
    return value.toString();
  }
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = absolute / base;
  const fraction = absolute % base;
  const fractionText = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  const rendered = fractionText.length > 0 ? `${whole.toString()}.${fractionText}` : whole.toString();
  return negative ? `-${rendered}` : rendered;
}
