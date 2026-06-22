import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { Icon } from "./kit";
import { short } from "../lib/api";
import SkinSwitcher from "./SkinSwitcher";
import WalletButton from "./WalletButton";

const PRIMARY = [
  { to: "/swap", label: "Swap" },
  { to: "/pool", label: "Pool" },
  { to: "/stake", label: "Stake" },
  { to: "/bridge", label: "Bridge" },
];

const MORE = [
  { to: "/portfolio", label: "Portfolio" },
  { to: "/discover", label: "Discover" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/trade-pro", label: "Trade Pro" },
  { to: "/ai-market", label: "AI Market" },
  { to: "/copy-trade", label: "Copy Trade" },
  { to: "/subscription", label: "Subscription" },
  { to: "/liquidity-mine", label: "Liquidity Mine" },
  { to: "/vault", label: "Vault" },
  { to: "/domains", label: "Domains" },
  { to: "/batch-transfer", label: "Batch Transfer" },
  { to: "/business", label: "Business" },
  { to: "/approvals", label: "Approvals" },
  { to: "/settings", label: "Settings" },
];

export default function TopNav() {
  const { address, connect, disconnect, connecting } = useWallet();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();

  const linkStyle = ({ isActive }) => ({
    color: isActive ? "var(--cyan)" : "var(--text-dim)",
    fontWeight: isActive ? 700 : 500,
    transition: "color 300ms var(--ease)",
    textShadow: isActive ? "0 0 12px rgba(0,255,255,0.5)" : "none",
  });

  return (
    <nav className="panel nav-flat" style={{ height: 64, borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none" }}>
      <div className="mx-auto flex items-center justify-between h-full px-5" style={{ maxWidth: 1600 }}>
        <div className="flex items-center gap-8">
          <button onClick={() => navigate("/swap")} className="flex items-center gap-2" data-testid="logo-btn">
            <img src="/assets/icons/brand-logo.png" alt="ION DEX" height={42} style={{ height: 42, width: "auto", borderRadius: 10 }} />
            <span className="aurora-text" style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>ION DEX</span>
          </button>
          <div className="hidden lg:flex items-center gap-6">
            {PRIMARY.map((l) => (
              <NavLink key={l.to} to={l.to} style={linkStyle} data-testid={`nav-${l.label.toLowerCase()}`}>{l.label}</NavLink>
            ))}
            <div className="relative" onMouseLeave={() => setMenu(false)}>
              <button onMouseEnter={() => setMenu(true)} onClick={() => setMenu(!menu)} style={{ color: "var(--text-dim)", fontWeight: 500 }} data-testid="nav-more">More ▾</button>
              {menu && (
                <div className="panel absolute mt-3 p-2" style={{ width: 200, zIndex: 50 }}>
                  {MORE.map((l) => (
                    <NavLink key={l.to} to={l.to} onClick={() => setMenu(false)}
                      className="block px-3 py-2 rounded-lg" style={{ color: "var(--text-dim)" }}
                      data-testid={`more-${l.to.slice(1)}`}>{l.label}</NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="lg:hidden ghost-btn" style={{ height: 40, padding: "0 12px" }} onClick={() => setOpen(!open)} data-testid="mobile-menu">☰</button>
          <SkinSwitcher />
          <WalletButton />
        </div>
      </div>

      {open && (
        <div className="lg:hidden panel p-3 mx-3 mt-2" style={{ position: "relative", zIndex: 40 }}>
          {[...PRIMARY, ...MORE].map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="block px-3 py-2" style={{ color: "var(--text-dim)" }}>{l.label}</NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
