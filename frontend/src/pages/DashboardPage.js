import React, { useState, useEffect } from "react";
import { Panel, PageHeader, StatValue, Icon, Loader } from "../components/kit";
import DonutChart from "../components/DonutChart";
import { api, fmt, fmtUsd } from "../lib/api";
import { useWallet } from "../context/WalletContext";

export default function DashboardPage() {
  const { address } = useWallet();
  const [data, setData] = useState(null);

  useEffect(() => { api.dashboard(address || "").then(setData); }, [address]);
  if (!data) return <Loader />;

  const burn = data.burn || {};
  const burnPct = Math.min((burn.day_burned / 500000) * 100, 100);

  return (
    <div>
      <PageHeader title="Portfolio Dashboard" subtitle="Your on-chain wealth at a glance" />

      <Panel className="p-8 mb-6">
        <div style={{ color: "var(--text-dim)", fontSize: 13 }}>Total Asset Value</div>
        <div className="stat-mono aurora-text" style={{ fontSize: 56, lineHeight: 1.1 }}>{fmtUsd(data.total_value)}</div>
        <div style={{ color: "var(--green)", marginTop: 6 }}>+{data.pnl24h}% · +{fmtUsd(data.pnl_value)} (24h)</div>
      </Panel>

      <div className="grid gap-6 resp-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <Panel className="p-6 flex flex-col items-center">
          <h3 className="h1 self-start" style={{ fontSize: 16, marginBottom: 16 }}>Asset Distribution</h3>
          <DonutChart data={data.distribution.map((d) => ({ label: d.asset, value: d.value, color: d.color }))} centerValue={fmtUsd(data.total_value)} centerLabel="Total" />
          <div className="w-full mt-5 space-y-2">
            {data.distribution.map((d) => (
              <div key={d.asset} className="flex justify-between items-center" style={{ fontSize: 13 }}>
                <span className="flex items-center gap-2"><span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, display: "inline-block" }} />{d.asset}</span>
                <span className="mono">{fmtUsd(d.value)} · {d.pct}%</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center gap-2 mb-5"><Icon name="burn.svg" size={24} /><h3 className="h1" style={{ fontSize: 16 }}>Burn Statistics</h3></div>
          <StatValue label="Total Burned" value={`${fmt(burn.total_burned)} ION`} size={28} color="var(--red)" />
          <div className="my-5">
            <div className="flex justify-between mb-2" style={{ fontSize: 12, color: "var(--text-dim)" }}><span>Today Burned</span><span className="mono" style={{ color: "var(--gold)" }}>{fmt(burn.day_burned)} ION</span></div>
            <div style={{ height: 12, background: "var(--input-bg)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: `${burnPct}%`, height: "100%", background: "linear-gradient(90deg,#ff4466,#ff00ff)", boxShadow: "0 0 16px rgba(255,0,255,0.5)" }} />
            </div>
          </div>
          <div className="flex justify-between" style={{ fontSize: 13 }}>
            <span style={{ color: "var(--text-dim)" }}>Market Phase</span>
            <span style={{ color: burn.market_phase === "bull" ? "var(--green)" : "var(--red)", textTransform: "capitalize" }}>{burn.market_phase} · burn {burn.burn_rate}%</span>
          </div>
        </Panel>

        <Panel className="p-6">
          <h3 className="h1" style={{ fontSize: 16, marginBottom: 16 }}>7-Day Burn Trend</h3>
          <div className="flex items-end gap-2" style={{ height: 200 }}>
            {(burn.history || []).map((h, i) => {
              const max = Math.max(...(burn.history || []).map((x) => x.amount));
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end" style={{ height: "100%" }}>
                  <div style={{ width: "100%", height: `${(h.amount / max) * 100}%`, background: "var(--aurora)", borderRadius: "6px 6px 0 0", boxShadow: "0 0 14px rgba(0,255,255,0.3)" }} title={fmt(h.amount)} />
                  <span style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 6 }}>{h.day}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
