import React, { useState, useEffect } from "react";
import { Panel, NeonButton, NeonInput, PageHeader, Icon, Loader } from "../components/kit";
import { api, fmt } from "../lib/api";
import { useWallet } from "../context/WalletContext";

const CHAINS = [
  { id: "ION", name: "ION Chain", icon: "logo.svg" },
  { id: "BSC", name: "BNB Smart Chain", icon: "bnb.svg" },
  { id: "ETH", name: "Ethereum", icon: "eth.svg" },
];

export default function BridgePage() {
  const { address, sendTx } = useWallet();
  const [from, setFrom] = useState("ION");
  const [to, setTo] = useState("BSC");
  const [token, setToken] = useState("ION");
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState([]);

  const load = () => { if (address) api.bridgeHistory(address).then(setHistory); };
  useEffect(() => { load(); }, [address]);

  const fee = amount ? (parseFloat(amount) * 0.001 + 0.5).toFixed(4) : "0.0";
  const received = amount ? Math.max(parseFloat(amount) - parseFloat(fee), 0).toFixed(4) : "0.0";

  const flip = () => { setFrom(to); setTo(from); };
  const submit = async () => {
    const r = await sendTx("Bridge", () => api.bridge({ address, from_chain: from, to_chain: to, token, amount: parseFloat(amount) || 0 }));
    if (r) { setAmount(""); load(); }
  };

  const ChainBox = ({ value, onChange, label }) => (
    <div className="flex-1">
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="ghost-btn w-full" style={{ height: 56, justifyContent: "flex-start" }} data-testid={`bridge-${label.toLowerCase()}`}>
        {CHAINS.map((c) => <option key={c.id} value={c.id} style={{ background: "#0a0a18" }}>{c.name}</option>)}
      </select>
    </div>
  );

  return (
    <div>
      <PageHeader title="Cross-Chain Bridge" subtitle="Move assets between ION Chain, BSC and Ethereum securely." />
      <div className="grid gap-6 resp-2" style={{ gridTemplateColumns: "minmax(380px, 480px) 1fr" }}>
        <Panel className="p-6">
          <div className="flex items-center gap-3">
            <ChainBox value={from} onChange={setFrom} label="Source" />
            <button onClick={flip} className="ghost-btn spin-arrow mt-5" style={{ width: 44, height: 44, padding: 0 }} data-testid="bridge-flip"><Icon name="swap.svg" size={18} /></button>
            <ChainBox value={to} onChange={setTo} label="Target" />
          </div>

          <div className="mt-5">
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>Token</div>
            <select value={token} onChange={(e) => setToken(e.target.value)} className="ghost-btn w-full mb-4" style={{ height: 48, justifyContent: "flex-start" }} data-testid="bridge-token">
              {["ION", "USDT", "BNB", "ETH"].map((t) => <option key={t} value={t} style={{ background: "#0a0a18" }}>{t}</option>)}
            </select>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>Amount</div>
            <NeonInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" data-testid="bridge-amount" />
          </div>

          <div className="mt-5 space-y-2" style={{ fontSize: 13, color: "var(--text-dim)" }}>
            <div className="flex justify-between"><span>Bridge Fee</span><span className="mono" style={{ color: "var(--gold)" }}>{fee} {token}</span></div>
            <div className="flex justify-between"><span>You Receive</span><span className="mono" style={{ color: "var(--green)" }}>{received} {token}</span></div>
            <div className="flex justify-between"><span>Est. Time</span><span style={{ color: "var(--text)" }}>~3 min</span></div>
          </div>
          <NeonButton className="mt-5" onClick={submit} disabled={!amount || from === to} data-testid="bridge-submit">Transfer</NeonButton>
        </Panel>

        <Panel className="p-5">
          <h3 className="h1" style={{ fontSize: 16, marginBottom: 14 }}>Transaction History</h3>
          {history.length === 0 ? <div style={{ color: "var(--text-dim)", textAlign: "center", padding: "20px 0" }}>{address ? "No bridge transactions" : "Connect wallet"}</div> :
            history.map((h) => (
              <div key={h.id} className="flex justify-between items-center py-3" style={{ borderBottom: "1px solid rgba(248,251,255,0.05)" }} data-testid={`bridge-hist-${h.id}`}>
                <div><div style={{ fontSize: 13 }}>{h.from_chain} → {h.to_chain}</div><div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>{h.tx_hash.slice(0, 16)}...</div></div>
                <div className="text-right"><div className="mono">{fmt(h.amount)} {h.token}</div><div style={{ fontSize: 12, color: "var(--green)" }}>{h.status}</div></div>
              </div>
            ))}
        </Panel>
      </div>
    </div>
  );
}
