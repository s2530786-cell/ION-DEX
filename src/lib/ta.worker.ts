/**
 * @file ta.worker.ts
 * @description Dedicated calculation thread for high-frequency technical analysis.
 * Prevents UI thread blocking during complex BigInt and indicator recursions.
 */
import { TAEngine } from '../pro/indicators/TAEngine';

self.onmessage = (event: MessageEvent) => {
  const { id, indicator, payload, params } = event.data;
  
  try {
    let result = null;
    
    // Routing to specific indicator algorithms
    switch (indicator) {
      case 'MACD':
        result = TAEngine.calculateMACD(payload.closes, params.fast, params.slow, params.signal);
        break;
      case 'BB':
        result = TAEngine.calculateBollingerBands(payload.closes, params.period, params.stdDev);
        break;
      case 'RSI':
        // Implementation assumed in TAEngine
        result = TAEngine.calculateRSI(payload.closes, params.period);
        break;
      case 'EMA':
        result = TAEngine.calculateEMA(payload.closes, params.period);
        break;
      default:
        throw new Error(`Unknown indicator: ${indicator}`);
    }

    // Return result asynchronously to main thread
    self.postMessage({ id, status: 'success', result });
  } catch (error) {
    self.postMessage({ id, status: 'error', error: String(error) });
  }
};
