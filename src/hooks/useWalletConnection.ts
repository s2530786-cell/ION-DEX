import { useState, useCallback, useEffect } from 'react';
import {
  detectProviders,
  connectWallet,
  disconnectWallet,
  onAccountsChanged,
  onChainChanged,
  getChainName,
  type WalletProviderKind,
  type WalletInfo,
} from '../lib/walletService';

/**
 * useWalletConnection — ION-DEX 钱包核心异步状态机 v2.0
 *
 * 对接真实 window.ethereum (MetaMask) 和 WalletConnect。
 * 零 mock，所有状态来自真实浏览器钱包。
 */

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
  providerKind: WalletProviderKind | null;
}

const BSC_CHAIN_ID = 56;

export const useWalletConnection = () => {
  const [wallet, setWallet] = useState<WalletState>({
    status: 'disconnected',
    address: null,
    balanceION: '0.00',
    networkName: null,
    errorLog: null,
    providerKind: null,
  });

  const [availableProviders, setAvailableProviders] = useState<WalletProviderKind[]>([]);

  // Detect available providers on mount
  useEffect(() => {
    setAvailableProviders(detectProviders());
  }, []);

  // Listen for account/chain changes from the real wallet
  useEffect(() => {
    const unsubAccounts = onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        setWallet({
          status: 'disconnected',
          address: null,
          balanceION: '0.00',
          networkName: null,
          errorLog: null,
          providerKind: null,
        });
      } else {
        setWallet((prev) => ({
          ...prev,
          address: accounts[0],
          status: 'connected',
        }));
      }
    });

    const unsubChain = onChainChanged((chainIdHex) => {
      const chainId = parseInt(chainIdHex, 16);
      if (chainId !== BSC_CHAIN_ID) {
        setWallet((prev) => ({
          ...prev,
          status: 'wrong_network',
          networkName: getChainName(chainId),
          errorLog: `检测到非 BSC 网络 (${getChainName(chainId)})，请切换到 BNB Smart Chain`,
        }));
      } else {
        setWallet((prev) => ({
          ...prev,
          status: 'connected',
          networkName: 'BNB Smart Chain',
          errorLog: null,
        }));
      }
    });

    return () => {
      unsubAccounts();
      unsubChain();
    };
  }, []);

  const doConnect = useCallback(async (kind: WalletProviderKind) => {
    setWallet((prev) => ({ ...prev, status: 'connecting', errorLog: null }));

    try {
      const info: WalletInfo = await connectWallet(kind);
      setWallet({
        status: 'connected',
        address: info.address,
        balanceION: info.balance,
        networkName: info.chainName,
        errorLog: null,
        providerKind: kind,
      });
    } catch (error: any) {
      setWallet({
        status: 'error',
        address: null,
        balanceION: '0.00',
        networkName: null,
        errorLog: error.message || '钱包连接失败',
        providerKind: null,
      });
    }
  }, []);

  const doDisconnect = useCallback(async () => {
    await disconnectWallet();
    setWallet({
      status: 'disconnected',
      address: null,
      balanceION: '0.00',
      networkName: null,
      errorLog: null,
      providerKind: null,
    });
  }, []);

  const switchBackToMainnet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    setWallet((prev) => ({ ...prev, status: 'connecting' }));

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }],
      });
      // Chain change event will update state automatically
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BNB Smart Chain',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/'],
            }],
          });
        } catch {
          setWallet((prev) => ({
            ...prev,
            status: 'error',
            errorLog: '无法添加 BSC 网络到钱包',
          }));
        }
      } else {
        setWallet((prev) => ({
          ...prev,
          status: 'error',
          errorLog: '切换网络失败，请在钱包中手动切换到 BNB Smart Chain',
        }));
      }
    }
  }, []);

  return {
    ...wallet,
    availableProviders,
    connectWallet: doConnect,
    disconnectWallet: doDisconnect,
    injectWrongNetworkSimulation: () => {
      // For dev/testing: simulate wrong network state
      setWallet((prev) => ({
        ...prev,
        status: 'wrong_network',
        networkName: 'Ethereum Mainnet',
        errorLog: '检测到非 BSC 网络，交易已挂起',
      }));
    },
    switchBackToMainnet,
    expectedChainId: 'bsc-mainnet-56',
  };
};
