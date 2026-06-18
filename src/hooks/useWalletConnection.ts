import { useState, useCallback } from 'react';

/**
 * useWalletConnection — ION-DEX 钱包核心异步状态机
 *
 * 严格的有限状态机（FSM）设计，全面覆盖连接、断开、网络切换及链上异常捕获。
 * 生产环境替换真实 RPC 节点交互。
 */

// 定义明确的钱包生命周期状态类型
export type WalletStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'wrong_network'
  | 'error';

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  balanceION: string;
  networkName: string | null;
  errorLog: string | null;
}

export const useWalletConnection = () => {
  const [wallet, setWallet] = useState<WalletState>({
    status: 'disconnected',
    address: null,
    balanceION: '0.00',
    networkName: null,
    errorLog: null,
  });

  const EXPECTED_CHAIN_ID = 'ion-mainnet-1';
  const MOCK_TARGET_ADDRESS =
    'IONx7f92a1bc49d84e27bb120193aef59cd82e2c4a2b';

  /**
   * 触发异步连接逻辑，内置超时与中断机制
   */
  const connectWallet = useCallback(async () => {
    setWallet((prev) => ({ ...prev, status: 'connecting', errorLog: null }));

    try {
      // 模拟底层 RPC 节点握手与用户签名授权时延
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 1500);
        // 模拟 5% 的链上节点拒绝率，用于触发容错防御
        if (Math.random() < 0.05) {
          clearTimeout(timer);
          reject(new Error('USER_REJECTED_SIGNATURE'));
        }
      });

      // 模拟成功获取链上快照
      setWallet({
        status: 'connected',
        address: MOCK_TARGET_ADDRESS,
        balanceION: '1420.5000',
        networkName: 'ION Mainnet',
        errorLog: null,
      });
    } catch (error: any) {
      setWallet({
        status: 'error',
        address: null,
        balanceION: '0.00',
        networkName: null,
        errorLog:
          error.message === 'USER_REJECTED_SIGNATURE'
            ? '用户取消了签名授权'
            : '远程 RPC 节点未响应',
      });
    }
  }, []);

  /**
   * 模拟异常网络切换（如用户切换到以太坊或测试网），触发防灾熔断
   */
  const injectWrongNetworkSimulation = useCallback(() => {
    setWallet({
      status: 'wrong_network',
      address: MOCK_TARGET_ADDRESS,
      balanceION: '0.00',
      networkName: 'Unknown Testnet',
      errorLog: '检测到非官方允许的区块链网络，交易已强制挂起',
    });
  }, []);

  /**
   * 修复网络：将网络切回官方 ION 主网
   */
  const switchBackToMainnet = useCallback(async () => {
    setWallet((prev) => ({ ...prev, status: 'connecting' }));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setWallet({
      status: 'connected',
      address: MOCK_TARGET_ADDRESS,
      balanceION: '1420.5000',
      networkName: 'ION Mainnet',
      errorLog: null,
    });
  }, []);

  /**
   * 彻底清空上下文，安全断开连接
   */
  const disconnectWallet = useCallback(() => {
    setWallet({
      status: 'disconnected',
      address: null,
      balanceION: '0.00',
      networkName: null,
      errorLog: null,
    });
  }, []);

  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
    injectWrongNetworkSimulation,
    switchBackToMainnet,
    expectedChainId: EXPECTED_CHAIN_ID,
  };
};
