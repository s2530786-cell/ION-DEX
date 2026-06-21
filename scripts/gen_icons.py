import os

OUT = "/app/frontend/public/assets/icons"
os.makedirs(OUT, exist_ok=True)

AURORA = "url(#ag)"
DEFS = '<defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00ffff"/><stop offset="0.5" stop-color="#6020ff"/><stop offset="1" stop-color="#ff00ff"/></linearGradient></defs>'

def svg(body, vb=48):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb} {vb}" fill="none">{DEFS}{body}</svg>'

def write(name, body, vb=48):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(svg(body, vb))

S = 'stroke="%s" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"' % AURORA

# token coin: gradient circle + symbol text
def coin(name, sym, bg):
    body = (f'<circle cx="24" cy="24" r="21" fill="{bg}" stroke="{AURORA}" stroke-width="2"/>' 
            f'<text x="24" y="30" font-family="JetBrains Mono, monospace" font-size="14" font-weight="800" fill="#f8fbff" text-anchor="middle">{sym}</text>')
    write(name, body)

coin("ion.svg", "ION", "#0a1424")
coin("usdt.svg", "USDT", "#0a241a")
coin("bnb.svg", "BNB", "#241f0a")
coin("btc.svg", "BTC", "#241a0a")
coin("eth.svg", "ETH", "#120a24")
coin("ton.svg", "TON", "#0a1a24")
coin("usdc.svg", "USDC", "#0a1a24")
coin("cake.svg", "CAKE", "#240a1a")

# logo: diamond/prism
write("logo.svg", f'<path d="M24 4 L42 20 L24 44 L6 20 Z" {S}/><path d="M6 20 H42 M24 4 V44" {S}/>')

# wallet
write("wallet.svg", f'<rect x="6" y="12" width="36" height="26" rx="5" {S}/><path d="M6 18 H36 a4 4 0 0 1 4 4 v4 a4 4 0 0 1 -4 4 H30" {S}/><circle cx="33" cy="25" r="2.4" fill="{AURORA}"/>')

