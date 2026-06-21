import React, { useState, useEffect } from "react";
import { Panel, PageHeader, StatValue, Icon, Loader } from "../components/kit";
import DonutChart from "../components/DonutChart";
import { QRCodeSVG } from "qrcode.react";
import { Users, Copy as CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { api, fmt, fmtUsd, referralLink, short } from "../lib/api";
import { useWallet } from "../context/WalletContext";

export default function DashboardPage() {
  const { address } = useWallet();
  const [data, setData] = useState(null);
  const [ref, setRef] = useState(null);

  useEffect(() => { api.dashboard(address || "").then(setData); }, [address]);
  useEffect(() => { if (address) api.referralStats(address).then(setRef); else setRef(null); }, [address]);
  if (!data) return <Loader />;

  const burn = data.burn || {};
  const burnPct = Math.min((burn.day_burned / 500000) * 100, 100);
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(referralLink(address)); toast.success("邀请链接已复制"); }
    catch (e) { toast.error("复制失败"); }
  };

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
            {(burn.history || []).map((h) => {
              const max = Math.max(...(burn.history || []).map((x) => x.amount));
              return (
                <div key={h.day} className="flex-1 flex flex-col items-center justify-end" style={{ height: "100%" }}>
                  <div style={{ width: "100%", height: `${(h.amount / max) * 100}%`, background: "var(--aurora)", borderRadius: "6px 6px 0 0", boxShadow: "0 0 14px rgba(0,255,255,0.3)" }} title={fmt(h.amount)} />
                  <span style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 6 }}>{h.day}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel className="p-6 mt-6" data-testid="referral-panel">
        <div className="flex items-center gap-2 mb-5"><Users size={22} /><h3 className="h1" style={{ fontSize: 16 }}>邀请返佣 · Referral Rewards</h3></div>
        {!address ? (
          <div style={{ color: "var(--text-dim)", fontSize: 14 }}>连接钱包以获取你的专属邀请链接。好友通过你的链接进入并连接钱包后,其每笔交易手续费的 <span style={{ color: "var(--cyan)" }}>10%</span> 将自动返佣给你。</div>
        ) : (
          <div className="grid gap-6 resp-2" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>你的专属邀请链接</div>
              <div className="flex gap-2">
                <input readOnly value={referralLink(address)} onFocus={(e) => e.target.select()} className="ghost-btn flex-1" style={{ height: 46, fontSize: 12, justifyContent: "flex-start", fontFamily: "var(--font-mono)" }} data-testid="referral-link" />
                <button className="neon-btn flex items-center justify-center gap-2" style={{ width: 110, height: 46 }} onClick={copyLink} data-testid="referral-copy"><CopyIcon size={15} /> 复制</button>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div className="neon-stat-box">
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>邀请人数</div>
                  <div className="stat-mono" style={{ fontSize: 28, color: "var(--cyan)" }} data-testid="referral-count">{ref?.referral_count ?? 0}</div>
                </div>
                <div className="neon-stat-box">
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>累计返佣</div>
                  <div className="stat-mono" style={{ fontSize: 28, color: "var(--green)" }} data-testid="referral-rebate">{fmt(ref?.total_rebate || 0, 4)} <span style={{ fontSize: 13 }}>ION</span></div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 12 }}>
                返佣比例:好友手续费的 {ref?.rebate_rate ?? 10}%
                {ref?.referred_by ? <span> · 你由 <span className="mono" style={{ color: "var(--purple)" }}>{short(ref.referred_by)}</span> 推荐</span> : null}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div style={{ background: "#fff", padding: 8, borderRadius: 12, boxShadow: "0 0 20px rgba(0,245,255,0.25)" }}>
                <QRCodeSVG value={referralLink(address)} size={118} bgColor="#ffffff" fgColor="#050811" level="M" />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>邀请码 <span style={{ color: "var(--cyan)" }}>{address.slice(-6).toUpperCase()}</span></div>
            </div>
          </div>
        )}
        {address && ref?.referrals?.length > 0 && (
          <div className="mt-6">
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 4 }}>邀请记录</div>
            {ref.referrals.map((r) => (
              <div key={r.id} className="flex justify-between py-2" style={{ fontSize: 13, borderTop: "1px solid var(--panel-border)" }}>
                <span className="mono">{short(r.referee)}</span>
                <span className="mono" style={{ color: "var(--green)" }}>+{fmt(r.rebate || 0, 4)} ION</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
