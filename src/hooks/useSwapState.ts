import { useState, useEffect, useCallback } from 'react';
import {
  fetchPoolData,
  subscribePoolData,
  executeSwap,
  approveToken,
  isWalletAvailable,
  getWalletAddress,
  type PoolData,
} from '../lib/pancakeSwapService';

/**
 * useSwapState — ION-DEX 兑换核心状态机 v2.0
 *
 * 对接真实 PancakeSwap V3 ION/WBNB 池子数据。
 * 零 mock，所有价格来自 BSC 链上，所有交易通过 viem writeContract 执行。
 */

const ION_TOKEN = '0xe1ab61f7b093435204df32f5b3a405de55445ea8';
const WBNB_TOKEN = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const PANCAKE_V3_SWAP_ROUTER = '0x13f4EA83D0bd40E75C8222255bC855a974568Dd4';

export const useSwapState = () => {
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [priceImpact, setPriceImpact] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [slippage, setSlippage] = useState<number>(0.5);
  const [minReceived, setMinReceived] = useState<string>('0');

  // Subscribe to real-time pool data
  useEffect(() => {
    const unsubscribe = subscribePoolData((data) => {
      setPoolData(data);
    }, 15_000);
    return unsubscribe;
  }, []);

  const exchangeRate = poolData?.ionPrice ?? 0;
  const networkFee = '0.0003';

  const updateFromAmount = useCallback((value: string) => {
    if (!value || isNaN(Number(value))) {
      setFromAmount('');
      setToAmount('');
      setPriceImpact(0);
      setMinReceived('0');
      setValidationError(null);
      return;
    }

    const numericValue = Number(value);
    setFromAmount(value);

    if (numericValue <= 0) {
      setValidationError('交易金额必须大于零');
      setToAmount('');
      setMinReceived('0');
      return;
    }

    if (!poolData || poolData.ionPrice <= 0) {
      setValidationError('正在获取链上价格数据...');
      setToAmount('');
      setMinReceived('0');
      return;
    }

    setValidationError(null);

    const calculatedTarget = numericValue * exchangeRate;
    setToAmount(calculatedTarget.toFixed(4));

    const impact = poolData.reserveIon > 0
      ? (numericValue / poolData.reserveIon) * 100
      : 0;
    setPriceImpact(impact);

    const minOut = calculatedTarget * (1 - slippage / 100);
    setMinReceived(minOut.toFixed(4));
  }, [exchangeRate, poolData, slippage]);

  const executeSwapTransaction = useCallback(async () => {
    if (validationError || !fromAmount) return;

    // Check wallet availability
    if (!isWalletAvailable()) {
      setValidationError('请先连接 MetaMask 钱包');
      return;
    }

    const account = await getWalletAddress();
    if (!account) {
      setValidationError('请先连接钱包');
      return;
    }

    if (!poolData || poolData.ionPrice <= 0) {
      setValidationError('链上价格数据不可用');
      return;
    }

    setIsExecuting(true);
    setValidationError(null);

    try {
      const amountIn = BigInt(Math.floor(Number(fromAmount) * 1e18));
      const expectedOut = Number(fromAmount) * exchangeRate;
      const amountOutMin = BigInt(Math.floor(expectedOut * (1 - slippage / 100) * 1e18));

      // Approve SwapRouter to spend ION
      await approveToken(
        ION_TOKEN as `0x${string}`,
        PANCAKE_V3_SWAP_ROUTER as `0x${string}`,
        amountIn
      );

      // Execute swap via PancakeSwap V3 SwapRouter
      await executeSwap({
        tokenIn: ION_TOKEN as `0x${string}`,
        tokenOut: WBNB_TOKEN as `0x${string}`,
        fee: Math.round(poolData.fee * 1_000_000),
        recipient: account,
        amountIn,
        amountOutMin,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1800), // 30 min deadline
      });

      // Refresh pool data after swap
      const freshData = await fetchPoolData();
      setPoolData(freshData);

      setFromAmount('');
      setToAmount('');
      setPriceImpact(0);
      setMinReceived('0');
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || '链上交易失败';
      if (msg.includes('user rejected') || msg.includes('User rejected')) {
        setValidationError('用户取消了交易');
      } else if (msg.includes('insufficient')) {
        setValidationError('余额不足，请检查钱包余额');
      } else {
        setValidationError(`链上交易失败: ${msg}`);
      }
    } finally {
      setIsExecuting(false);
    }
  }, [validationError, fromAmount, poolData, exchangeRate, slippage]);

  return {
    fromAmount,
    toAmount,
    priceImpact,
    networkFee,
    isExecuting,
    validationError,
    exchangeRate,
    slippage,
    minReceived,
    poolData,
    updateFromAmount,
    executeSwapTransaction,
    setSlippage,
  };
};
