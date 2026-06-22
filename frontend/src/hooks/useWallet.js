import React, { useState, useCallback, useMemo } from 'react';

// Global wallet state
let globalWalletState = {
  isConnected: false,
  address: '',
  chainId: '',
  balance: '0.00',
};

let walletSubscribers = [];

const notifySubscribers = () => {
  walletSubscribers.forEach(callback => callback(globalWalletState));
};

export function useWallet() {
  const [walletState, setWalletState] = useState(globalWalletState);

  // Subscribe to global wallet state changes
  React.useEffect(() => {
    const unsubscribe = () => {
      walletSubscribers = walletSubscribers.filter(cb => cb !== setWalletState);
    };
    walletSubscribers.push(setWalletState);
    return unsubscribe;
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        const chainId = await window.ethereum.request({ 
          method: 'eth_chainId' 
        });

        // Mock balance for ION native token
        const mockBalance = (Math.random() * 1000).toFixed(4);

        const newState = {
          isConnected: true,
          address: accounts[0],
          chainId: chainId,
          balance: mockBalance,
        };

        globalWalletState = newState;
        setWalletState(newState);
        notifySubscribers();
      } catch (error) {
        console.error('User rejected the request or connection failed:', error);
      }
    } else {
      alert('Please install a Web3 wallet like MetaMask to use ION DEX!');
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    const newState = {
      isConnected: false,
      address: '',
      chainId: '',
      balance: '0.00',
    };

    globalWalletState = newState;
    setWalletState(newState);
    notifySubscribers();
  }, []);

  // Format address: 0x1234...abcd
  const shortAddress = useMemo(() => {
    if (!walletState.address) return '';
    return `${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}`;
  }, [walletState.address]);

  return {
    wallet: walletState,
    shortAddress,
    connectWallet,
    disconnectWallet,
  };
}
