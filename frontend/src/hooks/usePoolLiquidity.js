import { useState, useCallback, useEffect } from 'react';
import { poolLiquidityManager } from '../lib/localStorage';

/**
 * usePoolLiquidity Hook - 流动性池管理
 * 
 * Features:
 * - 池信息查询和实时更新
 * - 流动性添加/移除
 * - 最优比例计算
 * - 流动性影响分析
 * - 价格范围计算 (V3)
 */
export function usePoolLiquidity() {
  const [pools, setPools] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取所有流动性池
  const fetchPools = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock 数据 - 实际应从区块链获取
      const mockPools = [
        {
          id: 'pool_ion_usdt',
          pair: 'ION/USDT',
          tokenA: 'ION',
          tokenB: 'USDT',
          reserve0: 1000000,      // ION 数量
          reserve1: 4820000,      // USDT 数量
          totalSupply: 2200000,   // LP 代币总供应
          fee: 0.3,               // 0.3% 手续费
          tvl: 4820000,           // TVL (USD)
          volume24h: 524000,      // 24h 成交量
          apr: 12.5,              // APR
          currentPrice: 4.82,
          priceChange24h: 2.5,    // %
          liquidity: 2200000,
          feesTier: '0.3%',
          concentrated: false,    // 是否为集中流动性池
          minTick: -887220,       // V3 参数
          maxTick: 887220,        // V3 参数
        },
        {
          id: 'pool_bnb_usdt',
          pair: 'BNB/USDT',
          tokenA: 'BNB',
          tokenB: 'USDT',
          reserve0: 3200,
          reserve1: 1952000,
          totalSupply: 2500000,
          fee: 0.25,
          tvl: 1952000,
          volume24h: 320000,
          apr: 15.8,
          currentPrice: 610,
          priceChange24h: 1.2,
          liquidity: 2500000,
          feesTier: '0.25%',
          concentrated: false,
          minTick: -887220,
          maxTick: 887220,
        },
        {
          id: 'pool_eth_usdt',
          pair: 'ETH/USDT',
          tokenA: 'ETH',
          tokenB: 'USDT',
          reserve0: 320,
          reserve1: 720000,
          totalSupply: 480000,
          fee: 0.05,
          tvl: 720000,
          volume24h: 180000,
          apr: 8.3,
          currentPrice: 2250,
          priceChange24h: -0.8,
          liquidity: 480000,
          feesTier: '0.05%',
          concentrated: true,      // 集中流动性池
          minTick: -76260,
          maxTick: 76260,
        },
      ];

      setPools(mockPools);
      return mockPools;
    } catch (err) {
      const errorMsg = err.message || '获取流动性池失败';
      setError(errorMsg);
      console.error('Fetch pools error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取池详情
  const getPoolDetail = useCallback((poolId) => {
    return pools.find(p => p.id === poolId);
  }, [pools]);

  // 计算添加流动性
  const calculateAddLiquidity = useCallback((poolId, amountA, amountB) => {
    const pool = getPoolDetail(poolId);
    if (!pool) return null;

    try {
      // 计算理想比例
      const optimalRatio = pool.reserve1 / pool.reserve0; // tokenB/tokenA
      const providedRatio = amountB / amountA;

      // 确定限制因素
      let liquidity;
      let finalAmountA = amountA;
      let finalAmountB = amountB;

      if (Math.abs(providedRatio - optimalRatio) < 0.001) {
        // 完美比例
        liquidity = Math.sqrt(amountA * amountB * optimalRatio);
      } else if (providedRatio > optimalRatio) {
        // TokenB 过多，使用 TokenA 作为限制
        finalAmountB = amountA * optimalRatio;
        liquidity = Math.sqrt(amountA * finalAmountB * optimalRatio);
      } else {
        // TokenA 过多，使用 TokenB 作为限制
        finalAmountA = amountB / optimalRatio;
        liquidity = Math.sqrt(finalAmountA * amountB * optimalRatio);
      }

      // 计算 LP 代币数量
      const lpTokenAmount = (liquidity / Math.sqrt(pool.reserve0 * pool.reserve1)) * pool.totalSupply;

      // 计算价格影响
      const newReserve0 = pool.reserve0 + finalAmountA;
      const newReserve1 = pool.reserve1 + finalAmountB;
      const newPrice = newReserve1 / newReserve0;
      const priceImpact = Math.abs((newPrice - pool.currentPrice) / pool.currentPrice) * 100;

      // 估算未来费用
      const estimatedFeePerDay = (pool.volume24h * pool.fee) / 100;
      const estimatedFeeAnnual = estimatedFeePerDay * 365;
      const userShare = (lpTokenAmount / pool.totalSupply) * 100;
      const expectedFeePerYear = (estimatedFeeAnnual * userShare) / 100;

      return {
        success: true,
        amountA: finalAmountA,
        amountB: finalAmountB,
        lpTokens: lpTokenAmount,
        share: userShare,
        priceImpact: Math.max(priceImpact, 0),
        slippage: 0.5,
        estimatedFee: expectedFeePerYear,
        optimalRatio,
        providedRatio,
        warning: priceImpact > 5 ? '高价格影响' : priceImpact > 1 ? '中等价格影响' : null,
      };
    } catch (err) {
      console.error('Calculate add liquidity error:', err);
      return {
        success: false,
        error: err.message,
      };
    }
  }, [getPoolDetail]);

  // 计算移除流动性
  const calculateRemoveLiquidity = useCallback((poolId, lpTokenAmount) => {
    const pool = getPoolDetail(poolId);
    if (!pool) return null;

    try {
      // 计算用户获得的 token 数量
      const userShare = (lpTokenAmount / pool.totalSupply) * 100;
      const amountA = (lpTokenAmount / pool.totalSupply) * pool.reserve0;
      const amountB = (lpTokenAmount / pool.totalSupply) * pool.reserve1;

      // 计算可获得的费用
      const totalFeeAccumulated = pool.volume24h * pool.fee * 365 / 100 * 0.5; // 简化计算
      const userFees = (totalFeeAccumulated * userShare) / 100;

      // 计算价格影响
      const newReserve0 = Math.max(pool.reserve0 - amountA, 1);
      const newReserve1 = Math.max(pool.reserve1 - amountB, 1);
      const newPrice = newReserve1 / newReserve0;
      const priceImpact = Math.abs((newPrice - pool.currentPrice) / pool.currentPrice) * 100;

      return {
        success: true,
        amountA: Math.max(amountA, 0),
        amountB: Math.max(amountB, 0),
        fees: userFees,
        share: userShare,
        priceImpact: Math.max(priceImpact, 0),
        totalValue: (amountA * pool.currentPrice + amountB),
        warning: priceImpact > 5 ? '高价格影响' : null,
      };
    } catch (err) {
      console.error('Calculate remove liquidity error:', err);
      return {
        success: false,
        error: err.message,
      };
    }
  }, [getPoolDetail]);

  // 获取最优流动性范围 (V3)
  const getOptimalRange = useCallback((poolId, currentPrice) => {
    const pool = getPoolDetail(poolId);
    if (!pool || !pool.concentrated) return null;

    try {
      // 计算最优范围 (±20% 当前价格)
      const lowerBound = currentPrice * 0.8;
      const upperBound = currentPrice * 1.2;

      // 转换为 tick
      const lowerTick = Math.floor(Math.log(lowerBound) / Math.log(1.0001)) * 60;
      const upperTick = Math.ceil(Math.log(upperBound) / Math.log(1.0001)) * 60;

      return {
        lowerBound,
        upperBound,
        lowerTick: Math.max(lowerTick, pool.minTick),
        upperTick: Math.min(upperTick, pool.maxTick),
        width: upperBound - lowerBound,
        efficiency: 100 - (Math.abs(currentPrice - (lowerBound + upperBound) / 2) / currentPrice) * 100,
      };
    } catch (err) {
      console.error('Calculate optimal range error:', err);
      return null;
    }
  }, [getPoolDetail]);

  // 初始化
  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return {
    // 数据
    pools,
    selectedPool,
    isLoading,
    error,

    // 设置
    setSelectedPool,

    // 方法
    fetchPools,
    getPoolDetail,
    calculateAddLiquidity,
    calculateRemoveLiquidity,
    getOptimalRange,
  };
}

export default usePoolLiquidity;
