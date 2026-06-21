import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const WalletContext = createContext(null);
export const useWallet = () => useContext(WalletContext);

const DEMO_ADDRESS = "0x8ff2e1210434495c4f5629bd9d8bd4965a67b84c";

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const hasMetaMask = typeof window !== "undefined" && window.ethereum;

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      if (hasMetaMask) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const cid = await window.ethereum.request({ method: "eth_chainId" });
        setAddress(accounts[0]);
        setChainId(cid);
        toast.success("Wallet connected", { description: `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}` });
      } else {
        setAddress(DEMO_ADDRESS);
        setChainId("0x38");
        toast.info("Demo wallet connected", { description: "Install MetaMask for real on-chain access" });
      }
    } catch (e) {
      toast.error("Connection rejected");
    } finally {
      setConnecting(false);
    }
  }, [hasMetaMask]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    toast.message("Wallet disconnected");
  }, []);

  useEffect(() => {
    if (!hasMetaMask) return;
    const onAccounts = (accs) => setAddress(accs[0] || null);
    const onChain = (cid) => setChainId(cid);
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccounts);
      window.ethereum.removeListener("chainChanged", onChain);
    };
  }, [hasMetaMask]);

  // Simulated tx confirmation flow
  const sendTx = useCallback(async (label, fn) => {
    if (!address) {
      toast.error("Connect wallet first");
      return null;
    }
    const id = toast.loading(`${label} pending...`);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const res = await fn();
      toast.success(`${label} confirmed`, { id, description: res?.tx_hash ? `${res.tx_hash.slice(0, 12)}...` : "Success" });
      return res;
    } catch (e) {
      toast.error(`${label} failed`, { id, description: e?.response?.data?.detail || "Transaction reverted" });
      return null;
    }
  }, [address]);

  return (
    <WalletContext.Provider value={{ address, chainId, connect, disconnect, connecting, sendTx, hasMetaMask, demo: DEMO_ADDRESS }}>
      {children}
    </WalletContext.Provider>
  );
}
