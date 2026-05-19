# binance.py — 币安公共行情，免费无需Key，1200次/分
# 用途: BNB/USDT 基准价（ION↔USD 转换链）

import sys, requests, json

BASE = "https://api.binance.com/api/v3"

def price(symbol):
    """实时价格"""
    r = requests.get(f"{BASE}/ticker/price", params={"symbol": symbol.upper()}, timeout=5)
    r.raise_for_status()
    return float(r.json()["price"])

def ticker(symbol):
    """24h完整行情"""
    r = requests.get(f"{BASE}/ticker/24hr", params={"symbol": symbol.upper()}, timeout=5)
    r.raise_for_status()
    d = r.json()
    return {
        "price": float(d["lastPrice"]),
        "change_pct": float(d["priceChangePercent"]),
        "high": float(d["highPrice"]),
        "low": float(d["lowPrice"]),
        "volume": float(d["volume"]),
        "quote_vol": float(d["quoteVolume"])
    }

def klines(symbol, interval="1h", limit=24):
    """K线数据"""
    r = requests.get(f"{BASE}/klines", params={
        "symbol": symbol.upper(), "interval": interval, "limit": limit
    }, timeout=5)
    r.raise_for_status()
    return [{
        "open": float(k[1]), "high": float(k[2]),
        "low": float(k[3]), "close": float(k[4]),
        "volume": float(k[5]), "time": k[0]
    } for k in r.json()]

def convert_ion_to_usd(ion_price_bnb, bnb_price_usd=None):
    """ION → USD 换算 (ION/WBNB + BNB/USDT)"""
    if bnb_price_usd is None:
        bnb_price_usd = price("BNBUSDT")
    return ion_price_bnb * bnb_price_usd

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("用法: binance.py <cmd> [args]")
        print("  price <SYMBOL>        — 实时价格")
        print("  ticker <SYMBOL>       — 24h行情")
        print("  klines <SYMBOL> <int> — K线 (默认1h,24根)")
        print("  convert <ION_BNB价>   — ION→USD 换算")
        sys.exit(1)

    cmd = sys.argv[1]
    sym = sys.argv[2].upper()

    if cmd == "price":
        print(f"${price(sym)}")
    elif cmd == "ticker":
        t = ticker(sym)
        for k, v in t.items():
            print(f"{k}: {v}")
    elif cmd == "klines":
        interval = sys.argv[3] if len(sys.argv) > 3 else "1h"
        limit = int(sys.argv[4]) if len(sys.argv) > 4 else 24
        for k in klines(sym, interval, limit):
            print(f"O={k['open']:.4f} H={k['high']:.4f} L={k['low']:.4f} C={k['close']:.4f} V={k['volume']:.0f}")
    elif cmd == "convert":
        ion_bnb = float(sys.argv[2])
        bnb = price("BNBUSDT")
        usd = ion_bnb * bnb
        print(f"ION/WBNB: {ion_bnb}")
        print(f"BNB/USDT: ${bnb}")
        print(f"ION/USD:  ${usd}")
