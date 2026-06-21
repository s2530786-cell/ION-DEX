import React, { useState, useEffect } from "react";
import { Panel, NeonButton, PageHeader, Icon, Loader } from "../components/kit";
import { api, fmt, fmtUsd } from "../lib/api";
import { toast } from "sonner";

export default function BusinessPages() {
  const [modules, setModules] = useState([]);
  useEffect(() => { api.business().then(setModules); }, []);

  return (
    <div>
      <PageHeader title="Business Ecosystem" subtitle="Real-world commerce settled on-chain in ION. Each module burns fees & funds staking." />
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {modules.length === 0 ? <Loader /> : modules.map((m) => (
          <Panel key={m.id} hover className="p-6" data-testid={`business-${m.id}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="panel" style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16 }}><Icon name={m.icon} size={30} /></div>
              <div><div style={{ fontWeight: 700, fontSize: 17 }}>{m.name}</div><div style={{ fontSize: 12, color: "var(--text-dim)" }}>{fmt(m.merchants)} merchants</div></div>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-dim)", minHeight: 40, marginBottom: 14 }}>{m.desc}</p>
            <div className="flex justify-between mb-5" style={{ fontSize: 13 }}><span style={{ color: "var(--text-dim)" }}>Volume</span><span className="mono aurora-text">{fmtUsd(m.volume)}</span></div>
            <NeonButton style={{ height: 42 }} onClick={() => toast.info(`${m.name} module`, { description: "Entry portal — connect your merchant account" })} data-testid={`enter-${m.id}`}>Enter Module</NeonButton>
          </Panel>
        ))}
      </div>
    </div>
  );
}
