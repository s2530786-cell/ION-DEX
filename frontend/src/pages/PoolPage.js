import React, { useState, useEffect } from "react";
import { Panel, NeonButton, GhostButton, NeonInput, PageHeader, StatValue, Icon, Loader } from "../components/kit";
import { api, fmt, fmtUsd } from "../lib/api";
import { useWallet } from "../context/WalletContext";

export default function PoolPage() {
  const { address, sendTx } = useWallet();
  const [data, setData] = useState(null);
  const [modal, setModal] = useState(null);
  const [amtA, setAmtA] = useState("");
  const [amtB, setAmtB] = useState("");

  const load = () => api.pools().then(setData);
  useEffect(() => { load(); }, []);

  const submit = async () => {
    const r = await sendTx("Add Liquidity", () => api.addLiquidity({ address, pool_id: modal.id, amount_a: parseFloat(amtA) || 0, amount_b: parseFloat(amtB) || 0 }));
    if (r) { setModal(null); setAmtA(""); setAmtB(""); load(); }
  };

  if (!data) return <Loader />;

  return (
    <div>
      <PageHeader title="Liquidity Pools" subtitle="Provide liquidity and earn 0.1% trading fees per swap"
        right={<Panel className="px-6 py-4"><StatValue label="Total Value Locked" value={fmtUsd(data.total_tvl)} size={40} aurora /></Panel>} />

      <Panel className="p-5 tbl-scroll">
        <div className="tbl-inner">
        <div className="grid gap-2 px-3 pb-3" style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr 0.8fr", color: "var(--text-dim)", fontSize: 12, borderBottom: "1px solid var(--panel-border)" }}>
          <span>Pool</span><span className="text-right">TVL</span><span className="text-right">Volume 24h</span><span className="text-right">APR</span><span className="text-right">Action</span>
        </div>
        {data.pools.map((p) => (
          <div key={p.id} className="grid gap-2 items-center px-3 py-4" style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr 0.8fr", borderBottom: "1px solid rgba(248,251,255,0.04)" }} data-testid={`pool-${p.id}`}>
            <div className="flex items-center gap-2"><Icon name={`${p.token_a.toLowerCase()}.svg`} size={26} /><Icon name={`${p.token_b.toLowerCase()}.svg`} size={26} style={{ marginLeft: -10 }} /><span style={{ fontWeight: 600 }}>{p.pair}</span></div>
            <span className="mono text-right">{fmtUsd(p.tvl)}</span>
            <span className="mono text-right" style={{ color: "var(--text-dim)" }}>{fmtUsd(p.volume24h)}</span>
            <span className="mono text-right" style={{ color: "var(--green)" }}>{p.apr}%</span>
            <div className="text-right"><GhostButton style={{ height: 38, padding: "0 14px" }} onClick={() => setModal(p)} data-testid={`add-liq-${p.id}`}>+ Add</GhostButton></div>
          </div>
        ))}
        </div>
      </Panel>

      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <Panel onClick={(e) => e.stopPropagation()} className="p-6 fade-up" style={{ width: 420 }} data-testid="add-liq-modal">
            <div className="flex justify-between items-center mb-5"><h3 className="h1" style={{ fontSize: 20 }}>Add Liquidity · {modal.pair}</h3><button onClick={() => setModal(null)} style={{ color: "var(--text-dim)" }}>✕</button></div>
            <label style={{ fontSize: 12, color: "var(--text-dim)" }}>{modal.token_a} Amount</label>
            <NeonInput type="number" value={amtA} onChange={(e) => setAmtA(e.target.value)} placeholder="0.0" className="mb-4 mt-1" data-testid="liq-amount-a" />
            <label style={{ fontSize: 12, color: "var(--text-dim)" }}>{modal.token_b} Amount</label>
            <NeonInput type="number" value={amtB} onChange={(e) => setAmtB(e.target.value)} placeholder="0.0" className="mb-5 mt-1" data-testid="liq-amount-b" />
            <div className="flex justify-between mb-4" style={{ fontSize: 13, color: "var(--text-dim)" }}><span>Pool APR</span><span style={{ color: "var(--green)" }}>{modal.apr}%</span></div>
            <NeonButton onClick={submit} data-testid="liq-submit">Confirm Add Liquidity</NeonButton>
          </Panel>
        </div>
      )}
    </div>
  );
}
