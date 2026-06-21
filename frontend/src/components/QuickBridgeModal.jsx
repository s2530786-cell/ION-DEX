import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import { NeonButton, NeonInput, Icon } from "./kit";
import { api } from "../lib/api";
import { useWallet } from "../context/WalletContext";

const CHAINS = [
  { id: "ION", name: "ION Chain" },
  { id: "BSC", name: "BNB Smart Chain" },
  { id: "ETH", name: "Ethereum" },
];

export default function QuickBridgeModal({ open, onClose }) {
  const { address, sendTx } = useWallet();
  const [from, setFrom] = useState("ION");
  const [to, setTo] = useState("BSC");
  const [token, setToken] = useState("ION");
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();

  const fee = amount ? (parseFloat(amount) * 0.001 + 0.5).toFixed(4) : "0.0";
  const received = amount ? Math.max(parseFloat(amount) - parseFloat(fee), 0).toFixed(4) : "0.0";

  const flip = () => { setFrom(to); setTo(from); };

  const submit = async () => {
    const r = await sendTx("Bridge", () => api.bridge({ address, from_chain: from, to_chain: to, token, amount: parseFloat(amount) || 0 }));
    if (r) { setAmount(""); onClose(); }
  };

  const ChainBox = ({ value, onChange, label, testid }) => (
    <div className="flex-1">
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="ghost-btn w-full" style={{ height: 52, justifyContent: "flex-start" }} data-testid={testid}>
        {CHAINS.map((c) => <option key={c.id} value={c.id} style={{ background: "#0a0a18" }}>{c.name}</option>)}
      </select>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Quick Bridge" icon="bridge.svg" width={640} testId="bridge-modal">
      <div className="flex items-center gap-3">
        <ChainBox value={from} onChange={setFrom} label="Source" testid="qbridge-source" />
        <button onClick={flip} className="ghost-btn spin-arrow mt-5" style={{ width: 44, height: 44, padding: 0 }} data-testid="qbridge-flip"><Icon name="swap.svg" size={18} /></button>
        <ChainBox value={to} onChange={setTo} label="Target" testid="qbridge-target" />
      </div>

      <div className="mt-5 flex gap-3">
        <div style={{ width: 140 }}>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>Token</div>
          <select value={token} onChange={(e) => setToken(e.target.value)} className="ghost-btn w-full" style={{ height: 52, justifyContent: "flex-start" }} data-testid="qbridge-token">
            {["ION", "USDT", "BNB", "ETH"].map((t) => <option key={t} value={t} style={{ background: "#0a0a18" }}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>Amount</div>
          <NeonInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" data-testid="qbridge-amount" />
        </div>
      </div>

      <div className="mt-5 space-y-2" style={{ fontSize: 13, color: "var(--text-dim)" }}>
        <div className="flex justify-between"><span>Bridge Fee</span><span className="mono" style={{ color: "var(--gold)" }}>{fee} {token}</span></div>
        <div className="flex justify-between"><span>You Receive</span><span className="mono" style={{ color: "var(--green)" }}>{received} {token}</span></div>
        <div className="flex justify-between"><span>Est. Time</span><span style={{ color: "var(--text)" }}>~3 min</span></div>
      </div>

      <NeonButton className="mt-5" onClick={submit} disabled={!amount || from === to} data-testid="qbridge-submit">Transfer</NeonButton>
      <button className="ghost-btn w-full mt-3" style={{ height: 44 }} onClick={() => { onClose(); navigate("/bridge"); }} data-testid="qbridge-full">
        完整跨链页(含历史记录)→
      </button>
    </Modal>
  );
}
