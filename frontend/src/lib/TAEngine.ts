/**
 * @file TAEngine.ts
 * @description Advanced quantitative analysis engine for ION DEX.
 * Implements MACD, Bollinger Bands, and standard deviation calculations for high-frequency trading.
 */

export class TAEngine {
  /**
   * Exponential Moving Average (EMA)
   */
  static calculateEMA(data: number[], period: number): number[] {
    if (data.length < period) return new Array(data.length).fill(NaN);
    const k = 2 / (period + 1);
    let sum = 0;
    for (let i = 0; i < period; i++) sum += data[i];
    let emaVal = sum / period;
    const ema = new Array(period - 1).fill(NaN);
    ema.push(emaVal);
    for (let i = period; i < data.length; i++) {
      emaVal = data[i] * k + emaVal * (1 - k);
      ema.push(emaVal);
    }
    return ema;
  }

  /**
   * Moving Average Convergence Divergence (MACD)
   */
  static calculateMACD(closePrices: number[], fast = 12, slow = 26, signal = 9) {
    if (closePrices.length < slow + signal) return null;
    const emaFast = this.calculateEMA(closePrices, fast);
    const emaSlow = this.calculateEMA(closePrices, slow);
    const macdLine = emaFast.map((val, i) => val - emaSlow[i]);
    const firstValidIdx = slow - 1;
    const validMacdData = macdLine.slice(firstValidIdx);
    const signalLineRaw = this.calculateEMA(validMacdData, signal);
    const signalLine = new Array(firstValidIdx).fill(NaN).concat(signalLineRaw);
    const histogram = macdLine.map((val, i) => val - signalLine[i]);
    return { macdLine, signalLine, histogram };
  }

  /**
   * Standard Deviation
   */
  static calculateStdDev(data: number[], period: number): number[] {
    const stdDev: number[] = new Array(period - 1).fill(NaN);
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
      stdDev.push(Math.sqrt(variance));
    }
    return stdDev;
  }

  /**
   * Bollinger Bands
   */
  static calculateBollingerBands(closePrices: number[], period = 20, multiplier = 2) {
    if (closePrices.length < period) return null;
    const ma: number[] = new Array(period - 1).fill(NaN);
    for (let i = period - 1; i < closePrices.length; i++) {
      const slice = closePrices.slice(i - period + 1, i + 1);
      ma.push(slice.reduce((a, b) => a + b, 0) / period);
    }
    const stdDev = this.calculateStdDev(closePrices, period);
    const upper: number[] = [];
    const lower: number[] = [];
    for (let i = 0; i < ma.length; i++) {
      if (isNaN(ma[i]) || isNaN(stdDev[i])) {
        upper.push(NaN);
        lower.push(NaN);
      } else {
        upper.push(ma[i] + stdDev[i] * multiplier);
        lower.push(ma[i] - stdDev[i] * multiplier);
      }
    }
    return { ma, upper, lower };
  }

  /**
   * Relative Strength Index (RSI) — Wilder's smoothing method.
   * Returns an array aligned to the input length, with NaN for the warm-up window.
   */
  static calculateRSI(closePrices: number[], period = 14): number[] {
    const rsi = new Array(closePrices.length).fill(NaN);
    if (closePrices.length <= period) return rsi;

    // Initial average gain/loss over the first `period` deltas.
    let gainSum = 0;
    let lossSum = 0;
    for (let i = 1; i <= period; i++) {
      const delta = closePrices[i] - closePrices[i - 1];
      if (delta >= 0) gainSum += delta;
      else lossSum -= delta;
    }
    let avgGain = gainSum / period;
    let avgLoss = lossSum / period;
    rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

    // Wilder's smoothing for subsequent values.
    for (let i = period + 1; i < closePrices.length; i++) {
      const delta = closePrices[i] - closePrices[i - 1];
      const gain = delta >= 0 ? delta : 0;
      const loss = delta < 0 ? -delta : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
    return rsi;
  }
}
