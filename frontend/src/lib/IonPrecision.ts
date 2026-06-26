/**
 * @file IonPrecision.ts
 * @description Financial-grade BigInt math library for ION DEX.
 * Eliminates IEEE 754 floating-point errors by handling all currency operations as scaled integers.
 */

export class IonMath {
  private static readonly DECIMALS = 9n;
  private static readonly SCALE = 10n ** IonMath.DECIMALS;

  /**
   * Converts a human-readable string (e.g., "1.25") to a BigInt nanoION value.
   */
  static toNano(val: string | number): bigint {
    const [whole, fraction = ''] = val.toString().split('.');
    const wholeBI = BigInt(whole) * IonMath.SCALE;
    const fractionBI = BigInt(fraction.slice(0, 9).padEnd(9, '0'));
    return wholeBI + fractionBI;
  }

  /**
   * Formats a BigInt nanoION value to a precise string with specific decimal places.
   */
  static format(val: bigint, decimals: number = 4): string {
    const s = val.toString().padStart(10, '0');
    const pos = s.length - 9;
    const whole = s.slice(0, pos);
    const frac = s.slice(pos, pos + decimals);
    return `${Number(whole).toLocaleString()}.${frac}`;
  }

  /**
   * Safe multiplication: (a * b) / scale
   */
  static mul(a: bigint, b: bigint): bigint {
    return (a * b) / IonMath.SCALE;
  }

  /**
   * Safe division: (a * scale) / b
   */
  static div(a: bigint, b: bigint): bigint {
    return (a * IonMath.SCALE) / b;
  }
}
