/**
 * @file stream.worker.ts
 * @description Dedicated worker for high-frequency market data processing.
 * Offloads BigInt calculations and data aggregation from the main thread.
 */

interface RawBook {
  bids: [string, string][]; // [price, volume]
  asks: [string, string][];
  seq: number;
}

self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  if (type === 'PROCESS_ORDERBOOK') {
    const raw: RawBook = data;
    
    // 1. Convert to BigInt and calculate cumulative depth
    let bidTotal = 0n;
    const processedBids = raw.bids.map(([p, v]) => {
      const vol = BigInt(v);
      bidTotal += vol;
      return { price: BigInt(p), volume: vol, total: bidTotal };
    });

    let askTotal = 0n;
    const processedAsks = raw.asks.map(([p, v]) => {
      const vol = BigInt(v);
      askTotal += vol;
      return { price: BigInt(p), volume: vol, total: askTotal };
    });

    // 2. Return processed data to main thread
    self.postMessage({
      type: 'ORDERBOOK_UPDATED',
      payload: {
        bids: processedBids,
        asks: processedAsks,
        maxDepth: bidTotal > askTotal ? bidTotal : askTotal,
        seq: raw.seq
      }
    });
  }
};
