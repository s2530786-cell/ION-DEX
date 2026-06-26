import { useState, useCallback, useEffect } from 'react';
import {
  connectIonWallet,
  disconnectIonWallet,
  isIonWalletInstalled,
  waitForIonWallet,
  onIonAccountsChanged,
  type IonWalletInfo,
} from '../lib/ionWalletService';

/**
 * useIonWallet — 官方 ION Wallet (原生链) 连接状态机
 *
 * 与 useWalletConnection (BSC EVM) 并存。
 * 实测坐实 (2026-06-26): window.ion + isOpenMask + ton_requestAccounts,
 * 地址为 TON/ION 原生格式 (EQ.../UQ...)。零 mock。
 */

export type IonWalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface IonWalletState {
  status: IonWalletStatus;
  address: string | null;
  isLocked: boolean;
  errorLog: string | null;
}

export const useIonWallet = () => {
  const [state, setState] = useState<IonWalletState>({
    status: 'disconnected',
    address: null,
    isLocked: false,
    errorLog: null,
  });

  const [installed, setInstalled] = useState(false);

  // 检测扩展是否注入 (注入可能滞后于页面加载)
  useEffect(() => {
    let active = true;
    waitForIonWallet(3000).then((p) => {
      if (active) setInstalled(p !== null);
    });
    return () => {
      active = false;
    };
  }, []);

  // 监听账户切换
  useEffect(() => {
    const unsub = onIonAccountsChanged((accounts) => {
      if (!accounts || accounts.length === 0) {
        setState({ status: 'disconnected', address: null, isLocked: false, errorLog: null });
      } else {
        setState((prev) => ({ ...prev, address: accounts[0], status: 'connected' }));
      }
    });
    return unsub;
  }, []);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'connecting', errorLog: null }));
    try {
      const info: IonWalletInfo = await connectIonWallet();
      setState({
        status: 'connected',
        address: info.address,
        isLocked: info.isLocked,
        errorLog: null,
      });
    } catch (error: any) {
      setState({
        status: 'error',
        address: null,
        isLocked: false,
        errorLog: error?.message || 'ION Wallet 连接失败',
      });
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectIonWallet();
    setState({ status: 'disconnected', address: null, isLocked: false, errorLog: null });
  }, []);

  return {
    ...state,
    installed,
    connect,
    disconnect,
  };
};
