import React, { useState, useEffect, useCallback } from "react";
import { Panel, NeonButton, NeonInput, PageHeader, Icon, Loader } from "../components/kit";
import { api, fmt } from "../lib/api";
import { useWallet } from "../context/WalletContext";

export default function DomainManagePage() {
  const { address, sendTx } = useWallet();
  const [name, setName] = useState("");
  const [years, setYears] = useState(1);
  const [domains, setDomains] = useState([]);

  const load = useCallback(() => { if (address) api.domains(address).then(setDomains); }, [address]);
  useEffect(() => { load(); }, [load]);

  const register = async () => {
    const clean = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!clean) return;
    const r = await sendTx("Register Domain", () => api.registerDomain({ address, name: clean, years }));
    if (r) { setName(""); load(); }
  };

  return (
    <div>
      <PageHeader title="ION Identity" subtitle="Register your .ion domain name. 50% of registration fee is burned." />
      <div className="grid gap-6 resp-2" style={{ gridTemplateColumns: "minmax(360px, 460px) 1fr" }}>
        <Panel className="p-6">
          <div className="flex items-center gap-2 mb-5"><Icon name="domain.svg" size={24} /><h3 className="h1" style={{ fontSize: 17 }}>Register Domain</h3></div>
          <div className="flex items-center gap-2 mb-4">
            <NeonInput value={name} onChange={(e) => setName(e.target.value)} placeholder="yourname" data-testid="domain-name" />
            <span className="mono" style={{ fontSize: 18, color: "var(--cyan)" }}>.ion</span>
          </div>
          <label style={{ fontSize: 12, color: "var(--text-dim)" }}>Registration Period</label>
          <div className="flex gap-2 my-2 mb-4">
            {[1, 2, 3, 5].map((y) => (
              <button key={y} onClick={() => setYears(y)} className="chip" style={{ color: years === y ? "var(--cyan)" : "var(--text-dim)" }} data-testid={`years-${y}`}>{y} yr</button>
            ))}
          </div>
          <div className="flex justify-between mb-1" style={{ fontSize: 13, color: "var(--text-dim)" }}><span>Fee</span><span className="mono" style={{ color: "var(--gold)" }}>{years * 5} ION</span></div>
          <div className="flex justify-between mb-5" style={{ fontSize: 13, color: "var(--text-dim)" }}><span>Burned</span><span className="mono" style={{ color: "var(--red)" }}>{years * 2.5} ION</span></div>
          <NeonButton onClick={register} disabled={!name.trim()} data-testid="domain-register">Register</NeonButton>
        </Panel>

        <Panel className="p-6">
          <h3 className="h1" style={{ fontSize: 17, marginBottom: 14 }}>Your Domains</h3>
          {domains.length === 0 ? <div style={{ color: "var(--text-dim)", textAlign: "center", padding: "20px 0" }}>{address ? "No domains registered" : "Connect wallet"}</div> :
            domains.map((d) => (
              <div key={d.id} className="flex justify-between items-center py-3" style={{ borderBottom: "1px solid rgba(248,251,255,0.05)" }} data-testid={`domain-${d.id}`}>
                <span className="mono aurora-text" style={{ fontSize: 17 }}>{d.name}</span>
                <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{d.years} yr · {d.fee_ion} ION</span>
              </div>
            ))}
        </Panel>
      </div>
    </div>
  );
}
