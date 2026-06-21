import React, { useState, useEffect } from "react";
import { Panel, NeonButton, PageHeader, Icon, Loader } from "../components/kit";
import { api } from "../lib/api";
import { useWallet } from "../context/WalletContext";

export default function AiSubscriptionPage() {
  const { address, sendTx } = useWallet();
  const [tiers, setTiers] = useState([]);
  useEffect(() => { api.subTiers().then(setTiers); }, []);

  const subscribe = (t) => sendTx(`Subscribe ${t.name}`, () => api.subscribe({ address, tier: t.id }));
  const accent = { free: "var(--cyan)", pro: "var(--purple)", enterprise: "var(--magenta)" };

  return (
    <div>
      <PageHeader title="AI Subscription" subtitle="Unlock advanced AI features. Subscription fees: 50% burned, 50% to staking pool." />
      <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", maxWidth: 1100 }}>
        {tiers.length === 0 ? <Loader /> : tiers.map((t) => (
          <Panel key={t.id} hover className="p-7" style={{ borderColor: t.id === "pro" ? "rgba(96,32,255,0.5)" : undefined }} data-testid={`tier-${t.id}`}>
            <div className="flex items-center gap-2 mb-2"><Icon name="sub.svg" size={26} /><h3 className="h1" style={{ fontSize: 20, color: accent[t.id] }}>{t.name}</h3></div>
            <div className="mb-6"><span className="stat-mono" style={{ fontSize: 40 }}>{t.price_ion}</span><span style={{ color: "var(--text-dim)" }}> ION{t.id !== "free" ? "/mo" : ""}</span></div>
            <div className="space-y-3 mb-7">
              {t.features.map((f) => (
                <div key={f} className="flex items-center gap-2" style={{ fontSize: 14 }}><Icon name="approve.svg" size={18} /><span>{f}</span></div>
              ))}
            </div>
            <NeonButton onClick={() => subscribe(t)} data-testid={`sub-${t.id}`}>{t.price_ion === 0 ? "Get Started" : `Subscribe · ${t.price_ion} ION`}</NeonButton>
          </Panel>
        ))}
      </div>
    </div>
  );
}
