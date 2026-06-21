import React, { useState, useEffect } from "react";
import { Panel, NeonButton, NeonInput, PageHeader, StatValue, Icon, Risk, Loader } from "../components/kit";
import { api, fmt, fmtUsd } from "../lib/api";
import { useWallet } from "../context/WalletContext";

export default function VaultStakePage() {
  const { address, sendTx } = useWallet();
  const [data, setData] = useState(null);
  const [modal, setModal] = useState(null);
  const [amount, setAmount] = useState("");

  useEffect(() => { api.vaults().then(setData); }, []);
  const submit = async () => {
    const r = await sendTx("Vault Deposit", () => api.vaultDeposit({ address, vault_id: modal.id, amount: parseFloat(amount) || 0 }));
    if (r) { setModal(null); setAmount(""); }
  };

  if (!data) return <Loader />;

  return (
    <div>
      <PageHeader title="Yield Vaults" subtitle="Deposit into auto-managed vaults. Strategies optimize yield 24/7."
        right={<Panel className="px-6 py-4"><StatValue label="Total Vault TVL" value={fmtUsd(data.total_tvl)} size={36} aurora /></Panel>} />
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
        {data.vaults.map((v) => (
          <Panel key={v.id} hover className="p-6" data-testid={`vault-${v.id}`}>
            <div className="flex justify-between items-start mb-4"><Icon name="vault.svg" size={28} /><Risk level={v.risk} /></div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{v.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 16 }}>{v.strategy}</div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>APY</div><div className="mono aurora-text" style={{ fontSize: 24 }}>{v.apy}%</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>TVL</div><div className="mono" style={{ fontSize: 18 }}>{fmtUsd(v.tvl)}</div></div>
            </div>
            <NeonButton style={{ height: 42 }} onClick={() => setModal(v)} data-testid={`vault-deposit-${v.id}`}>Deposit</NeonButton>
          </Panel>
        ))}
      </div>

      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <Panel onClick={(e) => e.stopPropagation()} className="p-6 fade-up" style={{ width: 400 }} data-testid="vault-modal">
            <h3 className="h1 mb-1" style={{ fontSize: 19 }}>{modal.name}</h3>
            <p style={{ color: "var(--green)", marginBottom: 16 }}>{modal.apy}% APY</p>
            <NeonInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="mb-5" data-testid="vault-amount" />
            <NeonButton onClick={submit} data-testid="vault-confirm">Confirm Deposit</NeonButton>
          </Panel>
        </div>
      )}
    </div>
  );
}
