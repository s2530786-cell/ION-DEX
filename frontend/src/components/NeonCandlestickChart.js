import React, { useRef, useEffect, useState, useMemo } from "react";

function genCandles(n, base) {
  const out = [];
  let price = base;
  for (let i = 0; i < n; i++) {
    const open = price;
    const drift = (Math.random() - 0.48) * base * 0.025;
    const close = Math.max(base * 0.4, open + drift);
    const high = Math.max(open, close) + Math.random() * base * 0.012;
    const low = Math.min(open, close) - Math.random() * base * 0.012;
    const vol = Math.random();
    out.push({ open, close, high, low, vol });
    price = close;
  }
  return out;
}

function ma(data, period, key = "close") {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += data[j][key];
    return s / period;
  });
}

const TF = ["1H", "4H", "1D", "1W", "1M", "ALL"];
const TF_BARS = { "1H": 64, "4H": 56, "1D": 72, "1W": 60, "1M": 80, "ALL": 90 };

export default function NeonCandlestickChart({ height = 440, pair = "ION/USDT", base = 4.82 }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const [tf, setTf] = useState("1H");
  const candles = useMemo(() => genCandles(TF_BARS[tf] || 64, base), [base, tf]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const W = wrap.clientWidth;
    const H = height - 70;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const padR = 58, padL = 6, padT = 10, padB = 26;
    const chartW = W - padR - padL;
    const chartH = H - padT - padB;
    const data = candles;
    const last = data[data.length - 1];
    // live wiggle on last candle
    last.close = Math.max(last.low, Math.min(last.high, last.close + (Math.random() - 0.5) * base * 0.004));

    let max = -Infinity, min = Infinity;
    data.forEach((c) => { max = Math.max(max, c.high); min = Math.min(min, c.low); });
    const pad = (max - min) * 0.08;
    max += pad; min -= pad;
    const x = (i) => padL + (i + 0.5) * (chartW / data.length);
    const y = (p) => padT + (1 - (p - min) / (max - min)) * chartH;

    // grid + price labels
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textBaseline = "middle";
    for (let g = 0; g <= 5; g++) {
      const py = padT + (chartH / 5) * g;
      ctx.strokeStyle = "rgba(0,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, py); ctx.lineTo(padL + chartW, py); ctx.stroke();
      const val = max - ((max - min) / 5) * g;
      ctx.fillStyle = "rgba(248,251,255,0.45)";
      ctx.textAlign = "left";
      ctx.fillText(val.toFixed(4), padL + chartW + 6, py);
    }

    // volume bars
    const maxVol = Math.max(...data.map((c) => c.vol));
    data.forEach((c, i) => {
      const vh = (c.vol / maxVol) * (chartH * 0.18);
      ctx.fillStyle = c.close >= c.open ? "rgba(0,255,255,0.18)" : "rgba(255,46,154,0.16)";
      const bw = (chartW / data.length) * 0.6;
      ctx.fillRect(x(i) - bw / 2, padT + chartH - vh, bw, vh);
    });

    // candles
    const cw = Math.max(2, (chartW / data.length) * 0.62);
    data.forEach((c, i) => {
      const up = c.close >= c.open;
      const col = up ? "#00ffff" : "#ff2e9a";
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x(i), y(c.high)); ctx.lineTo(x(i), y(c.low)); ctx.stroke();
      const yo = y(c.open), yc = y(c.close);
      const top = Math.min(yo, yc);
      const bh = Math.max(2, Math.abs(yc - yo));
      if (up) {
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x(i) - cw / 2, top, cw, bh);
      } else {
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x(i) - cw / 2, top, cw, bh);
      }
      ctx.globalAlpha = 1;
    });
    ctx.shadowBlur = 0;

    // MA lines
    const drawMA = (arr, color) => {
      ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.shadowColor = color; ctx.shadowBlur = 6;
      ctx.beginPath();
      let started = false;
      arr.forEach((v, i) => { if (v == null) return; const px = x(i), py = y(v); if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py); });
      ctx.stroke(); ctx.shadowBlur = 0;
    };
    drawMA(ma(data, 7), "#ffd166");
    drawMA(ma(data, 25), "#6020ff");

    // last price line
    const lp = y(last.close);
    ctx.strokeStyle = "rgba(0,255,255,0.5)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, lp); ctx.lineTo(padL + chartW, lp); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#00ffff"; ctx.fillRect(padL + chartW, lp - 9, padR, 18);
    ctx.fillStyle = "#001018"; ctx.textAlign = "left"; ctx.font = "700 11px 'JetBrains Mono', monospace";
    ctx.fillText(last.close.toFixed(4), padL + chartW + 6, lp);
  }, [candles, height, base, tick]);

  const first = candles[0].open;
  const lastC = candles[candles.length - 1].close;
  const chg = ((lastC - first) / first) * 100;

  return (
    <div className="panel p-4" style={{ height }} data-testid="neon-chart" ref={wrapRef}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-3">
          <span style={{ fontWeight: 700, fontSize: 16 }}>{pair}</span>
          <span className="mono aurora-text" style={{ fontSize: 18 }}>{lastC.toFixed(4)}</span>
          <span className="mono" style={{ fontSize: 13, color: chg >= 0 ? "var(--green)" : "var(--red)" }}>{chg >= 0 ? "+" : ""}{chg.toFixed(2)}%</span>
        </div>
        <div className="flex gap-1">
          {TF.map((t) => (
            <button key={t} onClick={() => setTf(t)} className="chip" style={{ padding: "3px 10px", fontSize: 11, color: tf === t ? "var(--cyan)" : "var(--text-dim)", borderColor: tf === t ? "var(--cyan)" : "var(--panel-border)" }} data-testid={`tf-${t}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 mb-1" style={{ fontSize: 11 }}>
        <span style={{ color: "#ffd166" }}>— MA7</span>
        <span style={{ color: "#6020ff" }}>— MA25</span>
        <span style={{ color: "#00ffff" }}>▮ Up</span>
        <span style={{ color: "#ff2e9a" }}>▮ Down</span>
      </div>
      <canvas ref={ref} />
    </div>
  );
}
