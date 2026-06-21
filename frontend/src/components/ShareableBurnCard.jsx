import React, { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { fmt, referralLink } from "../lib/api";

const Diamond = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 0 6px #00F5FF)" }}>
    <path d="M12 2 L22 9 L12 22 L2 9 Z" fill="none" stroke="#00F5FF" strokeWidth="1.8" />
    <path d="M2 9 H22 M12 2 V22 M7 9 L12 22 L17 9" fill="none" stroke="#00F5FF" strokeWidth="1" opacity="0.6" />
  </svg>
);

const Sparkline = ({ data, width = 420 }) => {
  if (!data || data.length < 2) return null;
  const W = width, H = 64;
  const a = data.map((d) => d.amount);
  const mx = Math.max(...a), mn = Math.min(...a), sp = mx - mn || 1;
  const step = W / (data.length - 1);
  const pts = data.map((d, i) => [i * step, H - ((d.amount - mn) / sp) * (H - 12) - 6]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <defs>
        <linearGradient id="sbFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00F5FF" stopOpacity="0.4" />
          <stop offset="1" stopColor="#FF007A" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="sbStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#00F5FF" />
          <stop offset="1" stopColor="#FF007A" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sbFill)" />
      <path d={line} fill="none" stroke="url(#sbStroke)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Stat = ({ label, value, color }) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 11, color: "#8A99AD", letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", textShadow: `0 0 14px ${color}66`, marginTop: 2 }}>{value}</div>
  </div>
);

export const QrBlock = ({ address }) => {
  const code = address ? address.slice(-6).toUpperCase() : "DEMO";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{ background: "#fff", padding: 6, borderRadius: 10, boxShadow: "0 0 16px rgba(0,245,255,0.3)" }}>
        <QRCodeSVG value={referralLink(address)} size={66} bgColor="#ffffff" fgColor="#050811" level="M" />
      </div>
      <div style={{ fontSize: 9.5, color: "#8A99AD", letterSpacing: 0.5 }}>扫码加入 ION DEX</div>
      <div style={{ fontSize: 11, color: "#00F5FF", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>邀请码 {code}</div>
    </div>
  );
};

const ShareableBurnCard = forwardRef(({ burn, address }, ref) => (
  <div ref={ref} style={{
    width: 620, height: 360, borderRadius: 24, position: "relative", overflow: "hidden", boxSizing: "border-box",
    padding: 26, color: "#fff", fontFamily: "'Sora', sans-serif",
    background: "linear-gradient(140deg, #0B1220 0%, #050811 100%)",
    border: "1px solid rgba(255,255,255,0.1)",
  }}>
    <div style={{ position: "absolute", top: -120, left: -80, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,245,255,0.22), transparent 70%)" }} />
    <div style={{ position: "absolute", bottom: -140, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,0,122,0.22), transparent 70%)" }} />

    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Diamond />
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: 2, color: "#00F5FF", textShadow: "0 0 12px rgba(0,245,255,0.6)" }}>ION DEX</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#FF007A", border: "1px solid rgba(255,0,122,0.5)", borderRadius: 999, padding: "5px 12px", textShadow: "0 0 10px rgba(255,0,122,0.5)" }}>DEFLATIONARY</span>
    </div>

    <div style={{ position: "relative", marginTop: 18 }}>
      <div style={{ fontSize: 13, color: "#8A99AD", letterSpacing: 0.6 }}>Total ION Burned</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
        <span style={{ fontSize: 44, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#FF007A", lineHeight: 1, textShadow: "0 0 24px rgba(255,0,122,0.55)" }}>{burn ? fmt(burn.total_burned) : "—"}</span>
        <span style={{ fontSize: 16, color: "#8A99AD", fontWeight: 700 }}>ION</span>
      </div>
    </div>

    <div style={{ position: "relative", display: "flex", gap: 16, marginTop: 18 }}>
      <Stat label="Burned Today" value={burn ? `+${fmt(burn.day_burned)}` : "—"} color="#ffd166" />
      <Stat label="ION Price" value={burn ? `$${burn.ion_price}` : "—"} color="#00F5FF" />
      <Stat label="Dynamic Burn" value={burn ? `${burn.burn_rate}%` : "—"} color="#FF007A" />
    </div>

    <div style={{ position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginTop: 18 }}>
      <div style={{ flex: 1 }}>
        <Sparkline data={burn?.history || []} width={400} />
        <div style={{ fontSize: 11, color: "#8A99AD", letterSpacing: 0.4, marginTop: 8 }}>Deflationary by design — every swap burns ION · iondex.app</div>
      </div>
      <QrBlock address={address} />
    </div>
  </div>
));

ShareableBurnCard.displayName = "ShareableBurnCard";
export default ShareableBurnCard;
