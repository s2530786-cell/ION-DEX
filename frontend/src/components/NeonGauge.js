import React from "react";

// Neon semicircular gauge (SVG) with aurora gradient stroke + glow.
export default function NeonGauge({ value = 0, max = 100, size = 150, label, sublabel, color = "var(--magenta)" }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r; // semicircle
  const dash = circumference * pct;

  return (
    <div style={{ position: "relative", width: size, height: size / 2 + 28 }} data-testid="neon-gauge">
      <svg width={size} height={size / 2 + 14} viewBox={`0 0 ${size} ${size / 2 + 14}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#00ffff" />
            <stop offset="0.5" stopColor="#6020ff" />
            <stop offset="1" stopColor="#ff00ff" />
          </linearGradient>
          <filter id="gaugeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={`M14 ${cy} A ${r} ${r} 0 0 1 ${size - 14} ${cy}`} fill="none" stroke="rgba(248,251,255,0.08)" strokeWidth="12" strokeLinecap="round" />
        <path
          d={`M14 ${cy} A ${r} ${r} 0 0 1 ${size - 14} ${cy}`}
          fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`} filter="url(#gaugeGlow)"
        />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, textAlign: "center" }}>
        <div className="stat-mono" style={{ fontSize: 22, color }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{sublabel}</div>}
      </div>
    </div>
  );
}
