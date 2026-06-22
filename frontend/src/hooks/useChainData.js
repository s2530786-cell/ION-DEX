import { useState, useEffect, useCallback } from 'react';

/**
 * 链上数据源 Hook
 * 模拟从区块链获取实时价格、流动性、交易数据
 * 生产环境可替换为真实 RPC 调用
 */
export function useChainData() {
  const [priceData, setPriceData] = useState({});
  const [liquidityData, setLiquidityData] = useState({});
  const [gasPrice, setGasPrice] = useState(null);
  const [blockNumber, setBlockNumber] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock 实时价格数据
  const mockPrices = {
    'ION/USDT': { price: 4.82, timestamp: Date.now(), volume24h: 12500000 },
    'ION/USDC': { price: 4.81, timestamp: Date.now(), volume24h: 5200000 },
    'ION/BNB': { price: 0.0082, timestamp: Date.now(), volume24h: 2100000 },
    'BNB/USDT': { price: 610.5, timestamp: Date.now(), volume24h: 15000000 },
    'BTC/USDT': { price: 42500, timestamp: Date.now(), volume24h: 8500000 },
    'ETH/USDT': { price: 2250, timestamp: Date.now(), volume24h: 6200000 },
    'WBTC/WION': { price: 8.2, timestamp: Date.now(), volume24h: 3100000 },
  };

  // Mock 流动性数据
  const mockLiquidity = {
    'ION/USDT': { tvl: 12500000, reserve0: 2594605, reserve1: 12500000, apy: 24.5 },
    'BNB/USDT': { tvl: 8500000, reserve0: 13920, reserve1: 8500000, apy: 18.3 },
    'BTC/USDT': { tvl: 15000000, reserve0: 352, reserve1: 15000000, apy: 12.8 },
  };

  /**
   * 获取实时价格
   */
  const fetchPrices = useCallback(async (pairs = []) => {
    setIsLoading(true);
    setError(null);
    try {
      // 模拟网络延迟
      await new Promise(r => setTimeout(r, 300));

      // 实际应用中，这里应该调用:
      // const response = await fetch(`https://api.chaindata.com/prices?pairs=${pairs.join(',')}`);
      // const data = await response.json();

      const data = pairs.length > 0
        ? Object.fromEntries(
            pairs.map(p => [p, mockPrices[p]])
          )
        : mockPrices;

      setPriceData(data);
      return data;
    } catch (err) {
      setError('Failed to fetch price data: ' + err.message);
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 获取流动性信息
   */
  const fetchLiquidity = useCallback(async (poolAddresses = []) => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 300));

      // 实际应用中，这里应该调用:
      // const response = await fetch(`https://api.chaindata.com/pools?addresses=${poolAddresses.join(',')}`);
      // const data = await response.json();

      const data = poolAddresses.length > 0
        ? Object.fromEntries(
            poolAddresses.map(p => [p, mockLiquidity[p]])
          )
        : mockLiquidity;

      setLiquidityData(data);
      return data;
    } catch (err) {
      setError('Failed to fetch liquidity data: ' + err.message);
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 获取 Gas 价格
   */
  const fetchGasPrice = useCallback(async () => {
    try {
      // 模拟 Gas 价格
      const mockGasPrice = {
        safe: 20,
        standard: 30,
        fast: 50,
      };

      setGasPrice(mockGasPrice);
      return mockGasPrice;
    } catch (err) {
      setError('Failed to fetch gas price: ' + err.message);
      console.error(err);
      return null;
    }
  }, []);

  /**
   * 获取区块信息
   */
  const fetchBlockNumber = useCallback(async () => {
    try {
      // 模拟区块号（实际应调用 eth_blockNumber）
      const mockBlock = Math.floor(Date.now() / 1000);
      setBlockNumber(mockBlock);
      return mockBlock;
    } catch (err) {
      setError('Failed to fetch block number: ' + err.message);
      console.error(err);
      return null;
    }
  }, []);

  /**
   * 获取历史价格数据（用于图表）
   */
  const fetchPriceHistory = useCallback(async (pair, timeframe = '1h', limit = 100) => {
    try {
      // 生成 Mock 历史价格
      const basePrice = mockPrices[pair]?.price || 100;
      const history = [];

      for (let i = limit; i > 0; i--) {
        const volatility = 0.02; // 2% 波动率
        const randomChange = (Math.random() - 0.5) * basePrice * volatility;
        const price = basePrice + randomChange * Math.sin(i / 10);

        history.push({
          timestamp: Date.now() - i * (timeframe === '1h' ? 3600000 : 86400000),
          open: price * 0.99,
          high: price * 1.01,
          low: price * 0.98,
          close: price,
          volume: Math.random() * 1000000,
        });
      }

      return history;
    } catch (err) {
      setError('Failed to fetch price history: ' + err.message);
      console.error(err);
      return null;
    }
  }, []);

  /**
   * 订阅实时价格更新
   */
  const subscribeToPrice = useCallback((pair, callback) => {
    let isSubscribed = true;

    const interval = setInterval(() => {
      if (!isSubscribed) return;

      // 模拟价格波动
      const basePrice = mockPrices[pair]?.price || 100;
      const newPrice = basePrice * (1 + (Math.random() - 0.5) * 0.001);

      callback({
        pair,
        price: newPrice,
        timestamp: Date.now(),
        change: ((newPrice - basePrice) / basePrice * 100).toFixed(2),
      });
    }, 2000); // 每 2 秒更新一次

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  // 组件挂载时初始化数据
  useEffect(() => {
    fetchPrices();
    fetchGasPrice();
    fetchBlockNumber();
  }, [fetchPrices, fetchGasPrice, fetchBlockNumber]);

  return {
    // 数据
    priceData,
    liquidityData,
    gasPrice,
    blockNumber,
    isLoading,
    error,

    // 方法
    fetchPrices,
    fetchLiquidity,
    fetchGasPrice,
    fetchBlockNumber,
    fetchPriceHistory,
    subscribeToPrice,
  };
}

export default useChainData;
