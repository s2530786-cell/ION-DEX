import React, { useState, useEffect, useCallback } from "react";
import { Panel, NeonInput, PageHeader, Icon, Loader } from "../components/kit";
import { api, fmt, fmtUsd } from "../lib/api";
import { useNavigate } from "react-router-dom";

const CATS = [
  { id: "all", label: "All" },
  { id: "trending", label: "🔥 Trending" },
  { id: "gainer", label: "Gainers" },
  { id: "loser", label: "Losers" },
  { id: "new", label: "New" },
  { id: "favorites", label: "★ Favorites" },
];

const mcapFmt = (n) => (n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : fmtUsd(n));

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favs, setFavs] = useState(() => JSON.parse(localStorage.getItem("ion-favs") || "[]"));

  const load = useCallback(() => {
    setLoading(true);
    const fetchCat = cat === "favorites" ? "all" : cat;
    api.market(fetchCat, q).then((d) => {
      setItems(cat === "favorites" ? d.filter((x) => favs.includes(x.symbol)) : d);
      setLoading(false);
    });
  }, [cat, q, favs]);

  useEffect(() => { load(); }, [load]);

  const toggleFav = (sym) => {
    const next = favs.includes(sym) ? favs.filter((s) => s !== sym) : [...favs, sym];
    setFavs(next);
    localStorage.setItem("ion-favs", JSON.stringify(next));
  };

  return (
    <div>
      <PageHeader title="Discover" subtitle="Explore trending tokens across ION, BSC and Ethereum — OKX-style market intelligence."
        right={<div style={{ width: 280 }}><NeonInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search token or symbol" style={{ height: 48, fontSize: 14 }} data-testid="market-search" /></div>} />

      <div className="flex gap-2 mb-5 flex-wrap">
        {CATS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className="chip" style={{ padding: "8px 16px", color: cat === c.id ? "var(--cyan)" : "var(--text-dim)", borderColor: cat === c.id ? "var(--cyan)" : "var(--panel-border)" }} data-testid={`cat-${c.id}`}>{c.label}</button>
        ))}
      </div>

      <Panel className="p-5 tbl-scroll">
        <div className="tbl-inner">
        <div className="grid gap-2 px-3 pb-3" style={{ gridTemplateColumns: "40px 1.6fr 1fr 1fr 1fr 1fr", color: "var(--text-dim)", fontSize: 12, borderBottom: "1px solid var(--panel-border)" }}>
          <span></span><span>Token</span><span className="text-right">Price</span><span className="text-right">24h</span><span className="text-right">Volume</span><span className="text-right">Market Cap</span>
        </div>
        {loading ? <Loader /> : items.length === 0 ? <div style={{ color: "var(--text-dim)", textAlign: "center", padding: "30px 0" }}>No tokens found</div> :
          items.map((t) => (
            <div key={t.symbol} className="grid gap-2 items-center px-3 py-3.5 panel-hover rounded-lg" style={{ gridTemplateColumns: "40px 1.6fr 1fr 1fr 1fr 1fr" }} data-testid={`market-row-${t.symbol}`}>
              <button onClick={() => toggleFav(t.symbol)} style={{ fontSize: 18, color: favs.includes(t.symbol) ? "var(--gold)" : "var(--text-dim)" }} data-testid={`fav-${t.symbol}`}>{favs.includes(t.symbol) ? "★" : "☆"}</button>
              <button onClick={() => navigate("/swap")} className="flex items-center gap-3 text-left">
                <Icon name={t.icon} size={32} />
                <div><div style={{ fontWeight: 600 }}>{t.symbol} <span className="chip" style={{ fontSize: 9, padding: "1px 6px", marginLeft: 4 }}>{t.chain}</span></div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>{t.name}</div></div>
              </button>
              <span className="mono text-right">{t.price < 0.01 ? `$${t.price}` : fmtUsd(t.price)}</span>
              <span className="mono text-right" style={{ color: t.change24h >= 0 ? "var(--green)" : "var(--red)" }}>{t.change24h >= 0 ? "+" : ""}{t.change24h}%</span>
              <span className="mono text-right" style={{ color: "var(--text-dim)" }}>{mcapFmt(t.volume)}</span>
              <span className="mono text-right" style={{ color: "var(--text-dim)" }}>{mcapFmt(t.mcap)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
