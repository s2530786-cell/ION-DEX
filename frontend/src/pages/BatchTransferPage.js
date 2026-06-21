import React, { useState } from "react";
import { Panel, NeonButton, GhostButton, NeonInput, PageHeader, Icon } from "../components/kit";
import { api, fmt } from "../lib/api";
import { useWallet } from "../context/WalletContext";
import { toast } from "sonner";

export default function BatchTransferPage() {
  const { address, sendTx } = useWallet();
  const [token, setToken] = useState("ION");
  const [rows, setRows] = useState([{ to: "", amount: "" }]);

  const addRow = () => setRows([...rows, { to: "", amount: "" }]);
  const update = (i, k, v) => setRows(rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const remove = (i) => setRows(rows.filter((_, idx) => idx !== i));

  const parseCsv = (text) => {
    const parsed = text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const [to, amount] = l.split(/[,\s]+/);
      return { to: to || "", amount: amount || "" };
    });
    if (parsed.length) setRows(parsed);
  };

  const total = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const submit = async () => {
    const recipients = rows.filter((r) => r.to && r.amount).map((r) => ({ to: r.to, amount: parseFloat(r.amount) }));
    if (recipients.length === 0) { toast.error("Add at least one valid recipient"); return; }
    const r = await sendTx("Batch Transfer", () => api.batchTransfer({ address, token, recipients }));
    if (r) { setRows([{ to: "", amount: "" }]); toast.success(`Sent to ${recipients.length} recipients`); }
  };

  return (
    <div>
      <PageHeader title="Batch Transfer" subtitle="Send tokens to many addresses in one transaction. 0.1% fee in ION." />
      <div className="grid gap-6 resp-2" style={{ gridTemplateColumns: "1fr 320px" }}>
        <Panel className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Icon name="batch.svg" size={24} /><h3 className="h1" style={{ fontSize: 17 }}>Recipients</h3></div>
            <select value={token} onChange={(e) => setToken(e.target.value)} className="ghost-btn" style={{ height: 40 }} data-testid="batch-token">
              {["ION", "USDT", "BNB", "ETH"].map((t) => <option key={t} value={t} style={{ background: "#0a0a18" }}>{t}</option>)}
            </select>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2 mb-3" data-testid={`batch-row-${i}`}>
              <input value={r.to} onChange={(e) => update(i, "to", e.target.value)} placeholder="0x recipient address" className="neon-input" style={{ height: 48, flex: 2, fontSize: 13 }} data-testid={`batch-to-${i}`} />
              <input value={r.amount} onChange={(e) => update(i, "amount", e.target.value)} type="number" placeholder="Amount" className="neon-input" style={{ height: 48, flex: 1 }} data-testid={`batch-amount-${i}`} />
              <button onClick={() => remove(i)} className="ghost-btn" style={{ height: 48, width: 48, padding: 0 }}>✕</button>
            </div>
          ))}
          <GhostButton onClick={addRow} className="mt-1" data-testid="batch-add-row">+ Add Recipient</GhostButton>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-6">
            <h3 className="h1" style={{ fontSize: 16, marginBottom: 14 }}>Summary</h3>
            <div className="flex justify-between mb-2" style={{ fontSize: 13, color: "var(--text-dim)" }}><span>Recipients</span><span className="mono" style={{ color: "var(--text)" }}>{rows.filter((r) => r.to && r.amount).length}</span></div>
            <div className="flex justify-between mb-2" style={{ fontSize: 13, color: "var(--text-dim)" }}><span>Total</span><span className="mono" style={{ color: "var(--text)" }}>{fmt(total)} {token}</span></div>
            <div className="flex justify-between mb-5" style={{ fontSize: 13, color: "var(--text-dim)" }}><span>Fee (0.1%)</span><span className="mono" style={{ color: "var(--gold)" }}>{fmt(total * 0.001, 4)} ION</span></div>
            <NeonButton onClick={submit} data-testid="batch-submit">Send Batch</NeonButton>
          </Panel>
          <Panel className="p-5">
            <h4 style={{ fontSize: 13, marginBottom: 8, color: "var(--text-dim)" }}>Paste CSV (address, amount)</h4>
            <textarea onChange={(e) => parseCsv(e.target.value)} placeholder="0xabc..., 100&#10;0xdef..., 250" className="neon-input" style={{ height: 100, padding: 12, fontSize: 12, lineHeight: 1.5 }} data-testid="batch-csv" />
          </Panel>
        </div>
      </div>
    </div>
  );
}
