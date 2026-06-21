import React, { useState, useEffect, useCallback } from "react";
import { Panel, NeonButton, Icon, Badge, Loader } from "../components/kit";
import TradingViewChart from "../components/TradingViewChart";
import QuickTiles from "../components/QuickTiles";
import { api, fmt, fmtUsd } from "../lib/api";
import { useWallet } from "../context/WalletContext";

const TV_SYMBOLS = { ION: "BINANCE:TONUSDT", BNB: "BINANCE:BNBUSDT", BTC: "BINANCE:BTCUSDT", ETH: "BINANCE:ETHUSDT", TON: "BINANCE:TONUSDT", CAKE: "BINANCE:CAKEUSDT" };

function TokenCard({ label, token, amount, onAmount, tokens, onToken, readOnly }) {
  return (
    <Panel className="p-4" style={{ height: 120 }}>
      <div className="flex justify-between items-center mb-2" style={{ color: "var(--text-dim)", fontSize: 12 }}>
        <span>{label}</span>
        <span>Balance: 0.00</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number" value={amount} readOnly={readOnly}
          onChange={(e) => onAmount && onAmount(e.target.value)}
          placeholder="0.0" data-testid={`${label.toLowerCase()}-amount`}
          className="bg-transparent outline-none flex-1 mono"
          style={{ fontSize: 26, color: "var(--text)", width: "60%" }}
        />
        <select value={token} onChange={(e) => onToken(e.target.value)} data-testid={`${label.toLowerCase()}-token`}
          className="ghost-btn" style={{ height: 44, paddingRight: 12 }}>
          {tokens.map((t) => <option key={t.symbol} value={t.symbol} style={{ background: "#0a0a18" }}>{t.symbol}</option>)}
        </select>
      </div>
    </Panel>
  );
}

