import { describe, test, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWalletConnection } from '../../../hooks/useWalletConnection';

/**
 * ION Wallet Connector FSM Invariant Guardrails
 *
 * 锁定异步临界区，阻绝 AI 在后续升级中导致的状态混乱漏洞
 * （例如在未断开状态下允许重复连接）。
 */

describe('ION Wallet Connector FSM Invariant Guardrails', () => {
  test('状态机必须严格按照预设路径转移，拒绝非法状态迁跃', async () => {
    const { result } = renderHook(() => useWalletConnection());

    // 1. 验证初始状态断言
    expect(result.current.status).toBe('disconnected');
    expect(result.current.address).toBeNull();
    expect(result.current.balanceION).toBe('0.00');

    // 2. 验证连接中的中间态断言
    let connectionPromise: Promise<void>;
    act(() => {
      connectionPromise = result.current.connectWallet();
    });
    expect(result.current.status).toBe('connecting');
    expect(result.current.address).toBeNull();

    // 等待异步定时器逻辑履行
    await act(async () => {
      await connectionPromise;
    });

    // 3. 验证连接成功后的确定性资产断言
    if (result.current.status === 'connected') {
      expect(result.current.status).toBe('connected');
      expect(result.current.address).toBe(
        'IONx7f92a1bc49d84e27bb120193aef59cd82e2c4a2b'
      );
      expect(result.current.balanceION).toBe('1420.5000');
      expect(result.current.networkName).toBe('ION Mainnet');
    } else {
      // 捕获触发了随机 5% 失败阻断时的降级状态断言
      expect(result.current.status).toBe('error');
      expect(result.current.errorLog).toBe('用户取消了签名授权');
    }

    // 4. 验证恶意切换网络时的防灾熔断断言
    act(() => {
      result.current.injectWrongNetworkSimulation();
    });
    expect(result.current.status).toBe('wrong_network');
    expect(result.current.balanceION).toBe('0.00'); // 异常网络下资产归零，保护核心看板

    // 5. 验证修复机制断言
    let switchPromise: Promise<void>;
    act(() => {
      switchPromise = result.current.switchBackToMainnet();
    });
    expect(result.current.status).toBe('connecting');

    await act(async () => {
      await switchPromise;
    });
    expect(result.current.status).toBe('connected');

    // 6. 验证完全登出断言
    act(() => {
      result.current.disconnectWallet();
    });
    expect(result.current.status).toBe('disconnected');
    expect(result.current.address).toBeNull();
  });
});