# swap (two arrows)
write("swap.svg", f'<path d="M14 16 H38 l-7 -7 M34 32 H10 l7 7" {S}/>')
# pool (layers)
write("pool.svg", f'<ellipse cx="24" cy="14" rx="16" ry="6" {S}/><path d="M8 14 v10 c0 3.3 7.2 6 16 6 s16 -2.7 16 -6 V14" {S}/><path d="M8 24 v10 c0 3.3 7.2 6 16 6 s16 -2.7 16 -6 V24" {S}/>')
# stake (lock+coins)
write("stake.svg", f'<rect x="12" y="20" width="24" height="20" rx="4" {S}/><path d="M17 20 v-4 a7 7 0 0 1 14 0 v4" {S}/><circle cx="24" cy="29" r="2.5" fill="{AURORA}"/>')
# bridge
write("bridge.svg", f'<path d="M4 30 h40 M8 30 v-8 M40 30 v-8 M16 30 c0 -6 5 -10 8 -10 s8 4 8 10 M4 22 c4 0 6 -2 8 -2 M44 22 c-4 0 -6 -2 -8 -2" {S}/>')
# dashboard
write("dashboard.svg", f'<rect x="6" y="6" width="15" height="15" rx="3" {S}/><rect x="27" y="6" width="15" height="22" rx="3" {S}/><rect x="6" y="27" width="15" height="15" rx="3" {S}/><rect x="27" y="34" width="15" height="8" rx="3" {S}/>')
# burn (flame)
write("burn.svg", f'<path d="M24 4 c6 8 12 12 12 22 a12 12 0 0 1 -24 0 c0 -6 3 -10 6 -14 c1 4 3 6 6 6 c-2 -6 0 -10 0 -14 Z" {S}/>')
# ai (brain/chip)
write("ai.svg", f'<rect x="12" y="12" width="24" height="24" rx="6" {S}/><path d="M18 4 v8 M30 4 v8 M18 36 v8 M30 36 v8 M4 18 h8 M4 30 h8 M36 18 h8 M36 30 h8" {S}/><circle cx="24" cy="24" r="5" fill="{AURORA}"/>')
# copy
write("copy.svg", f'<rect x="8" y="8" width="22" height="22" rx="4" {S}/><rect x="18" y="18" width="22" height="22" rx="4" {S}/>')
# vault
write("vault.svg", f'<rect x="6" y="8" width="36" height="32" rx="5" {S}/><circle cx="24" cy="24" r="9" {S}/><path d="M24 24 l5 -5 M24 15 v3 M24 30 v3 M15 24 h3 M30 24 h3" {S}/>')
# domain (globe)
write("domain.svg", f'<circle cx="24" cy="24" r="18" {S}/><path d="M6 24 h36 M24 6 c6 6 6 30 0 36 c-6 -6 -6 -30 0 -36" {S}/>')
# batch transfer
write("batch.svg", f'<path d="M10 14 h20 l-5 -5 M10 14 l5 5 M38 34 h-20 l5 5 M38 34 l-5 -5" {S}/><circle cx="38" cy="14" r="3" fill="{AURORA}"/><circle cx="10" cy="34" r="3" fill="{AURORA}"/>')
# approve (shield check)
write("approve.svg", f'<path d="M24 4 l16 6 v10 c0 12 -8 20 -16 24 c-8 -4 -16 -12 -16 -24 V10 Z" {S}/><path d="M17 24 l5 5 l9 -11" {S}/>')
# settings (gear)
write("settings.svg", f'<circle cx="24" cy="24" r="7" {S}/><path d="M24 4 v6 M24 38 v6 M4 24 h6 M38 24 h6 M10 10 l4 4 M34 34 l4 4 M38 10 l-4 4 M10 38 l4 -4" {S}/>')
# order book
write("order.svg", f'<path d="M8 12 h14 M8 20 h20 M8 28 h12 M8 36 h18 M34 10 v28 M30 30 l4 8 l4 -8" {S}/>')
# mine (pickaxe)
write("mine.svg", f'<path d="M10 38 L30 18 M8 14 c8 -6 18 -2 22 4 c-6 -4 -14 -2 -18 4 Z" {S}/><circle cx="33" cy="15" r="3" fill="{AURORA}"/>')
# subscription (star tier)
write("sub.svg", f'<path d="M24 6 l5.5 11 12 1.5 -9 8 2.5 12 -11 -6 -11 6 2.5 -12 -9 -8 12 -1.5 Z" {S}/>')

# business icons
write("shop.svg", f'<path d="M8 18 l3 -8 h26 l3 8 M8 18 h32 v22 H8 Z M18 40 v-12 h12 v12" {S}/>')
write("food.svg", f'<path d="M14 6 v16 M10 6 v10 a4 4 0 0 0 8 0 V6 M34 6 c-4 0 -6 6 -6 12 h6 V6 v36" {S}/>')
write("ride.svg", f'<path d="M8 30 l3 -10 h26 l3 10 M6 30 h36 v6 H6 Z" {S}/><circle cx="15" cy="36" r="3" fill="{AURORA}"/><circle cx="33" cy="36" r="3" fill="{AURORA}"/>')
write("shield.svg", f'<path d="M24 4 l16 6 v10 c0 12 -8 20 -16 24 c-8 -4 -16 -12 -16 -24 V10 Z" {S}/>')
write("truck.svg", f'<path d="M4 14 h22 v18 H4 Z M26 20 h8 l6 6 v6 H26 Z" {S}/><circle cx="13" cy="36" r="3" fill="{AURORA}"/><circle cx="33" cy="36" r="3" fill="{AURORA}"/>')

# avatars
for i, c in enumerate(["#00ffff", "#6020ff", "#ff00ff", "#00ff88", "#ffd166"], 1):
    body = (f'<circle cx="24" cy="24" r="22" fill="#0a0a18" stroke="{c}" stroke-width="2"/>' 
            f'<circle cx="24" cy="19" r="7" fill="{c}"/><path d="M11 40 c0 -8 6 -12 13 -12 s13 4 13 12" fill="{c}"/>')
    write(f"av{i}.svg", body)

print("icons:", len(os.listdir(OUT)))
