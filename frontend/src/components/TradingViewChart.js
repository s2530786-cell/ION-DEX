import React from "react";

// Real K-line via TradingView free widget iframe
export default function TradingViewChart({ symbol = "BINANCE:BNBUSDT", height = 420 }) {
  const src = `https://www.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=${encodeURIComponent(
    symbol
  )}&interval=60&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=0&toolbarbg=010104&theme=dark&style=1&timezone=Etc/UTC&studies=[]&hideideas=1`;
  return (
    <div className="panel overflow-hidden" style={{ height }} data-testid="tradingview-chart">
      <iframe
        title="tradingview"
        src={src}
        style={{ width: "100%", height: "100%", border: "none", borderRadius: 20 }}
        allowtransparency="true"
        scrolling="no"
      />
    </div>
  );
}
