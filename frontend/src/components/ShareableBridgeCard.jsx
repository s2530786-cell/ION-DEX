import React, { forwardRef } from "react";

const Diamond = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 0 6px #00F5FF)" }}>
    <path d="M12 2 L22 9 L12 22 L2 9 Z" fill="none" stroke="#00F5FF" strokeWidth="1.8" />
    <path d="M2 9 H22 M12 2 V22 M7 9 L12 22 L17 9" fill="none" stroke="#00F5FF" strokeWidth="1" opacity="0.6" />
  </svg>
);

const Chain = ({ name, color }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
    <div style={{ width: 56, height: 56, borderRadius: "50%", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${color}66`, background: "rgba(255,255,255,0.04)" }}>
      <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: 15, color }}>{name.slice(0, 3).toUpperCase()}</span>
    </div>
    <span style={{ fontSize: 12, color: "#8A99AD" }}>{name}</span>
  </div>
);

const ShareableBridgeCard = forwardRef(({ from = "ION", to = "BSC" }, ref) => (
  <div ref={ref} style={{
    width: 620, height: 360, borderRadius: 24, position: "relative", overflow: "hidden", boxSizing: "border-box",
    padding: 28, color: "#fff", fontFamily: "'Sora', sans-serif",
    background: "linear-gradient(140deg, #0B1220 0%, #050811 100%)",
    border: "1px solid rgba(255,255,255,0.1)",
  }}>
    <div style={{ position: "absolute", top: -120, left: -80, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(58,134,255,0.22), transparent 70%)" }} />
    <div style={{ position: "absolute", bottom: -140, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(157,78,221,0.22), transparent 70%)" }} />

    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Diamond />
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: 2, color: "#00F5FF", textShadow: "0 0 12px rgba(0,245,255,0.6)" }}>ION DEX</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#3A86FF", border: "1px solid rgba(58,134,255,0.5)", borderRadius: 999, padding: "5px 12px", textShadow: "0 0 10px rgba(58,134,255,0.5)" }}>CROSS-CHAIN</span>
    </div>

    <div style={{ position: "relative", textAlign: "center", marginTop: 20 }}>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: 1, textShadow: "0 0 18px rgba(0,245,255,0.4)" }}>Bridge Assets in ~3 min</div>
    </div>

    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 30, marginTop: 26 }}>
      <Chain name="ION" color="#00F5FF" />
      <svg width="64" height="24" viewBox="0 0 64 24" style={{ filter: "drop-shadow(0 0 6px #9D4EDD)" }}>
        <path d="M2 12 H56 M48 5 L58 12 L48 19" fill="none" stroke="#9D4EDD" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <Chain name="BSC" color="#ffd166" />
      <svg width="64" height="24" viewBox="0 0 64 24" style={{ filter: "drop-shadow(0 0 6px #FF007A)" }}>
        <path d="M2 12 H56 M48 5 L58 12 L48 19" fill="none" stroke="#FF007A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <Chain name="ETH" color="#3A86FF" />
    </div>

    <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: 24, marginTop: 26, fontSize: 13 }}>
      <span style={{ color: "#00ff88" }}>● Low 0.1% fee</span>
      <span style={{ color: "#00F5FF" }}>● MEV protected</span>
      <span style={{ color: "#FF007A" }}>● Non-custodial</span>
    </div>

    <div style={{ position: "absolute", bottom: 16, left: 28, right: 28, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8A99AD", letterSpacing: 0.4 }}>
      <span>Fast & secure cross-chain on ION DEX</span>
      <span style={{ color: "#00F5FF" }}>iondex.app</span>
    </div>
  </div>
));

ShareableBridgeCard.displayName = "ShareableBridgeCard";
export default ShareableBridgeCard;
