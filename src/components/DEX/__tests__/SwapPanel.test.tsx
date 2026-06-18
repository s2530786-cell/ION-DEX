import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwapState } from '../../../hooks/useSwapState';

/**
 * ION Swap System Logic Engine Guardrails
 *
 * 通过单元断言锁死状态机逻辑，
 * 预防 AI 在之后改动时导致越界漏洞。
 */

describe('ION Swap System Logic Engine Guardrails', () => {
  test('输入越界数值时，自动纠错状态机应立即锁定并抛出风险警告', () => {
    const { result } = renderHook(() => useSwapState());

    // 测试正常合法注入逻辑
    act(() => {
      result.current.updateFromAmount('100');
    });
    expect(result.current.validationError).toBeNull();
    expect(Number(result.current.toAmount)).toBeGreaterThan(0);

    // 测试爆仓金额非法输入拦截
    act(() => {
      result.current.updateFromAmount('9999999');
    });
    expect(result.current.validationError).toBe('超出钱包可用额度');
    expect(result.current.toAmount).toBe('');
  });
});
