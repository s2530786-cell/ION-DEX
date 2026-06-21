import React, { useState, useEffect } from "react";
import { Panel, NeonButton, PageHeader, Icon, Risk, Loader } from "../components/kit";
import { api, fmt, fmtUsd } from "../lib/api";
import { useWallet } from "../context/WalletContext";

export default function AiMarketPage() {
  const { address, sendTx } = useWallet();
  const [strategies, setStrategies] = useState([]);
  useEffect(() => { api.aiStrategies().then(setStrategies); }, []);

  const subscribe = (s) => sendTx(`Subscribe ${s.name}`, () => api.subStrategy({ address, tier: s.id }));

  return (
    <div>
      <PageHeader title="AI Strategy Market" subtitle="Subscribe to algorithmic strategies — yields auto-compounded in ION" />
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
        {strategies.length === 0 ? <Loader /> : strategies.map((s) => (
          <Panel key={s.id} hover className="p-6" data-testid={`strategy-${s.id}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2"><Icon name="ai.svg" size={28} /><div><div style={{ fontWeight: 700, fontSize: 17 }}>{s.name}</div><div style={{ fontSize: 12, color: "var(--text-dim)" }}>{s.type} Strategy</div></div></div>
              <Risk level={s.risk} />
            </div>
            <p style={{ fontSize: 13, color: "var(--text-dim)", minHeight: 38, marginBottom: 14 }}>{s.desc}</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>APY</div><div className="mono aurora-text" style={{ fontSize: 20 }}>{s.apy}%</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>TVL</div><div className="mono" style={{ fontSize: 15 }}>{fmtUsd(s.tvl)}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>Subs</div><div className="mono" style={{ fontSize: 15 }}>{fmt(s.subscribers)}</div></div>
            </div>
            <NeonButton style={{ height: 42 }} onClick={() => subscribe(s)} data-testid={`subscribe-${s.id}`}>Subscribe</NeonButton>
          </Panel>
        ))}
      </div>
    </div>
  );
}
