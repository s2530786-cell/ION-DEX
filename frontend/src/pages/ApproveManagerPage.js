import React, { useState, useEffect } from "react";
import { Panel, GhostButton, PageHeader, Icon, Risk, Loader } from "../components/kit";
import { api } from "../lib/api";
import { useWallet } from "../context/WalletContext";

export default function ApproveManagerPage() {
  const { address, sendTx } = useWallet();
  const [items, setItems] = useState([]);

  const load = () => api.approvals(address || "demo").then(setItems);
  useEffect(() => { load(); }, [address]);

  const revoke = async (a) => {
    const r = await sendTx(`Revoke ${a.token}`, () => api.revoke({ id: a.id }));
    if (r) setItems(items.filter((x) => x.id !== a.id));
  };

  return (
    <div>
      <PageHeader title="Approval Manager" subtitle="Review and revoke token allowances to protect your wallet." />
      <Panel className="p-5">
        <div className="grid gap-2 px-3 pb-3" style={{ gridTemplateColumns: "1fr 1.4fr 1fr 0.8fr 0.8fr", color: "var(--text-dim)", fontSize: 12, borderBottom: "1px solid var(--panel-border)" }}>
          <span>Token</span><span>Spender</span><span className="text-right">Allowance</span><span className="text-right">Risk</span><span className="text-right">Action</span>
        </div>
        {items.length === 0 ? <Loader /> : items.map((a) => (
          <div key={a.id} className="grid gap-2 items-center px-3 py-4" style={{ gridTemplateColumns: "1fr 1.4fr 1fr 0.8fr 0.8fr", borderBottom: "1px solid rgba(248,251,255,0.04)" }} data-testid={`approval-${a.id}`}>
            <div className="flex items-center gap-2"><Icon name={`${a.token.toLowerCase()}.svg`} size={26} /><span style={{ fontWeight: 600 }}>{a.token}</span></div>
            <div><div style={{ fontSize: 13 }}>{a.spender}</div><div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>{a.spender_addr}</div></div>
            <span className="mono text-right" style={{ color: a.amount === "Unlimited" ? "var(--red)" : "var(--text)" }}>{a.amount}</span>
            <div className="text-right"><Risk level={a.risk} /></div>
            <div className="text-right"><GhostButton style={{ height: 36, padding: "0 14px" }} onClick={() => revoke(a)} data-testid={`revoke-${a.id}`}>Revoke</GhostButton></div>
          </div>
        ))}
      </Panel>
    </div>
  );
}
