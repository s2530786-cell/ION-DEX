import React from "react";
import { useNavigate } from "react-router-dom";

const TILES = [
  { to: "/pool", label: "Pool", sub: "Liquidity", gem: "gem_pool.png", color: "#00ffd0" },
  { to: "/copy-trade", label: "Copy Trade", sub: "Mirror pros", gem: "gem_copy.png", color: "#9d5cff" },
  { to: "/bridge", label: "Bridge", sub: "Cross-chain", gem: "gem_bridge.png", color: "#e24dff" },
  { to: "/dashboard", label: "Burn", sub: "Deflation", gem: "gem_burn.png", color: "#4db8ff" },
  { to: "/domains", label: "Domain", sub: "ION Identity", gem: "gem_domain.png", color: "#ff2ec4" },
];

export default function QuickTiles() {
  const navigate = useNavigate();
  return (
    <div className="crystal-tiles" data-testid="quick-tiles">
      {TILES.map((t) => (
        <button
          key={t.to}
          onClick={() => navigate(t.to)}
          className="crystal-tile"
          style={{ "--c": t.color }}
          data-testid={`tile-${t.label.toLowerCase().replace(" ", "-")}`}
        >
          <span className="ct-topglow" />
          <div className="ct-gem-wrap">
            <img src={`/assets/icons/${t.gem}`} alt={t.label} className="ct-gem" loading="lazy" />
            <span className="ct-gem-shadow" />
          </div>
          <div className="ct-title">{t.label}</div>
          <div className="ct-sub">{t.sub}</div>
        </button>
      ))}
    </div>
  );
}