export default function SwapPage() {
  const { address, sendTx } = useWallet();
  const [tokens, setTokens] = useState([]);
  const [trades, setTrades] = useState([]);
  const [fromT, setFromT] = useState("ION");
  const [toT, setToT] = useState("USDT");
  const [amount, setAmount] = useState("100");
  const [quote, setQuote] = useState(null);

  useEffect(() => { api.tokens().then(setTokens); api.recentTrades("ION/USDT").then(setTrades); }, []);

  const loadQuote = useCallback(() => {
    const a = parseFloat(amount);
    if (!a || a <= 0 || fromT === toT) { setQuote(null); return; }
    api.swapQuote(fromT, toT, a).then(setQuote).catch(() => setQuote(null));
  }, [amount, fromT, toT]);

  useEffect(() => { loadQuote(); }, [loadQuote]);

  const flip = () => { setFromT(toT); setToT(fromT); };

  const doSwap = async () => {
    await sendTx("Swap", () => api.swap({ address, from_token: fromT, to_token: toT, amount_in: parseFloat(amount) }));
  };

  return (
    <div className="space-y-6">
    <div style={{ display: "grid", gridTemplateColumns: "350px 1fr 300px", gap: 20 }} className="dex-grid">
      {/* LEFT - Swap */}
      <div className="space-y-4">
        <Panel className="p-5">
          <div className="flex items-center gap-2 mb-3"><Icon name="swap.svg" size={22} /><h2 className="h1" style={{ fontSize: 20 }}>Swap</h2></div>
          <div className="flex gap-2 mb-4">
            <span className="chip" style={{ color: "var(--green)", borderColor: "rgba(0,255,136,0.4)" }} data-testid="badge-mev">🛡 MEV Protected</span>
            <span className="chip" style={{ color: "var(--cyan)", borderColor: "rgba(0,255,255,0.4)" }} data-testid="badge-gasfree">⚡ Best Route</span>
          </div>
          <TokenCard label="From" token={fromT} amount={amount} onAmount={setAmount} tokens={tokens} onToken={setFromT} />
          <div className="flex justify-center my-2">
            <button onClick={flip} className="ghost-btn spin-arrow" style={{ width: 44, height: 44, padding: 0, borderRadius: 14 }} data-testid="swap-flip"><Icon name="swap.svg" size={20} /></button>
          </div>
          <TokenCard label="To" token={toT} amount={quote ? fmt(quote.amount_out, 4) : "0.0"} tokens={tokens} onToken={setToT} readOnly />

          {quote && (
            <div className="mt-4 space-y-2" style={{ fontSize: 13, color: "var(--text-dim)" }}>
              <div className="flex justify-between"><span>Rate</span><span className="mono" style={{ color: "var(--text)" }}>1 {fromT} = {fmt(quote.rate, 4)} {toT}</span></div>
              <div className="flex justify-between"><span>Route</span><span style={{ color: "var(--cyan)" }}>{quote.route.join(" → ")}</span></div>
              <div className="flex justify-between"><span>Gas</span><span className="mono" style={{ color: "var(--text)" }}>{quote.gas_estimate} BNB</span></div>
              <div className="flex justify-between"><span>Slippage</span><span className="mono" style={{ color: "var(--text)" }}>{quote.slippage}%</span></div>
              <div className="flex justify-between"><span>Price Impact</span><span className="mono" style={{ color: quote.price_impact > 3 ? "var(--red)" : "var(--green)" }}>{quote.price_impact}%</span></div>
              <div className="flex justify-between"><span>Fee (ION)</span><span className="mono" style={{ color: "var(--gold)" }}>{fmt(quote.fee_ion, 4)}</span></div>
            </div>
          )}
          <NeonButton className="mt-5" onClick={doSwap} disabled={!quote} data-testid="swap-submit">{address ? "Swap" : "Connect & Swap"}</NeonButton>
        </Panel>
      </div>

      {/* CENTER - Chart + trades */}
      <div className="space-y-4">
        <TradingViewChart symbol={TV_SYMBOLS[fromT] || "BINANCE:BNBUSDT"} height={420} />
        <Panel className="p-5">
          <div className="flex items-center gap-2 mb-3"><Icon name="order.svg" size={20} /><h3 className="h1" style={{ fontSize: 16 }}>Recent Trades</h3></div>
          <div className="grid grid-cols-4 gap-2 pb-2" style={{ color: "var(--text-dim)", fontSize: 12, borderBottom: "1px solid var(--panel-border)" }}>
            <span>Side</span><span>Price</span><span className="text-right">Amount</span><span className="text-right">Time</span>
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {trades.map((t) => (
              <div key={t.id} className="grid grid-cols-4 gap-2 py-1.5" style={{ fontSize: 13 }}>
                <span style={{ color: t.side === "buy" ? "var(--green)" : "var(--red)", textTransform: "capitalize" }}>{t.side}</span>
                <span className="mono">{fmt(t.price, 4)}</span>
                <span className="mono text-right">{fmt(t.amount)}</span>
                <span className="text-right" style={{ color: "var(--text-dim)" }}>{t.time}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* RIGHT - Market list */}
      <div>
        <Panel className="p-4">
          <div className="flex items-center gap-2 mb-3"><Icon name="dashboard.svg" size={20} /><h3 className="h1" style={{ fontSize: 16 }}>Markets</h3></div>
          {tokens.length === 0 ? <Loader /> : tokens.map((t) => (
            <button key={t.symbol} onClick={() => setFromT(t.symbol)} className="w-full flex items-center justify-between py-2.5 panel-hover px-2 rounded-lg" data-testid={`market-${t.symbol}`}>
              <div className="flex items-center gap-2"><Icon name={t.icon} size={28} /><div className="text-left"><div style={{ fontWeight: 600 }}>{t.symbol}</div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>{t.name}</div></div></div>
              <div className="text-right"><div className="mono" style={{ fontSize: 13 }}>{fmtUsd(t.price)}</div><div style={{ fontSize: 12, color: t.change24h >= 0 ? "var(--green)" : "var(--red)" }}>{t.change24h >= 0 ? "+" : ""}{t.change24h}%</div></div>
            </button>
          ))}
        </Panel>
      </div>
    </div>
      <QuickTiles />
    </div>
  );
}
