import React from "react";
import { useNavigate } from "react-router-dom";

const TILES = [
  { to: "/pool", label: "Pool", sub: "Liquidity", gem: "gem_pool.png", color: "#00ffd0" },
  { to: "/copy-trade", label: "Copy Trade", sub: "Mirror pros", gem: "gem_copy.png", color: "#8a4dff" },
  { to: "/bridge", label: "Bridge", sub: "Cross-chain", gem: "gem_bridge.png", color: "#22d3ff" },
  { to: "/dashboard", label: "Burn", sub: "Deflation", gem: "gem_burn.png", color: "#ff4fd8" },
  { to: "/domains", label: "Domain", sub: "ION Identity", gem: "gem_domain.png", color: "#ff2ec4" },
];

export default function QuickTiles() {
  const navigate = useNavigate();
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(5, 1fr)" }} data-testid="quick-tiles">
      {TILES.map((t) => (
        <button key={t.to} onClick={() => navigate(t.to)} className="neon-tile text-left" style={{ "--tile-color": t.color }} data-testid={`tile-${t.label.toLowerCase().replace(" ", "-")}`}>
          <span className="tile-glow" />
          <div className="flex flex-col items-center" style={{ position: "relative", zIndex: 1 }}>
            <img src={`/assets/icons/${t.gem}`} alt={t.label} width={96} height={96} className="gem-float" style={{ width: 96, height: 96, objectFit: "contain", filter: `drop-shadow(0 10px 22px ${t.color})` }} />
            <div className="mt-2" style={{ fontWeight: 700, fontSize: 16 }}>{t.label}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{t.sub}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
