import React from "react";
import { fmt } from "../lib/api";

// Neon area chart (SVG) with cyan→magenta vertical gradient fill + glowing stroke.
export default function NeonAreaChart({ data = [], height = 220, testId = "neon-area-chart" }) {
  if (!data || data.length === 0) return null;
  const W = 712;
  const H = height;
  const padX = 14;
  const padT = 16;
  const padB = 30;
  const amounts = data.map((d) => d.amount);
  const max = Math.max(...amounts);
  const min = Math.min(...amounts);
  const span = max - min || 1;
  const step = data.length > 1 ? (W - padX * 2) / (data.length - 1) : 0;
  const x = (i) => padX + i * step;
  const y = (v) => padT + (1 - (v - min) / span) * (H - padT - padB);
  const pts = data.map((d, i) => [x(i), y(d.amount)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${x(data.length - 1).toFixed(1)} ${H - padB} L ${x(0).toFixed(1)} ${H - padB} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" data-testid={testId} style={{ display: "block" }}>
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00F5FF" stopOpacity="0.45" />
          <stop offset="0.55" stopColor="#9D4EDD" stopOpacity="0.22" />
          <stop offset="1" stopColor="#FF007A" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="areaStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#00F5FF" />
          <stop offset="1" stopColor="#FF007A" />
        </linearGradient>
        <filter id="areaGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={padX} x2={W - padX} y1={padT + (H - padT - padB) * g} y2={padT + (H - padT - padB) * g}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
      ))}

      <path d={area} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke="url(#areaStroke)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" filter="url(#areaGlow)" />

      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="4" fill="#0B1220" stroke="#00F5FF" strokeWidth="2" filter="url(#areaGlow)" />
          <text x={p[0]} y={H - 10} textAnchor="middle" fontSize="11" fill="#8A99AD" fontFamily="'JetBrains Mono', monospace">{data[i].day}</text>
        </g>
      ))}
      <text x={padX} y={padT + 4} fontSize="10" fill="#8A99AD" fontFamily="'JetBrains Mono', monospace">{fmt(max)}</text>
    </svg>
  );
}
