import { useState, useEffect, useCallback } from 'react';

/**
 * 链上数据源 Hook
 * 连接到区块链网络获取实时价格、流动性等数据
 * 支持多链：BSC、ION 等
 */

// 模拟的链上数据源 (实际应连接 RPC/GraphQL)
const BLOCKCHAIN_DATA = {
  prices: {
    'ION/USDT': { price: 4.82, timestamp: Date.now(), change24h: 2.5 },
    'ION/USDC': { price: 4.81, timestamp: Date.now(), change24h: 2.4 },
    'ION/BNB': { price: 0.0082, timestamp: Date.now(), change24h: 1.8 },
    'BNB/USDT': { price: 610.5, timestamp: Date.now(), change24h: -1.2 },
    'BTC/USDT': { price: 42500, timestamp: Date.now(), change24h: 3.5 },
    'ETH/USDT': { price: 2250, timestamp: Date.now(), change24h: 2.1 },
    'WBTC/WION': { price: 8.2, timestamp: Date.now(), change24h: 1.5 },
  },
  liquidity: {
    'ION/USDT': 12500000,
    'BNB/USDT': 8500000,
    'BTC/USDT': 15000000,
  },
  volume24h: {
    'ION/USDT': 2500000,
    'BNB/USDT': 3200000,
    'BTC/USDT': 5800000,
  },
};

export function useBlockchainPrice() {
  const [prices, setPrices] = useState({});
  const [liquidity, setLiquidity] = useState({});
  const [volume24h, setVolume24h] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [priceHistory, setPriceHistory] = useState({});

  // 初始化链上数据
  useEffect(() => {
    fetchBlockchainData();

    // 设置实时更新 (每 5 秒更新一次)
    const interval = setInterval(fetchBlockchainData, 5000);

    return () => clearInterval(interval);
  }, []);

  /**
   * 从链上获取实时数据
   * 实际应用中应调用真实 RPC/GraphQL
   */
  const fetchBlockchainData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 模拟链上数据获取
      // 实际实现应这样做:
      // const response = await fetch(RPC_URL, {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     jsonrpc: '2.0',
      //     method: 'eth_call',
      //     params: [...],
      //     id: 1,
      //   })
      // });

      // 为了演示，使用 mock 数据加入随机波动
      const updatedPrices = {};
      Object.entries(BLOCKCHAIN_DATA.prices).forEach(([pair, data]) => {
        const volatility = (Math.random() - 0.5) * 0.02; // ±1% 波动
        updatedPrices[pair] = {
          price: data.price * (1 + volatility),
          timestamp: Date.now(),
          change24h: data.change24h + (Math.random() - 0.5) * 0.5,
          volatility: Math.abs(volatility) * 100,
        };
      });

      setPrices(updatedPrices);
      setLiquidity(BLOCKCHAIN_DATA.liquidity);
      setVolume24h(BLOCKCHAIN_DATA.volume24h);
      setLastUpdate(Date.now());

      // 保存价格历史
      setPriceHistory((prev) => {
        const newHistory = { ...prev };
        Object.entries(updatedPrices).forEach(([pair, data]) => {
          newHistory[pair] = [
            ...(prev[pair] || []).slice(-99), // 保留最近 100 条
            {
              price: data.price,
              timestamp: data.timestamp,
            },
          ];
        });
        return newHistory;
      });

      setError(null);
    } catch (err) {
      console.error('Failed to fetch blockchain data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 获取特定交易对的价格
   */
  const getPrice = useCallback(
    (pair) => {
      return prices[pair] || null;
    },
    [prices]
  );

  /**
   * 获取价格历史数据 (用于图表)
   */
  const getPriceHistory = useCallback(
    (pair) => {
      return priceHistory[pair] || [];
    },
    [priceHistory]
  );

  /**
   * 获取流动性
   */
  const getLiquidity = useCallback(
    (pair) => {
      return liquidity[pair] || 0;
    },
    [liquidity]
  );

  /**
   * 获取 24h 交易量
   */
  const getVolume24h = useCallback(
    (pair) => {
      return volume24h[pair] || 0;
    },
    [volume24h]
  );

  /**
   * 计算价格变化百分比
   */
  const getPriceChange = useCallback(
    (pair, minutes = 60) => {
      const history = priceHistory[pair];
      if (!history || history.length < 2) return 0;

      const now = Date.now();
      const pastTime = now - minutes * 60 * 1000;
      const pastPrice =
        history.find((p) => p.timestamp <= pastTime)?.price ||
        history[0]?.price;
      const currentPrice = history[history.length - 1]?.price;

      if (!pastPrice || !currentPrice) return 0;

      return ((currentPrice - pastPrice) / pastPrice) * 100;
    },
    [priceHistory]
  );

  /**
   * 计算 VWAP (Volume Weighted Average Price)
   */
  const calculateVWAP = useCallback(
    (pair, periods = 20) => {
      const history = getPriceHistory(pair);
      if (history.length < periods) return null;

      const recentData = history.slice(-periods);
      let totalWeightedPrice = 0;
      let totalVolume = 0;

      recentData.forEach((candle) => {
        // Mock volume 为了演示
        const volume = Math.random() * 1000000;
        totalWeightedPrice += candle.price * volume;
        totalVolume += volume;
      });

      return totalVolume > 0 ? totalWeightedPrice / totalVolume : null;
    },
    [getPriceHistory]
  );

  /**
   * 计算波动率 (Volatility)
   */
  const calculateVolatility = useCallback(
    (pair, periods = 20) => {
      const history = getPriceHistory(pair);
      if (history.length < periods) return 0;

      const recentData = history.slice(-periods);
      const prices = recentData.map((p) => p.price);

      const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance =
        prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) /
        prices.length;
      const stdDev = Math.sqrt(variance);

      return (stdDev / mean) * 100; // 作为百分比
    },
    [getPriceHistory]
  );

  /**
   * 计算 RSI (Relative Strength Index)
   */
  const calculateRSI = useCallback(
    (pair, periods = 14) => {
      const history = getPriceHistory(pair);
      if (history.length < periods + 1) return null;

      const recentData = history.slice(-periods - 1);
      const prices = recentData.map((p) => p.price);

      let upSum = 0;
      let downSum = 0;

      for (let i = 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) {
          upSum += change;
        } else {
          downSum += Math.abs(change);
        }
      }

      const avgGain = upSum / periods;
      const avgLoss = downSum / periods;

      if (avgLoss === 0) return 100;

      const rs = avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);

      return rsi;
    },
    [getPriceHistory]
  );

  /**
   * 获取市场情绪 (Sentiment)
   */
  const getMarketSentiment = useCallback(
    (pair) => {
      const priceData = getPrice(pair);
      if (!priceData) return 'neutral';

      const change = priceData.change24h;
      if (change > 5) return 'very_bullish';
      if (change > 2) return 'bullish';
      if (change > -2) return 'neutral';
      if (change > -5) return 'bearish';
      return 'very_bearish';
    },
    [getPrice]
  );

  return {
    // 数据访问
    prices,
    liquidity,
    volume24h,
    priceHistory,
    lastUpdate,

    // 查询方法
    getPrice,
    getPriceHistory,
    getLiquidity,
    getVolume24h,
    getPriceChange,

    // 技术分析
    calculateVWAP,
    calculateVolatility,
    calculateRSI,
    getMarketSentiment,

    // 状态
    isLoading,
    error,
    refreshData: fetchBlockchainData,
  };
}

export default useBlockchainPrice;
