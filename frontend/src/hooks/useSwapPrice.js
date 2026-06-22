import { useState, useCallback, useEffect, useMemo } from 'react';

/**
 * 高级 Swap 价格计算引擎
 * - 自动路由优化
 * - 多种滑点算法
 * - 实时价格更新
 */
export function useSwapPrice() {
  const [prices, setPrices] = useState({});
  const [slippageMode, setSlippageMode] = useState('auto'); // 'auto' | 'custom'
  const [customSlippage, setCustomSlippage] = useState(0.5); // 0.5%
  const [priceImpact, setPriceImpact] = useState(0);
  const [priceHistory, setPriceHistory] = useState([]);

  // 模拟 DEX 价格数据（实际应从链上读取）
  const mockPrices = {
    'ION/USDT': 4.82,
    'ION/USDC': 4.81,
    'ION/BNB': 0.0082,
    'BNB/USDT': 610.5,
    'BTC/USDT': 42500,
    'ETH/USDT': 2250,
    'WBTC/WION': 8.2,
  };

  /**
   * 计算交换价格
   * @param {string} fromToken - 源代币
   * @param {string} toToken - 目标代币
   * @param {number} inputAmount - 输入数量
   * @returns {object} 价格信息
   */
  const calculatePrice = useCallback((fromToken, toToken, inputAmount) => {
    if (!inputAmount || inputAmount <= 0 || fromToken === toToken) {
      return null;
    }

    try {
      const pairKey = `${fromToken}/${toToken}`;
      const basePrice = mockPrices[pairKey];

      if (!basePrice) {
        console.warn(`Price pair ${pairKey} not found`);
        return null;
      }

      // 基础输出（不含滑点）
      const baseOutput = inputAmount * basePrice;

      // 计算价格影响（基于交易量）
      // 公式: impact = (inputAmount / liquidity) * 100
      const liquidity = Math.random() * 10000000 + 5000000; // Mock 流动性
      const calculatedPriceImpact = Math.min(
        (inputAmount / liquidity) * 100,
        15 // 最大 15% 价格影响
      );
      setPriceImpact(calculatedPriceImpact);

      // 计算实际滑点
      const actualSlippage = slippageMode === 'auto' 
        ? Math.max(0.5, calculatedPriceImpact * 0.5)
        : customSlippage;

      // 最小输出 = 基础输出 * (1 - 滑点%)
      const minOutput = baseOutput * (1 - actualSlippage / 100);

      // 费用计算 (0.3% 交易费 + ION 生态费)
      const tradingFee = baseOutput * 0.003;
      const ecoFeeInION = inputAmount * 0.01; // 1% ION 费用

      // 路由优化（模拟最优路由选择）
      let route = [fromToken];
      if (
        (fromToken !== 'USDT' && toToken !== 'USDT') ||
        (fromToken !== 'BNB' && toToken !== 'BNB')
      ) {
        route.push('USDT'); // 通过 USDT 中转
      }
      route.push(toToken);

      // 移除重复
      route = Array.from(new Set(route));

      // 构建完整报价对象
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
        gasEstimate: (0.001 + Math.random() * 0.005).toFixed(4), // Mock gas
        executionTime: '~15s', // 预计执行时间
        timestamp: Date.now(),
      };

      // 保存到历史记录（用于价格趋势）
      setPriceHistory(prev => [
        ...prev.slice(-99), // 保留最近 100 条
        { price: basePrice, time: new Date().toLocaleTimeString() }
      ]);

      return quote;
    } catch (error) {
      console.error('Price calculation error:', error);
      return null;
    }
  }, [slippageMode, customSlippage]);

  /**
   * 计算反向交换（已知输出，求输入）
   */
  const calculateReversePrice = useCallback((fromToken, toToken, outputAmount) => {
    if (!outputAmount || outputAmount <= 0) return null;

    const pairKey = `${fromToken}/${toToken}`;
    const basePrice = mockPrices[pairKey];

    if (!basePrice) return null;

    // 反向计算输入量
    const inputAmount = outputAmount / basePrice;
    return calculatePrice(fromToken, toToken, inputAmount);
  }, [calculatePrice]);

  /**
   * 动态滑点建议
   * 基于价格影响自动调整
   */
  const suggestedSlippage = useMemo(() => {
    if (slippageMode === 'custom') return customSlippage;

    if (priceImpact < 0.1) return 0.5; // 低影响：0.5%
    if (priceImpact < 1) return 1.0;   // 中低影响：1%
    if (priceImpact < 5) return 2.0;   // 中等影响：2%
    if (priceImpact < 10) return 5.0;  // 高影响：5%
    return 10.0; // 极高影响：10%
  }, [priceImpact, slippageMode, customSlippage]);

  /**
   * 获取价格趋势（最近 10 个数据点）
   */
  const getPriceTrend = useCallback(() => {
    return priceHistory.slice(-10).map(p => p.price);
  }, [priceHistory]);

  /**
   * 验证滑点是否在安全范围内
   */
  const validateSlippage = useCallback((slippage) => {
    if (slippage < 0.1) return { valid: false, message: '滑点太低，交易可能失败' };
    if (slippage > 50) return { valid: false, message: '滑点过高，损失过大' };
    if (slippage > priceImpact * 2) {
      return { valid: true, message: '滑点设置合理但较高', warning: true };
    }
    return { valid: true, message: '滑点设置合理', warning: false };
  }, [priceImpact]);

  return {
    // 计算函数
    calculatePrice,
    calculateReversePrice,
    validateSlippage,
    getPriceTrend,
    
    // 状态管理
    slippageMode,
    setSlippageMode,
    customSlippage,
    setCustomSlippage,
    suggestedSlippage,
    
    // 数据
    priceImpact,
    priceHistory,
    mockPrices,
  };
}
