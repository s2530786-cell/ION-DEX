import React, { useState, useEffect } from "react";
import { Panel, NeonButton, GhostButton, PageHeader, Icon, Loader } from "../components/kit";
import { api, fmt, fmtUsd } from "../lib/api";
import { useWallet } from "../context/WalletContext";

export default function LiquidityMinePage() {
  const { address, sendTx } = useWallet();
  const [pools, setPools] = useState([]);
  useEffect(() => { api.lmPools().then(setPools); }, []);

  const stake = (p) => sendTx(`Stake LP ${p.pair}`, () => api.addLiquidity({ address, pool_id: p.id, amount_a: 0, amount_b: 0 }));
  const compound = (p) => sendTx(`Compound ${p.pair}`, () => Promise.resolve({ tx_hash: "0x" + Math.random().toString(16).slice(2) }));

  return (
    <div>
      <PageHeader title="Liquidity Mining" subtitle="Stake LP tokens, earn ION rewards, auto-compound for max yield." />
      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
        {pools.length === 0 ? <Loader /> : pools.map((p) => (
          <Panel key={p.id} hover className="p-6" data-testid={`lm-${p.id}`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2"><Icon name="mine.svg" size={26} /><span style={{ fontWeight: 700, fontSize: 17 }}>{p.pair}</span></div>
              <span className="chip" style={{ color: "var(--gold)" }}>{p.multiplier}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>APR</div><div className="mono aurora-text" style={{ fontSize: 24 }}>{p.apr}%</div></div>
              <div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>TVL</div><div className="mono" style={{ fontSize: 18 }}>{fmtUsd(p.tvl)}</div></div>
            </div>
            <div className="flex justify-between mb-4" style={{ fontSize: 13, color: "var(--text-dim)" }}><span>Pending Reward</span><span className="mono" style={{ color: "var(--gold)" }}>0.00 {p.reward_token}</span></div>
            <div className="flex gap-2">
              <NeonButton style={{ height: 42 }} onClick={() => stake(p)} data-testid={`lm-stake-${p.id}`}>Stake LP</NeonButton>
              <GhostButton style={{ height: 42, flex: 1 }} onClick={() => compound(p)} data-testid={`lm-compound-${p.id}`}>Compound</GhostButton>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
