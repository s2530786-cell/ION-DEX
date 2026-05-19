# dexcreener.py — 秒级 DEX 实时数据，300次/分钟，无需 Key
# 用法: python dexcreener.py token 0xe1ab61f7b093435204df32f5b3a405de55445ea8
#       python dexcreener.py pair bsc 0x6487725b383954e05cA56F3c2B93a104B3DD2C25
#       python dexcreener.py search ION

import sys, requests, json, time

BASE = "https://api.dexscreener.com"
CACHE = {}
CACHE_TTL = 15  # 15秒缓存

def get_token_pairs(addresses):
    """通过代币地址查所有交易对。最多30个地址，逗号分隔。"""
    addrs = addresses if isinstance(addresses, str) else ",".join(addresses)
    url = f"{BASE}/latest/dex/tokens/{addrs}"
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    return r.json()["pairs"]

def get_pair(chain, pair_addr):
    """指定链+池子地址查详情"""
    url = f"{BASE}/latest/dex/pairs/{chain}/{pair_addr}"
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    return r.json()["pairs"]

def search(query):
    """模糊搜索代币/交易对"""
    url = f"{BASE}/latest/dex/search?q={query}"
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    return r.json()["pairs"]

def get_best_pair(token_addr):
    """获取代币的最佳交易对（按流动性排序）"""
    token_addr = token_addr.lower().strip()

    # 缓存检查
    if token_addr in CACHE:
        ts, data = CACHE[token_addr]
        if time.time() - ts < CACHE_TTL:
            return data

    pairs = get_token_pairs(token_addr)
    # 过滤：只要正常价格的，按流动性排序
    valid = [p for p in pairs if p.get("liquidity", {}).get("usd", 0) > 1000 and p.get("priceUsd")]
    valid.sort(key=lambda p: float(p["liquidity"]["usd"]), reverse=True)

    result = valid[0] if valid else (pairs[0] if pairs else None)
    if result:
        CACHE[token_addr] = (time.time(), result)
    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: dexcreener.py <cmd> [args]")
        print("  token <addr>     — 查代币所有交易对")
        print("  pair <chain> <addr>  — 查特定池子")
        print("  search <q>       — 模糊搜索")
        print("  best <addr>      — 最佳交易对摘要")
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "token":
        pairs = get_token_pairs(sys.argv[2])
        for p in sorted(pairs, key=lambda x: float(x.get("liquidity", {}).get("usd", 0)), reverse=True):
            liq = float(p.get("liquidity", {}).get("usd", 0))
            vol = float(p.get("volume", {}).get("h24", 0))
            chg = float(p.get("priceChange", {}).get("h24", 0)) if p.get("priceChange", {}).get("h24") else 0
            print(f"{p['chainId']}/{p['dexId']:20s} {p['baseToken']['symbol']}/{p['quoteToken']['symbol']:8s} "
                  f"${p.get('priceUsd','?'):>12s} TVL=${liq:>10,.0f} vol24h=${vol:>10,.0f} chg={chg:>6.1f}%")

    elif cmd == "pair":
        pairs = get_pair(sys.argv[2], sys.argv[3])
        for p in pairs:
            print(json.dumps({
                "price": p["priceUsd"],
                "volume24h": p["volume"]["h24"],
                "liquidity": p["liquidity"]["usd"],
                "fdv": p.get("fdv", "N/A"),
                "txns24h": p.get("txns", {}).get("h24", {}),
                "priceChange": p.get("priceChange", {})
            }, indent=2))

    elif cmd == "search":
        pairs = search(sys.argv[2])
        seen = set()
        for p in pairs[:10]:
            key = f"{p['chainId']}/{p['dexId']}/{p['baseToken']['symbol']}"
            if key not in seen:
                seen.add(key)
                print(f"{key} ${p.get('priceUsd','?')} TVL=${float(p.get('liquidity',{}).get('usd',0)):,.0f}")

    elif cmd == "best":
        best = get_best_pair(sys.argv[2])
        if best:
            print(json.dumps({
                "pair": best["pairAddress"],
                "dex": f"{best['chainId']}/{best['dexId']}",
                "symbol": f"{best['baseToken']['symbol']}/{best['quoteToken']['symbol']}",
                "priceUsd": best["priceUsd"],
                "volume24h": best["volume"]["h24"],
                "liquidity": best["liquidity"]["usd"],
                "fdv": best.get("fdv", "N/A"),
                "priceChange5m": best.get("priceChange", {}).get("m5"),
                "priceChange1h": best.get("priceChange", {}).get("h1"),
                "priceChange24h": best.get("priceChange", {}).get("h24"),
                "buys24h": best.get("txns", {}).get("h24", {}).get("buys"),
                "sells24h": best.get("txns", {}).get("h24", {}).get("sells"),
            }, indent=2))
