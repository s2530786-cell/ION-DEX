import React, { useState, useEffect } from "react";
import { Panel, NeonButton, NeonInput, PageHeader, Icon, Loader } from "../components/kit";
import { api, fmt, fmtUsd } from "../lib/api";
import { useWallet } from "../context/WalletContext";

export default function CopyTradePage() {
  const { address, sendTx } = useWallet();
  const [traders, setTraders] = useState([]);
  const [modal, setModal] = useState(null);
  const [alloc, setAlloc] = useState("");

  useEffect(() => { api.traders().then(setTraders); }, []);
  const submit = async () => {
    const r = await sendTx("Copy Trade", () => api.copytrade({ address, trader_id: modal.id, allocation: parseFloat(alloc) || 0 }));
    if (r) { setModal(null); setAlloc(""); }
  };

  return (
    <div>
      <PageHeader title="Copy Trading" subtitle="Mirror top traders automatically. Performance fee burned in ION." />
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {traders.length === 0 ? <Loader /> : traders.map((t) => (
          <Panel key={t.id} hover className="p-6" data-testid={`trader-${t.id}`}>
            <div className="flex items-center gap-3 mb-4">
              <Icon name={t.avatar} size={52} />
              <div><div style={{ fontWeight: 700, fontSize: 17 }}>{t.name}</div><div style={{ fontSize: 12, color: "var(--text-dim)" }}>{fmt(t.followers)} followers</div></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>30d ROI</div><div className="mono" style={{ fontSize: 20, color: "var(--green)" }}>+{t.roi30d}%</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>Win Rate</div><div className="mono" style={{ fontSize: 18 }}>{t.winrate}%</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>AUM</div><div className="mono" style={{ fontSize: 15 }}>{fmtUsd(t.aum)}</div></div>
            </div>
            <NeonButton style={{ height: 42 }} onClick={() => setModal(t)} data-testid={`copy-${t.id}`}>Copy Trader</NeonButton>
          </Panel>
        ))}
      </div>

      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <Panel onClick={(e) => e.stopPropagation()} className="p-6 fade-up" style={{ width: 400 }} data-testid="copy-modal">
            <div className="flex items-center gap-3 mb-5"><Icon name={modal.avatar} size={44} /><h3 className="h1" style={{ fontSize: 20 }}>Copy {modal.name}</h3></div>
            <label style={{ fontSize: 12, color: "var(--text-dim)" }}>Allocation (ION)</label>
            <NeonInput type="number" value={alloc} onChange={(e) => setAlloc(e.target.value)} placeholder="0.0" className="mb-3 mt-1" data-testid="copy-alloc" />
            <div className="flex justify-between mb-5" style={{ fontSize: 13, color: "var(--text-dim)" }}><span>Performance Fee</span><span style={{ color: "var(--gold)" }}>10% (50% burned)</span></div>
            <NeonButton onClick={submit} data-testid="copy-confirm">Start Copying</NeonButton>
          </Panel>
        </div>
      )}
    </div>
  );
}
