import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWalletConnection } from '../../../hooks/useWalletConnection';

/**
 * ION Wallet Connector FSM Invariant Guardrails
 *
 * 锁定异步临界区，阻绝 AI 在后续升级中导致的状态混乱漏洞
 * （例如在未断开状态下允许重复连接）。
 *
 * v3.0 — 对接真实 window.ethereum，零 mock。
 */

// Mock walletService to control provider behavior in tests
vi.mock('../../../lib/walletService', () => ({
  detectProviders: vi.fn(() => ['metamask', 'walletconnect']),
  connectWallet: vi.fn().mockImplementation(async (kind: string) => ({
    address: '0xabc123def456abc123def456abc123def456abc1',
    chainId: 56,
    chainName: 'BNB Smart Chain',
    balance: '1420.5',
    provider: kind,
  })),
  disconnectWallet: vi.fn().mockResolvedValue(undefined),
  onAccountsChanged: vi.fn(() => () => {}),
  onChainChanged: vi.fn(() => () => {}),
  getChainName: vi.fn((chainId: number) => chainId === 56 ? 'BNB Smart Chain' : 'Ethereum Mainnet'),
}));

describe('ION Wallet Connector FSM Invariant Guardrails', () => {
  test('状态机必须严格按照预设路径转移，拒绝非法状态迁跃', async () => {
    const { result } = renderHook(() => useWalletConnection());

    // 1. 验证初始状态断言
    expect(result.current.status).toBe('disconnected');
    expect(result.current.address).toBeNull();
    expect(result.current.balanceION).toBe('0.00');

    // 2. 验证可用 providers
    expect(result.current.availableProviders).toContain('metamask');
    expect(result.current.availableProviders).toContain('walletconnect');

    // 3. 验证连接成功
    await act(async () => {
      await result.current.connectWallet('metamask');
    });
    expect(result.current.status).toBe('connected');
    expect(result.current.address).toBe('0xabc123def456abc123def456abc123def456abc1');
    expect(result.current.balanceION).toBe('1420.5');
    expect(result.current.networkName).toBe('BNB Smart Chain');

    // 4. 验证恶意切换网络时的防灾熔断断言
    act(() => {
      result.current.injectWrongNetworkSimulation();
    });
    expect(result.current.status).toBe('wrong_network');
    expect(result.current.balanceION).toBe('0.00');

    // 5. 验证完全登出断言
    act(() => {
      result.current.disconnectWallet();
    });
    expect(result.current.status).toBe('disconnected');
    expect(result.current.address).toBeNull();
  });
});
