import { useState, useCallback, useEffect, useMemo } from 'react';
import useBlockchainPrice from './useBlockchainPrice';
import { priceCacheManager } from '../lib/localStorage';

/**
 * 增强的 Swap 价格计算引擎 (支持实时链上数据)
 * - 自动从链上获取实时价格
 * - 价格缓存机制
 * - 多种滑点算法
 * - 实时价格更新
 */
export function useSwapPrice() {
  const {
    prices: blockchainPrices,
    getPriceHistory,
    getLiquidity,
    getVolume24h,
    calculateVolatility,
    calculateRSI,
    isLoading: blockchainLoading,
  } = useBlockchainPrice();

  const [slippageMode, setSlippageMode] = useState('auto');
  const [customSlippage, setCustomSlippage] = useState(0.5);
  const [priceImpact, setPriceImpact] = useState(0);
  const [priceHistory, setPriceHistory] = useState([]);
  const [volatility, setVolatility] = useState(0);
  const [rsi, setRSI] = useState(null);

  // 更新技术指标
  useEffect(() => {
    if (Object.keys(blockchainPrices).length > 0) {
      // 计算波动率和 RSI
      const vol = calculateVolatility('ION/USDT');
      const rsiValue = calculateRSI('ION/USDT');
      setVolatility(vol || 0);
      setRSI(rsiValue);
    }
  }, [blockchainPrices, calculateVolatility, calculateRSI]);

  /**
   * 从区块链获取实时价格
   */
  const getRealTimePrice = useCallback(
    (fromToken, toToken) => {
      const pairKey = `${fromToken}/${toToken}`;
      let priceData = blockchainPrices[pairKey];

      // 检查缓存
      if (!priceData) {
        const cached = priceCacheManager.getPrice(pairKey);
        if (cached) {
          priceData = cached;
        }
      }

      return priceData;
    },
    [blockchainPrices]
  );

  /**
   * 计算交换价格 (使用实时链上数据)
   */
  const calculatePrice = useCallback(
    (fromToken, toToken, inputAmount) => {
      if (!inputAmount || inputAmount <= 0 || fromToken === toToken) {
        return null;
      }

      try {
        const priceData = getRealTimePrice(fromToken, toToken);
        if (!priceData) {
          console.warn(`No price data for ${fromToken}/${toToken}`);
          return null;
        }

        const basePrice = priceData.price;
        const liquidity = getLiquidity(`${fromToken}/${toToken}`) || 5000000;

        // 基础输出
        const baseOutput = inputAmount * basePrice;

        // 计算价格影响 (根据流动性和交易量)
        const volume = getVolume24h(`${fromToken}/${toToken}`) || 1000000;
        const calculatedPriceImpact = Math.min(
          (inputAmount / liquidity) * 100 + (inputAmount / volume) * 0.5,
          15
        );
        setPriceImpact(calculatedPriceImpact);

        // 计算实际滑点
        const actualSlippage =
          slippageMode === 'auto'
            ? calculateSuggestedSlippage(calculatedPriceImpact)
            : customSlippage;

        // 最小输出
        const minOutput = baseOutput * (1 - actualSlippage / 100);

        // 费用计算
        const tradingFee = baseOutput * 0.003;
        const ecoFeeInION = inputAmount * 0.01;

        // 路由优化
        let route = [fromToken];
        if (
          (fromToken !== 'USDT' && toToken !== 'USDT') ||
          (fromToken !== 'BNB' && toToken !== 'BNB')
        ) {
          route.push('USDT');
        }
        route.push(toToken);
        route = Array.from(new Set(route));

        const quote = {
          inputToken: fromToken,
          outputToken: toToken,
          inputAmount: inputAmount,
          baseOutput: baseOutput,
          slippage: actualSlippage,
          minOutput: minOutput,
          priceImpact: calculatedPriceImpact.toFixed(2),
          rate: basePrice,
          tradingFee: tradingFee,
          ecoFeeInION: ecoFeeInION,
          route: route,
          liquidity: liquidity,
          volume24h: volume,
          volatility: volatility,
          rsi: rsi,
          gasEstimate: (0.001 + Math.random() * 0.005).toFixed(4),
          executionTime: '~15s',
          timestamp: Date.now(),
          priceData: priceData, // 包含实时价格数据
        };

        // 保存到缓存
        priceCacheManager.setPrice(`${fromToken}/${toToken}`, quote);

        return quote;
      } catch (error) {
        console.error('Price calculation error:', error);
        return null;
      }
    },
    [
      getRealTimePrice,
      getLiquidity,
      getVolume24h,
      slippageMode,
      customSlippage,
      volatility,
      rsi,
    ]
  );

  /**
   * 反向计算
   */
  const calculateReversePrice = useCallback(
    (fromToken, toToken, outputAmount) => {
      if (!outputAmount || outputAmount <= 0) return null;

      const priceData = getRealTimePrice(fromToken, toToken);
      if (!priceData) return null;

      const inputAmount = outputAmount / priceData.price;
      return calculatePrice(fromToken, toToken, inputAmount);
    },
    [getRealTimePrice, calculatePrice]
  );

  /**
   * 计算建议滑点
   */
  const calculateSuggestedSlippage = (impact) => {
    if (impact < 0.1) return 0.5;
    if (impact < 1) return 1.0;
    if (impact < 5) return 2.0;
    if (impact < 10) return 5.0;
    return 10.0;
  };

  /**
   * 动态滑点建议
   */
  const suggestedSlippage = useMemo(() => {
    if (slippageMode === 'custom') return customSlippage;
    return calculateSuggestedSlippage(priceImpact);
  }, [priceImpact, slippageMode, customSlippage]);

  /**
   * 获取价格趋势
   */
  const getPriceTrend = useCallback(
    (pair = 'ION/USDT') => {
      const history = getPriceHistory(pair);
      return history.slice(-10).map((p) => p.price);
    },
    [getPriceHistory]
  );

  /**
   * 验证滑点
   */
  const validateSlippage = useCallback((slippage) => {
    if (slippage < 0.1)
      return { valid: false, message: '滑点太低，交易可能失败' };
    if (slippage > 50) return { valid: false, message: '滑点过高，损失过大' };
    if (slippage > priceImpact * 2) {
      return {
        valid: true,
        message: '滑点设置合理但较高',
        warning: true,
      };
    }
    return { valid: true, message: '滑点设置合理', warning: false };
  }, [priceImpact]);

  /**
   * 获取市场洞察
   */
  const getMarketInsight = useCallback(() => {
    return {
      volatility: volatility.toFixed(2),
      rsi: rsi ? rsi.toFixed(2) : 'N/A',
      sentiment:
        rsi > 70 ? '过热 🔥' : rsi < 30 ? '过冷 ❄️' : '中性 😐',
      trend: volatility > 2 ? '高波动性' : '稳定',
    };
  }, [volatility, rsi]);

  return {
    // 计算函数
    calculatePrice,
    calculateReversePrice,
    validateSlippage,
    getPriceTrend,
    getMarketInsight,

    // 状态管理
    slippageMode,
    setSlippageMode,
    customSlippage,
    setCustomSlippage,
    suggestedSlippage,

    // 数据
    priceImpact,
    volatility,
    rsi,
    blockchainLoading,

    // 访问器
    getRealTimePrice,
  };
}

export default useSwapPrice;
