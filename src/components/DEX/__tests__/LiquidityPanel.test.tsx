import { describe, test, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLiquidityState } from '../../../hooks/useLiquidityState';

/**
 * ION Liquidity System Invariant Guardrails
 *
 * 通过严格数学期望比对，防止 AI 后续重构算法时
 * 破坏等值做市比例，杜绝套利漏洞。
 */

describe('ION Liquidity System Invariant Guardrails', () => {
  test('向流动性池单侧注入资产时，状态机必须强行计算并推导对侧资产，且不允许单方越界', () => {
    const { result } = renderHook(() => useLiquidityState());

    // 1. 验证正向等值做市比率跟随断言
    act(() => {
      result.current.updateIonAmount('100');
    });
    expect(result.current.errorMessage).toBeNull();
    // 100 ION × 7.3521 = 735.2100 USDT
    expect(result.current.usdtAmount).toBe('735.2100');
    expect(result.current.poolShare).toBeGreaterThan(0);
    expect(result.current.estLPTokens).toBeGreaterThan(0);

    // 2. 验证反向等值做市比率跟随断言
    act(() => {
      result.current.updateUsdtAmount('735.21');
    });
    expect(result.current.errorMessage).toBeNull();
    expect(Number(result.current.ionAmount)).toBeCloseTo(100, 2);

    // 3. 验证单侧资产爆仓越界熔断
    act(() => {
      result.current.updateIonAmount('999999');
    });
    expect(result.current.errorMessage).toBe('超出钱包 ION 最大可用余额');
    expect(result.current.poolShare).toBe(0);
    expect(result.current.estLPTokens).toBe(0);
  });
});
