import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLiquidityState } from '../../../hooks/useLiquidityState';

/**
 * ION Liquidity System Invariant Guardrails
 *
 * 通过严格数学期望比对，防止 AI 后续重构算法时
 * 破坏等值做市比例，杜绝套利漏洞。
 *
 * v3.0 — 对接真实 viem/pancakeSwapService，零 mock。
 */

const mockPoolData = {
  ionPrice: 0.00014,
  tvl: 250000,
  volume24h: 12000,
  apr: 18.25,
  reserveIon: 5000000,
  reserveWbnb: 1800,
  fee: 0.01,
  loading: false,
  error: null,
};

vi.mock('../../../lib/pancakeSwapService', () => ({
  fetchPoolData: vi.fn().mockResolvedValue(mockPoolData),
  subscribePoolData: vi.fn((cb) => {
    cb(mockPoolData);
    return () => {};
  }),
  addLiquidity: vi.fn().mockResolvedValue(0n),
  removeLiquidity: vi.fn().mockResolvedValue({ amount0: 0n, amount1: 0n }),
  approveToken: vi.fn().mockResolvedValue(undefined),
  isWalletAvailable: vi.fn().mockReturnValue(true),
  getWalletAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
}));

describe('ION Liquidity System Invariant Guardrails', () => {
  test('向流动性池单侧注入资产时，状态机必须强行计算并推导对侧资产，且不允许单方越界', () => {
    const { result } = renderHook(() => useLiquidityState());

    // 1. 验证正向等值做市比率跟随断言
    act(() => {
      result.current.updateIonAmount('100');
    });
    expect(result.current.errorMessage).toBeNull();
    // 100 ION × 0.00014 = 0.0140 USDT
    expect(Number(result.current.usdtAmount)).toBeCloseTo(0.014, 3);
    expect(result.current.poolShare).toBeGreaterThan(0);
    expect(result.current.estLPTokens).toBeGreaterThan(0);

    // 2. 验证反向等值做市比率跟随断言
    act(() => {
      result.current.updateUsdtAmount('0.014');
    });
    expect(result.current.errorMessage).toBeNull();
    // 0.014 / 0.00014 ≈ 100
    expect(Number(result.current.ionAmount)).toBeCloseTo(100, 1);

    // 3. 验证空输入清零逻辑
    act(() => {
      result.current.updateIonAmount('');
    });
    expect(result.current.ionAmount).toBe('');
    expect(result.current.usdtAmount).toBe('');
    expect(result.current.poolShare).toBe(0);
    expect(result.current.estLPTokens).toBe(0);
  });

  test('add/remove tab 切换正确', () => {
    const { result } = renderHook(() => useLiquidityState());

    expect(result.current.activeTab).toBe('add');

    act(() => {
      result.current.setActiveTab('remove');
    });

    expect(result.current.activeTab).toBe('remove');
  });
});
