import React, { useState, useEffect, useCallback } from "react";
import { Panel, NeonButton, Icon, Badge, Loader } from "../components/kit";
import TradingViewChart from "../components/TradingViewChart";
import NeonCandlestickChart from "../components/NeonCandlestickChart";
import QuickTiles from "../components/QuickTiles";
import NeonGauge from "../components/NeonGauge";
import SlippageControl from "../components/SlippageControl";
import SwapHistory from "../components/SwapHistory";
import SwapAnalysis from "../components/SwapAnalysis";
import TechnicalIndicators from "../components/TechnicalIndicators";
import PriceAnalytics from "../components/PriceAnalytics";
import { api, fmt, fmtUsd } from "../lib/api";
import { useWallet } from "../context/WalletContext";
import { useSwapPrice } from "../hooks/useSwapPrice";
import { useChainData } from "../hooks/useChainData";
import { useSwapHistoryStorage, useUserPreferences } from "../hooks/useLocalStorage";
import { swapHistoryManager } from "../lib/localStorage";

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
  const {
    calculatePrice,
    slippageMode,
    setSlippageMode,
    customSlippage,
    setCustomSlippage,
    suggestedSlippage,
    priceImpact,
    validateSlippage,
  } = useSwapPrice();

  const [tokens, setTokens] = useState([]);
  const [trades, setTrades] = useState([]);
  const [fromT, setFromT] = useState("ION");
  const [toT, setToT] = useState("USDT");
  const [amount, setAmount] = useState("100");
  const [quote, setQuote] = useState(null);
  const [stats, setStats] = useState(null);
  const [burn, setBurn] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // 技术指标状态
  const [volatility, setVolatility] = useState(0);
  const [rsi, setRSI] = useState(50);
  const [priceHistoryData, setPriceHistoryData] = useState([]);

  useEffect(() => {
    api.tokens().then(setTokens);
    api.recentTrades("ION/USDT").then(setTrades);
    api.pools().then(setStats);
    api.burnStats().then(setBurn);
  }, []);

  // 更新技术指标数据
  useEffect(() => {
    // 模拟波动率计算
    setVolatility(Math.random() * 3 + 0.5);
    // 模拟 RSI 计算
    setRSI(Math.random() * 40 + 30);
    // 模拟价格历史
    setPriceHistoryData(
      Array.from({ length: 24 }, (_, i) => 
        4.5 + Math.sin(i / 5) * 0.5 + Math.random() * 0.3
      )
    );
  }, [fromT, toT]);

  // 使用新的价格计算引擎
  const calculateSwapPrice = useCallback(() => {
    const a = parseFloat(amount);
    if (!a || a <= 0 || fromT === toT) {
      setQuote(null);
      return;
    }

    const priceQuote = calculatePrice(fromT, toT, a);
    if (priceQuote) {
      setQuote(priceQuote);
    }
  }, [amount, fromT, toT, calculatePrice]);

  useEffect(() => {
    calculateSwapPrice();
  }, [calculateSwapPrice]);

  const flip = () => {
    setFromT(toT);
    setToT(fromT);
    calculateSwapPrice();
  };

  const doSwap = async () => {
    if (!quote || isSwapping) return;

    setIsSwapping(true);
    try {
      // 验证滑点
      const validation = validateSlippage(quote.slippage);
      if (!validation.valid) {
        alert(validation.message);
        setIsSwapping(false);
        return;
      }

      // 执行交易
      await sendTx(
        `Swap ${amount} ${fromT} to ${quote.minOutput.toFixed(4)} ${toT}`,
        () =>
          api.swap({
            address,
            from_token: fromT,
            to_token: toT,
            amount_in: parseFloat(amount),
            min_amount_out: quote.minOutput,
            slippage: quote.slippage,
          })
      );

      // 保存交易到 localStorage
      try {
        const tradeRecord = {
          id: `0x${Math.random().toString(16).slice(2)}`,
          from: fromT,
          to: toT,
          inputAmount: parseFloat(amount),
          outputAmount: quote.minOutput,
          rate: quote.rate,
          slippage: quote.slippage,
          priceImpact: parseFloat(quote.priceImpact),
          fee: quote.tradingFee,
          status: 'completed',
          timestamp: Date.now(),
          txHash: `0x${Math.random().toString(16).slice(2)}`,
        };
        swapHistoryManager.addTrade(tradeRecord);
      } catch (storageError) {
        console.error('Failed to save trade history:', storageError);
      }

      // 重置表单
      setAmount("0");
      setQuote(null);
    } catch (error) {
      console.error("Swap failed:", error);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="space-y-6">
    <div style={{ display: "grid", gridTemplateColumns: "350px 1fr 300px", gap: 20 }} className="dex-grid">
      {/* LEFT - Swap */}
      <div className="space-y-4 depth-left">
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
          <TokenCard label="To" token={toT} amount={quote ? fmt(quote.minOutput, 4) : "0.0"} tokens={tokens} onToken={setToT} readOnly />

          {/* 滑点控制 */}
          <div className="mt-4">
            <SlippageControl
              slippageMode={slippageMode}
              setSlippageMode={setSlippageMode}
              customSlippage={customSlippage}
              setCustomSlippage={setCustomSlippage}
              suggestedSlippage={suggestedSlippage}
              priceImpact={priceImpact}
              validateSlippage={validateSlippage}
            />
          </div>

          {quote && (
            <div className="mt-4 space-y-2" style={{ fontSize: 13, color: "var(--text-dim)" }}>
              <div className="flex justify-between">
                <span>Rate</span>
                <span className="mono" style={{ color: "var(--text)" }}>
                  1 {fromT} = {fmt(quote.rate, 4)} {toT}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Route</span>
                <span style={{ color: "var(--cyan)" }}>{quote.route.join(" → ")}</span>
              </div>
              <div className="flex justify-between">
                <span>Price Impact</span>
                <span
                  className="mono"
                  style={{
                    color:
                      quote.priceImpact > 5
                        ? "var(--red)"
                        : quote.priceImpact > 2
                        ? "var(--gold)"
                        : "var(--green)",
                  }}
                >
                  {quote.priceImpact}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Slippage</span>
                <span className="mono" style={{ color: "var(--cyan)" }}>{quote.slippage.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Min Output</span>
                <span className="mono" style={{ color: "var(--green)" }}>
                  {fmt(quote.minOutput, 4)} {toT}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Trading Fee</span>
                <span className="mono" style={{ color: "var(--gold)" }}>{fmt(quote.tradingFee, 4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Eco Fee (ION)</span>
                <span className="mono" style={{ color: "var(--red)" }}>{fmt(quote.ecoFeeInION, 4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Time</span>
                <span className="mono" style={{ color: "var(--text)" }}>{quote.executionTime}</span>
              </div>
            </div>
          )}
          <NeonButton
            className="mt-5"
            onClick={doSwap}
            disabled={!quote || isSwapping}
            data-testid="swap-submit"
          >
            {isSwapping ? "Swapping..." : address ? "Swap" : "Connect & Swap"}
          </NeonButton>
        </Panel>
      </div>

      {/* CENTER - Chart + trades + analysis */}
      <div className="space-y-4">
        <NeonCandlestickChart pair={`${fromT}/${toT}`} base={fromT === "ION" ? 4.82 : 100} height={440} />
        
        {/* Swap Analysis Component */}
        <SwapAnalysis
          pair={`${fromT}/${toT}`}
          priceHistory={priceHistoryData}
          volatility={volatility}
          rsi={rsi}
          volume24h={quote?.volume24h || 0}
          liquidity={quote?.liquidity || 0}
        />
        
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

      {/* RIGHT - Stats + Market list + Technical Indicators */}
      <div className="space-y-4 depth-right">
        <Panel className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>TVL</div>
              <div className="stat-mono aurora-text" style={{ fontSize: 22 }}>{stats ? "$" + (stats.total_tvl / 1e6).toFixed(1) + "M" : "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Top APR</div>
              <div className="stat-mono" style={{ fontSize: 22, color: "var(--green)" }}>{stats ? Math.max(...stats.pools.map((p) => p.apr)).toFixed(1) + "%" : "—"}</div>
            </div>
          </div>
        </Panel>

        <Panel className="p-4 flex flex-col items-center">
          <div className="flex items-center gap-2 self-start mb-1"><Icon name="burn.svg" size={18} /><h3 className="h1" style={{ fontSize: 15 }}>Burn</h3></div>
          <NeonGauge value={burn ? burn.burn_rate : 0} max={30} size={170}
            label={burn ? burn.burn_rate + "%" : "—"} sublabel="Dynamic burn rate" color="var(--magenta)" />
          <div className="w-full flex justify-between mt-2" style={{ fontSize: 12 }}>
            <span style={{ color: "var(--text-dim)" }}>Total Burned</span>
            <span className="mono" style={{ color: "var(--red)" }}>{burn ? fmt(burn.total_burned) : "—"} ION</span>
          </div>
        </Panel>

        {/* Technical Indicators */}
        <TechnicalIndicators
          pair={`${fromT}/${toT}`}
          rsi={rsi}
          volatility={volatility}
          macd={null}
          bollingerBands={null}
          movingAverages={null}
        />

        <Panel className="p-4">
          <div className="flex items-center gap-2 mb-3"><Icon name="dashboard.svg" size={20} /><h3 className="h1" style={{ fontSize: 16 }}>Markets</h3></div>
          {tokens.length === 0 ? <Loader /> : tokens.slice(0, 6).map((t) => (
            <button key={t.symbol} onClick={() => setFromT(t.symbol)} className="w-full flex items-center justify-between py-2.5 panel-hover px-2 rounded-lg" data-testid={`market-${t.symbol}`}>
              <div className="flex items-center gap-2"><Icon name={t.icon} size={28} /><div className="text-left"><div style={{ fontWeight: 600 }}>{t.symbol}</div><div style={{ fontSize: 11, color: "var(--text-dim)" }}>{t.name}</div></div></div>
              <div className="text-right"><div className="mono" style={{ fontSize: 13 }}>{fmtUsd(t.price)}</div><div style={{ fontSize: 12, color: t.change24h >= 0 ? "var(--green)" : "var(--red)" }}>{t.change24h >= 0 ? "+" : ""}{t.change24h}%</div></div>
            </button>
          ))}
        </Panel>
      </div>
    </div>
      <div className="depth-bottom"><QuickTiles /></div>
      <div className="depth-bottom"><SwapHistory /></div>
    </div>
  );
}
