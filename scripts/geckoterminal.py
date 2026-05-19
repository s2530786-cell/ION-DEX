# geckoterminal.py — 免费 DEX 数据接口，零门槛无 API Key
# 用法: python geckoterminal.py price bsc 0xe1ab61f7b093435204df32f5b3a405de55445ea8
#       python geckoterminal.py pools bsc 0xe1ab61f7b093435204df32f5b3a405de55445ea8
#       python geckoterminal.py ohlcv bsc <pool_addr> day

import sys, requests, json

BASE = "https://api.geckoterminal.com/api/v2"
HEADERS = {"Accept": "application/json;version=20230203"}

def get_token_price(network, address):
    url = f"{BASE}/simple/networks/{network}/token_price/{address}"
    r = requests.get(url, headers=HEADERS, timeout=10)
    r.raise_for_status()
    data = r.json()
    prices = data["data"]["attributes"]["token_prices"]
    return prices.get(address.lower(), "N/A")

def get_pools(network, address):
    url = f"{BASE}/networks/{network}/tokens/{address}/pools?page=1"
    r = requests.get(url, headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()["data"]

def get_pool_detail(network, pool_addr):
    url = f"{BASE}/networks/{network}/pools/{pool_addr}"
    r = requests.get(url, headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()["data"]["attributes"]

def get_ohlcv(network, pool_addr, timeframe="day", aggregate=1):
    url = f"{BASE}/networks/{network}/pools/{pool_addr}/ohlcv/{timeframe}?aggregate={aggregate}"
    r = requests.get(url, headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()["data"]["attributes"]["ohlcv_list"]

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("用法: geckoterminal.py <cmd> <network> <addr> [timeframe]")
        print("  cmd: price | pools | detail | ohlcv")
        sys.exit(1)

    cmd = sys.argv[1]
    network = sys.argv[2]
    addr = sys.argv[3]

    if cmd == "price":
        p = get_token_price(network, addr)
        print(f"${p}")
    elif cmd == "pools":
        pools = get_pools(network, addr)
        for p in pools:
            a = p["attributes"]
            dex = p["relationships"]["dex"]["data"]["id"]
            print(f"{dex:30s} TVL=${a.get('reserve_in_usd',0):>10,.0f}  vol24h=${a.get('volume_usd',{}).get('h24',0):>8,.2f}  {a['name']}")
    elif cmd == "detail":
        d = get_pool_detail(network, addr)
        print(json.dumps(d, indent=2))
    elif cmd == "ohlcv":
        tf = sys.argv[4] if len(sys.argv) > 4 else "day"
        ohlcv = get_ohlcv(network, addr, tf)
        for row in ohlcv[-10:]:
            print(row)
