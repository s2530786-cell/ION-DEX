/**
 * @file TAEngine.ts
 * @description Technical Analysis engine for ION DEX.
 * Computes indicators in Web Workers to avoid blocking the UI thread.
 */

export interface IndicatorInput {
  data: number[];
  period?: number;
}

export interface IndicatorOutput {
  values: number[];
  signal?: 'buy' | 'sell' | 'neutral';
}

export const TAEngine = {
  /**
   * Simple Moving Average
   */
  sma(input: IndicatorInput): IndicatorOutput {
    const period = input.period || 14;
    const values: number[] = [];
    for (let i = period - 1; i < input.data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += input.data[i - j];
      }
      values.push(sum / period);
    }
    return { values };
  },

  /**
   * Exponential Moving Average
   */
  ema(input: IndicatorInput): IndicatorOutput {
    const period = input.period || 14;
    const k = 2 / (period + 1);
    const values: number[] = [input.data[0]];
    for (let i = 1; i < input.data.length; i++) {
      values.push(input.data[i] * k + values[i - 1] * (1 - k));
    }
    return { values };
  },

  /**
   * Relative Strength Index
   */
  rsi(input: IndicatorInput): IndicatorOutput {
    const period = input.period || 14;
    const values: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < input.data.length; i++) {
      const diff = input.data[i] - input.data[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? -diff : 0);
    }

    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      values.push(100 - 100 / (1 + rs));
    }

    const last = values[values.length - 1];
    const signal = last > 70 ? 'sell' : last < 30 ? 'buy' : 'neutral';
    return { values, signal };
  },

  /**
   * MACD
   */
  macd(input: IndicatorInput): IndicatorOutput {
    const fast = 12;
    const slow = 26;
    const signalPeriod = 9;
    const emaFast = TAEngine.ema({ data: input.data, period: fast }).values;
    const emaSlow = TAEngine.ema({ data: input.data, period: slow }).values;
    const macdLine: number[] = [];
    const offset = emaSlow.length - emaFast.length;
    for (let i = 0; i < emaFast.length; i++) {
      macdLine.push(emaFast[i] - emaSlow[i + offset]);
    }
    const signalLine = TAEngine.ema({ data: macdLine, period: signalPeriod }).values;
    const histogram = macdLine.slice(signalLine.length - macdLine.length).map((v, i) => v - signalLine[i]);
    const last = histogram[histogram.length - 1];
    return { values: histogram, signal: last > 0 ? 'buy' : 'sell' };
  },

  // Alias for worker compatibility
  calculateMACD: function(closes: number[], fast: number = 12, slow: number = 26, signal: number = 9): IndicatorOutput {
    return TAEngine.macd({ data: closes, period: fast });
  },
  calculateRSI: function(closes: number[], period: number = 14): IndicatorOutput {
    return TAEngine.rsi({ data: closes, period });
  },
  calculateEMA: function(closes: number[], period: number = 14): IndicatorOutput {
    return TAEngine.ema({ data: closes, period });
  },
  calculateSMA: function(closes: number[], period: number = 14): IndicatorOutput {
    return TAEngine.sma({ data: closes, period });
  },

  /**
   * Bollinger Bands
   */
  calculateBollingerBands(closes: number[], period: number = 20, stdDev: number = 2): { upper: number[]; middle: number[]; lower: number[] } {
    const middle = TAEngine.sma({ data: closes, period }).values;
    const upper: number[] = [];
    const lower: number[] = [];
    const offset = closes.length - middle.length;
    for (let i = 0; i < middle.length; i++) {
      const slice = closes.slice(i + offset - period + 1, i + offset + 1);
      const mean = middle[i];
      const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
      const std = Math.sqrt(variance);
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
    return { upper, middle, lower };
  },
};
