import React, { useState, useEffect } from "react";
import { Panel, NeonButton, GhostButton, NeonInput, Icon, Loader } from "../components/kit";
import TradingViewChart from "../components/TradingViewChart";
import { api, fmt } from "../lib/api";
import { useWallet } from "../context/WalletContext";

export default function TradeProPage() {
  const { address, sendTx } = useWallet();
  const [book, setBook] = useState(null);
  const [side, setSide] = useState("buy");
  const [type, setType] = useState("limit");
  const [price, setPrice] = useState("4.82");
  const [amount, setAmount] = useState("");
  const [orders, setOrders] = useState([]);

  const loadOrders = () => { if (address) api.orders(address).then(setOrders); };
  useEffect(() => { api.orderbook("ION/USDT").then(setBook); const i = setInterval(() => api.orderbook("ION/USDT").then(setBook), 5000); return () => clearInterval(i); }, []);
  useEffect(() => { loadOrders(); }, [address]);

  const submit = async () => {
    const r = await sendTx("Order", () => api.placeOrder({ address, pair: "ION/USDT", side, order_type: type, price: parseFloat(price) || 0, amount: parseFloat(amount) || 0 }));
    if (r) { setAmount(""); loadOrders(); }
  };

  const maxTotal = book ? Math.max(...book.asks.map((a) => a.total), ...book.bids.map((b) => b.total)) : 1;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px 320px", gap: 16 }} className="dex-grid">
      <div className="space-y-4">
        <TradingViewChart symbol="BINANCE:TONUSDT" height={500} />
        <Panel className="p-4">
          <h3 className="h1" style={{ fontSize: 15, marginBottom: 10 }}>Open Orders</h3>
          {orders.length === 0 ? <div style={{ color: "var(--text-dim)", padding: "12px 0" }}>{address ? "No open orders" : "Connect wallet"}</div> :
            orders.map((o) => (
              <div key={o.id} className="flex justify-between py-2" style={{ fontSize: 13, borderBottom: "1px solid rgba(248,251,255,0.05)" }}>
                <span style={{ color: o.side === "buy" ? "var(--green)" : "var(--red)" }}>{o.side} {o.order_type}</span>
                <span className="mono">{fmt(o.price, 4)} × {fmt(o.amount)}</span>
                <span style={{ color: "var(--cyan)" }}>{o.status}</span>
              </div>
            ))}
        </Panel>
      </div>

      {/* Order book */}
      <Panel className="p-4">
        <h3 className="h1" style={{ fontSize: 15, marginBottom: 10 }}>Order Book</h3>
        {!book ? <Loader /> : (
          <>
            {book.asks.slice().reverse().map((a, i) => (
              <div key={`a${i}`} className="relative flex justify-between py-1" style={{ fontSize: 12 }}>
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${(a.total / maxTotal) * 100}%`, background: "rgba(255,68,102,0.12)" }} />
                <span className="mono" style={{ color: "var(--red)", zIndex: 1 }}>{fmt(a.price, 4)}</span><span className="mono" style={{ zIndex: 1 }}>{fmt(a.amount)}</span>
              </div>
            ))}
            <div className="my-2 text-center mono aurora-text" style={{ fontSize: 18 }}>{fmt(book.mid, 4)}</div>
            {book.bids.map((b, i) => (
              <div key={`b${i}`} className="relative flex justify-between py-1" style={{ fontSize: 12 }}>
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${(b.total / maxTotal) * 100}%`, background: "rgba(0,255,136,0.12)" }} />
                <span className="mono" style={{ color: "var(--green)", zIndex: 1 }}>{fmt(b.price, 4)}</span><span className="mono" style={{ zIndex: 1 }}>{fmt(b.amount)}</span>
              </div>
            ))}
          </>
        )}
      </Panel>

      {/* Order panel */}
      <Panel className="p-5">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setSide("buy")} className="ghost-btn flex-1" style={{ background: side === "buy" ? "rgba(0,255,136,0.15)" : undefined, borderColor: side === "buy" ? "var(--green)" : undefined }} data-testid="side-buy">Buy</button>
          <button onClick={() => setSide("sell")} className="ghost-btn flex-1" style={{ background: side === "sell" ? "rgba(255,68,102,0.15)" : undefined, borderColor: side === "sell" ? "var(--red)" : undefined }} data-testid="side-sell">Sell</button>
        </div>
        <div className="flex gap-2 mb-4">
          {["limit", "market"].map((t) => (
            <button key={t} onClick={() => setType(t)} className="chip" style={{ color: type === t ? "var(--cyan)" : "var(--text-dim)", textTransform: "capitalize" }} data-testid={`type-${t}`}>{t}</button>
          ))}
        </div>
        {type === "limit" && (<><label style={{ fontSize: 12, color: "var(--text-dim)" }}>Price (USDT)</label>
          <NeonInput type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mb-3 mt-1" data-testid="order-price" /></>)}
        <label style={{ fontSize: 12, color: "var(--text-dim)" }}>Amount (ION)</label>
        <NeonInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className="mb-4 mt-1" data-testid="order-amount" />
        <NeonButton onClick={submit} style={{ background: side === "buy" ? "linear-gradient(90deg,#00ff88,#00ffff)" : "linear-gradient(90deg,#ff4466,#ff00ff)" }} data-testid="order-submit">{side === "buy" ? "Buy" : "Sell"} ION</NeonButton>
      </Panel>
    </div>
  );
}
