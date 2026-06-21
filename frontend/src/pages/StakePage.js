import React, { useState, useEffect, useCallback } from "react";
import { Panel, NeonButton, NeonInput, PageHeader, StatValue, Icon, Risk, Loader } from "../components/kit";
import { api, fmt } from "../lib/api";
import { useWallet } from "../context/WalletContext";

export default function StakePage() {
  const { address, sendTx } = useWallet();
  const [products, setProducts] = useState([]);
  const [positions, setPositions] = useState(null);
  const [modal, setModal] = useState(null);
  const [amount, setAmount] = useState("");

  const loadPos = useCallback(() => { if (address) api.stakePositions(address).then(setPositions); }, [address]);
  useEffect(() => { api.stakeProducts().then(setProducts); }, []);
  useEffect(() => { loadPos(); }, [loadPos]);

  const submit = async () => {
    const r = await sendTx("Stake", () => api.stake({ address, product_id: modal.id, amount: parseFloat(amount) || 0 }));
    if (r) { setModal(null); setAmount(""); loadPos(); }
  };

  const riskFor = (apy) => (apy <= 10 ? "Low" : apy <= 15 ? "Medium" : "High");

  return (
    <div>
      <PageHeader title="Stake ION" subtitle="Lock ION across 6 tiers — earn up to 30% APY. Rewards paid in ION."
        right={positions && <Panel className="px-6 py-4"><StatValue label="Your Total Staked" value={`${fmt(positions.total_staked)} ION`} size={32} aurora /></Panel>} />

      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {products.map((p) => (
          <Panel key={p.id} hover className="p-5" data-testid={`stake-product-${p.id}`}>
            <div className="flex justify-between items-start mb-4"><Icon name="stake.svg" size={28} /><Risk level={riskFor(p.apy)} /></div>
            <div className="stat-mono aurora-text" style={{ fontSize: 36 }}>{p.apy}%</div>
            <div style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 12 }}>APY · {p.name}</div>
            <div className="flex justify-between mb-1" style={{ fontSize: 13, color: "var(--text-dim)" }}><span>Lock</span><span style={{ color: "var(--text)" }}>{p.lock_days === 0 ? "Flexible" : `${p.lock_days} days`}</span></div>
            <div className="flex justify-between mb-4" style={{ fontSize: 13, color: "var(--text-dim)" }}><span>Min</span><span className="mono" style={{ color: "var(--text)" }}>{p.min} ION</span></div>
            <NeonButton style={{ height: 42 }} onClick={() => setModal(p)} data-testid={`stake-btn-${p.id}`}>Stake</NeonButton>
          </Panel>
        ))}
      </div>

      <Panel className="p-5">
        <h3 className="h1" style={{ fontSize: 16, marginBottom: 14 }}>Your Stake History</h3>
        {!positions || positions.positions.length === 0 ? (
          <div style={{ color: "var(--text-dim)", padding: "20px 0", textAlign: "center" }}>{address ? "No active stakes yet" : "Connect wallet to view stakes"}</div>
        ) : (
          <>
            <div className="grid gap-2 px-2 pb-2" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", color: "var(--text-dim)", fontSize: 12, borderBottom: "1px solid var(--panel-border)" }}>
              <span>Product</span><span className="text-right">Amount</span><span className="text-right">APY</span><span className="text-right">Est. Reward</span><span className="text-right">Status</span>
            </div>
            {positions.positions.map((s) => (
              <div key={s.id} className="grid gap-2 px-2 py-3" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", fontSize: 13 }}>
                <span>{s.product}</span><span className="mono text-right">{fmt(s.amount)}</span>
                <span className="mono text-right" style={{ color: "var(--green)" }}>{s.apy}%</span>
                <span className="mono text-right" style={{ color: "var(--gold)" }}>{fmt(s.est_reward, 2)}</span>
                <span className="text-right" style={{ color: "var(--cyan)" }}>{s.status}</span>
              </div>
            ))}
          </>
        )}
      </Panel>

      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <Panel onClick={(e) => e.stopPropagation()} className="p-6 fade-up" style={{ width: 400 }} data-testid="stake-modal">
            <h3 className="h1 mb-1" style={{ fontSize: 20 }}>Stake · {modal.name}</h3>
            <p style={{ color: "var(--green)", marginBottom: 16 }}>{modal.apy}% APY · {modal.lock_days === 0 ? "Flexible" : `${modal.lock_days} day lock`}</p>
            <NeonInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Min ${modal.min} ION`} className="mb-5" data-testid="stake-amount" />
            <NeonButton onClick={submit} data-testid="stake-confirm">Confirm Stake</NeonButton>
          </Panel>
        </div>
      )}
    </div>
  );
}
