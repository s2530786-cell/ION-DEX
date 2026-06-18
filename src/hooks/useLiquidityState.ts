import { useState } from 'react';

/**
 * useLiquidityState — ION-DEX 流动性精算与边界防御引擎
 *
 * 严格遵循自动做市商公式进行双端强行重置（等值校准，
 * 任何非对等输入自动被状态机平抑），内置资金池份额比例衰减公式。
 * 生产环境替换链上合约交互。
 */

export const useLiquidityState = () => {
  const [ionAmount, setIonAmount] = useState<string>('');
  const [usdtAmount, setUsdtAmount] = useState<string>('');
  const [poolShare, setPoolShare] = useState<number>(0);
  const [estLPTokens, setEstLPTokens] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 链上资金池静态契约参数
  const MARKET_PRICE_ION_TO_USDT = 7.3521;
  const WALLET_BALANCE_ION = 1420.5;
  const WALLET_BALANCE_USDT = 10000.0;

  // 模拟当前链上已存在的池子总流动性规模基数
  const EXISTING_POOL_RESERVE_ION = 50000.0;

  /**
   * 纯数学逻辑核验：依据初始比例，保持单侧资产变动时，
   * 对侧资产的 1:1 等值跟随更新
   */
  const calculateCounterpart = (amount: string, isIon: boolean) => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setIonAmount('');
      setUsdtAmount('');
      setPoolShare(0);
      setEstLPTokens(0);
      setErrorMessage(null);
      return;
    }

    const numericAmount = Number(amount);

    let currentIon = isIon
      ? numericAmount
      : numericAmount / MARKET_PRICE_ION_TO_USDT;
    let currentUsdt = isIon
      ? numericAmount * MARKET_PRICE_ION_TO_USDT
      : numericAmount;

    if (isIon) {
      setIonAmount(amount);
      setUsdtAmount(currentUsdt.toFixed(4));
    } else {
      setUsdtAmount(amount);
      setIonAmount(currentIon.toFixed(4));
    }

    // 边界安全栅栏 1：单侧超额熔断
    if (currentIon > WALLET_BALANCE_ION) {
      setErrorMessage('超出钱包 ION 最大可用余额');
      setPoolShare(0);
      setEstLPTokens(0);
      return;
    }

    // 边界安全栅栏 2：双侧对冲余额校验
    if (currentUsdt > WALLET_BALANCE_USDT) {
      setErrorMessage('超出钱包 USDT 最大可用余额');
      setPoolShare(0);
      setEstLPTokens(0);
      return;
    }

    setErrorMessage(null);

    // 计算精算流动性占比与 LP 凭证发放量
    // 资金池占比公式: Share = (ΔION / (Reserve_ION + ΔION)) × 100%
    const calculatedShare =
      (currentIon / (EXISTING_POOL_RESERVE_ION + currentIon)) * 100;
    setPoolShare(calculatedShare);

    // LP 凭证开方几何平均估算: LP = √(ΔION · ΔUSDT)
    const mintedLP = Math.sqrt(currentIon * currentUsdt);
    setEstLPTokens(mintedLP);
  };

  const updateIonAmount = (val: string) => calculateCounterpart(val, true);
  const updateUsdtAmount = (val: string) => calculateCounterpart(val, false);

  const executeAddLiquidity = async () => {
    if (errorMessage || !ionAmount || !usdtAmount) return;
    setIsProcessing(true);
    try {
      // 桥接底层契约仿真时延
      await new Promise((resolve) => setTimeout(resolve, 2500));
      setIonAmount('');
      setUsdtAmount('');
      setPoolShare(0);
      setEstLPTokens(0);
    } catch (err) {
      setErrorMessage('节点同步错误，注入链上资产失败');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    ionAmount,
    usdtAmount,
    poolShare,
    estLPTokens,
    isProcessing,
    errorMessage,
    updateIonAmount,
    updateUsdtAmount,
    executeAddLiquidity,
  };
};
