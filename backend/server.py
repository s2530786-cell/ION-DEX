from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import math
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="ION DEX API")
api_router = APIRouter(prefix="/api")

MASTER_ADDRESS = "0x8ff2e1210434495c4f5629bd9d8bd4965a67b84c"
BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def uid():
    return str(uuid.uuid4())


# ---------------- Models ----------------
class SwapRecord(BaseModel):
    id: str = Field(default_factory=uid)
    address: str
    from_token: str
    to_token: str
    amount_in: float
    amount_out: float
    fee_ion: float
    tx_hash: str
    timestamp: str = Field(default_factory=now_iso)


class SwapRequest(BaseModel):
    address: str
    from_token: str
    to_token: str
    amount_in: float


class LiquidityRequest(BaseModel):
    address: str
    pool_id: str
    amount_a: float
    amount_b: float


class StakeRequest(BaseModel):
    address: str
    product_id: str
    amount: float


class BridgeRequest(BaseModel):
    address: str
    from_chain: str
    to_chain: str
    token: str
    amount: float


class DomainRequest(BaseModel):
    address: str
    name: str
    years: int = 1


class BatchTransferRequest(BaseModel):
    address: str
    token: str
    recipients: List[dict]


class SubscribeRequest(BaseModel):
    address: str
    tier: str


class OrderRequest(BaseModel):
    address: str
    pair: str
    side: str
    order_type: str
    price: float
    amount: float


class CopyRequest(BaseModel):
    address: str
    trader_id: str
    allocation: float


class VaultRequest(BaseModel):
    address: str
    vault_id: str
    amount: float


class SettingsRequest(BaseModel):
    address: str
    slippage: float = 0.5
    gas_mode: str = "standard"
    oracle: str = "dual"
    multisig_threshold: int = 3


# ---------------- Seed Data ----------------
TOKENS = [
    {"symbol": "ION", "name": "ION Token", "price": 4.82, "change24h": 12.4, "volume": 18420000, "icon": "ion.svg"},
    {"symbol": "USDT", "name": "Tether USD", "price": 1.0, "change24h": 0.01, "volume": 42100000, "icon": "usdt.svg"},
    {"symbol": "BNB", "name": "BNB", "price": 612.3, "change24h": -2.1, "volume": 31200000, "icon": "bnb.svg"},
    {"symbol": "BTC", "name": "Bitcoin", "price": 71250.0, "change24h": 3.2, "volume": 88400000, "icon": "btc.svg"},
    {"symbol": "ETH", "name": "Ethereum", "price": 3845.0, "change24h": 1.8, "volume": 54300000, "icon": "eth.svg"},
    {"symbol": "TON", "name": "Toncoin", "price": 5.42, "change24h": 6.7, "volume": 12800000, "icon": "ton.svg"},
    {"symbol": "USDC", "name": "USD Coin", "price": 1.0, "change24h": 0.0, "volume": 22100000, "icon": "usdc.svg"},
    {"symbol": "CAKE", "name": "PancakeSwap", "price": 2.31, "change24h": -4.3, "volume": 6700000, "icon": "cake.svg"},
]

STAKE_PRODUCTS = [
    {"id": "flexible", "name": "Flexible", "lock_days": 0, "apy": 8, "min": 10},
    {"id": "lock7", "name": "7 Days", "lock_days": 7, "apy": 10, "min": 50},
    {"id": "lock30", "name": "30 Days", "lock_days": 30, "apy": 12, "min": 100},
    {"id": "lock90", "name": "90 Days", "lock_days": 90, "apy": 15, "min": 250},
    {"id": "lock180", "name": "180 Days", "lock_days": 180, "apy": 20, "min": 500},
    {"id": "lock365", "name": "365 Days", "lock_days": 365, "apy": 30, "min": 1000},
]

SUB_TIERS = [
    {"id": "free", "name": "Free", "price_ion": 0, "features": ["Basic swap", "Market data", "1 copy-trade slot"]},
    {"id": "pro", "name": "Pro", "price_ion": 10, "features": ["AI strategies", "10 copy-trade slots", "Priority routing", "Lower fees"]},
    {"id": "enterprise", "name": "Enterprise", "price_ion": 100, "features": ["Unlimited strategies", "API access", "Dedicated vault", "0 platform fee", "Custom multisig"]},
]

AI_STRATEGIES = [
    {"id": "s1", "name": "Aurora Grid", "type": "Grid", "apy": 42.5, "risk": "Medium", "tvl": 2840000, "subscribers": 1240, "desc": "Automated grid trading on ION/USDT volatility bands."},
    {"id": "s2", "name": "Nebula DCA", "type": "DCA", "apy": 21.3, "risk": "Low", "tvl": 5120000, "subscribers": 3410, "desc": "Dollar-cost averaging into blue-chip assets weekly."},
    {"id": "s3", "name": "Quantum Arb", "type": "Arbitrage", "apy": 68.9, "risk": "High", "tvl": 1240000, "subscribers": 620, "desc": "Cross-DEX arbitrage between PancakeSwap and ION pools."},
    {"id": "s4", "name": "Pulsar Momentum", "type": "Trend", "apy": 55.1, "risk": "High", "tvl": 980000, "subscribers": 540, "desc": "Momentum trend-following with dynamic stop loss."},
    {"id": "s5", "name": "Stardust Yield", "type": "Yield", "apy": 18.7, "risk": "Low", "tvl": 7430000, "subscribers": 4820, "desc": "Auto-compounding LP yield optimizer across vaults."},
    {"id": "s6", "name": "Comet Hedge", "type": "Hedge", "apy": 14.2, "risk": "Low", "tvl": 3210000, "subscribers": 1910, "desc": "Delta-neutral hedging to protect against drawdowns."},
]

TRADERS = [
    {"id": "t1", "name": "NeonWhale", "avatar": "av1.svg", "roi30d": 84.2, "winrate": 72, "followers": 2410, "aum": 1840000},
    {"id": "t2", "name": "CryptoNova", "avatar": "av2.svg", "roi30d": 56.7, "winrate": 68, "followers": 1820, "aum": 920000},
    {"id": "t3", "name": "VoidRunner", "avatar": "av3.svg", "roi30d": 121.4, "winrate": 64, "followers": 3120, "aum": 2640000},
    {"id": "t4", "name": "AuroraTrade", "avatar": "av4.svg", "roi30d": 38.9, "winrate": 75, "followers": 990, "aum": 540000},
    {"id": "t5", "name": "PulsarKing", "avatar": "av5.svg", "roi30d": 67.3, "winrate": 70, "followers": 1450, "aum": 780000},
]

BUSINESS_MODULES = [
    {"id": "ecommerce", "name": "E-Commerce", "desc": "On-chain escrow marketplace settled in ION.", "icon": "shop.svg", "volume": 4820000, "merchants": 312},
    {"id": "food", "name": "Food Delivery", "desc": "Instant ION payments for food orders.", "icon": "food.svg", "volume": 1240000, "merchants": 890},
    {"id": "ride", "name": "Ride Hailing", "desc": "Decentralized ride payments & driver staking.", "icon": "ride.svg", "volume": 2310000, "merchants": 1420},
    {"id": "insurance", "name": "Insurance", "desc": "Parametric coverage pools backed by ION.", "icon": "shield.svg", "volume": 980000, "merchants": 64},
    {"id": "logistics", "name": "Logistics", "desc": "Supply-chain tracking with ION settlement.", "icon": "truck.svg", "volume": 1670000, "merchants": 210},
]

VAULTS = [
    {"id": "v1", "name": "ION-USDT Stable Vault", "apy": 16.4, "tvl": 8420000, "strategy": "LP auto-compound", "risk": "Low"},
    {"id": "v2", "name": "BNB Yield Vault", "apy": 22.8, "tvl": 4210000, "strategy": "Lending + staking", "risk": "Medium"},
    {"id": "v3", "name": "Quantum Boost Vault", "apy": 41.2, "tvl": 1240000, "strategy": "Leveraged yield", "risk": "High"},
]

LP_POOLS = [
    {"id": "lp1", "pair": "ION/USDT", "apr": 48.2, "tvl": 12400000, "reward_token": "ION", "multiplier": "40x"},
    {"id": "lp2", "pair": "ION/BNB", "apr": 36.7, "tvl": 6800000, "reward_token": "ION", "multiplier": "25x"},
    {"id": "lp3", "pair": "BTC/USDT", "apr": 18.3, "tvl": 21400000, "reward_token": "ION", "multiplier": "15x"},
    {"id": "lp4", "pair": "ETH/USDT", "apr": 21.1, "tvl": 18200000, "reward_token": "ION", "multiplier": "18x"},
]


async def seed():
    if await db.pools.count_documents({}) == 0:
        pools = [
            {"id": "p1", "pair": "ION/USDT", "token_a": "ION", "token_b": "USDT", "reserve_a": 2580000, "reserve_b": 12435600, "tvl": 24871200, "apr": 48.2, "volume24h": 8420000, "fee": 0.001},
            {"id": "p2", "pair": "ION/BNB", "token_a": "ION", "token_b": "BNB", "reserve_a": 1240000, "reserve_b": 9760, "tvl": 11960000, "apr": 36.7, "volume24h": 4210000, "fee": 0.001},
            {"id": "p3", "pair": "BTC/USDT", "token_a": "BTC", "token_b": "USDT", "reserve_a": 310, "reserve_b": 22087500, "tvl": 44175000, "apr": 18.3, "volume24h": 12400000, "fee": 0.001},
            {"id": "p4", "pair": "ETH/USDT", "token_a": "ETH", "token_b": "USDT", "reserve_a": 4820, "reserve_b": 18532900, "tvl": 37065800, "apr": 21.1, "volume24h": 9800000, "fee": 0.001},
            {"id": "p5", "pair": "TON/USDT", "token_a": "TON", "token_b": "USDT", "reserve_a": 1820000, "reserve_b": 9864400, "tvl": 19728800, "apr": 29.4, "volume24h": 3200000, "fee": 0.001},
        ]
        await db.pools.insert_many(pools)
    if await db.burn.count_documents({}) == 0:
        await db.burn.insert_one({
            "id": "global", "total_burned": 87264192, "day_burned": 289612,
            "burn_rate": 18.5, "ion_price": 4.82, "market_phase": "bull",
            "history": [{"day": f"D-{6-i}", "amount": v} for i, v in enumerate([180000, 210000, 165000, 240000, 198000, 312000, 289612])],
            "updated": now_iso()
        })


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "ION DEX API", "master": MASTER_ADDRESS, "burn": BURN_ADDRESS}


@api_router.get("/tokens")
async def get_tokens():
    return TOKENS


@api_router.get("/trades/recent")
async def recent_trades(pair: str = "ION/USDT"):
    out = []
    base = 4.82
    for i in range(20):
        side = random.choice(["buy", "sell"])
        price = round(base * (1 + random.uniform(-0.01, 0.01)), 4)
        amt = round(random.uniform(50, 5000), 2)
        out.append({
            "id": uid(), "pair": pair, "side": side, "price": price,
            "amount": amt, "total": round(price * amt, 2),
            "time": (datetime.now(timezone.utc) - timedelta(seconds=i * 17)).strftime("%H:%M:%S"),
        })
    return out


@api_router.get("/swap/quote")
async def swap_quote(from_token: str, to_token: str, amount_in: float):
    prices = {t["symbol"]: t["price"] for t in TOKENS}
    if from_token not in prices or to_token not in prices:
        raise HTTPException(400, "Unknown token")
    raw = amount_in * prices[from_token] / prices[to_token]
    swap_fee = raw * 0.003
    out = raw - swap_fee
    fee_ion = (amount_in * prices[from_token] * 0.003) / prices["ION"]
    impact = min(amount_in / 100000, 0.05)
    return {
        "from_token": from_token, "to_token": to_token, "amount_in": amount_in,
        "amount_out": round(out * (1 - impact), 6), "rate": round(prices[from_token] / prices[to_token], 6),
        "fee_ion": round(fee_ion, 6), "price_impact": round(impact * 100, 3),
        "route": [from_token, "ION", to_token] if from_token != "ION" and to_token != "ION" else [from_token, to_token],
        "gas_estimate": round(random.uniform(0.0008, 0.0021), 5), "slippage": 0.5,
    }


@api_router.post("/swap")
async def do_swap(req: SwapRequest):
    q = await swap_quote(req.from_token, req.to_token, req.amount_in)
    rec = SwapRecord(address=req.address, from_token=req.from_token, to_token=req.to_token,
                     amount_in=req.amount_in, amount_out=q["amount_out"], fee_ion=q["fee_ion"],
                     tx_hash="0x" + uuid.uuid4().hex)
    await db.swaps.insert_one(rec.model_dump())
    return rec.model_dump()


@api_router.get("/pools")
async def get_pools():
    pools = await db.pools.find({}, {"_id": 0}).to_list(100)
    total_tvl = sum(p["tvl"] for p in pools)
    return {"total_tvl": total_tvl, "pools": pools}


@api_router.post("/pools/liquidity")
async def add_liq(req: LiquidityRequest):
    rec = {"id": uid(), "address": req.address, "pool_id": req.pool_id,
           "amount_a": req.amount_a, "amount_b": req.amount_b, "lp_tokens": round(math.sqrt(max(req.amount_a * req.amount_b, 0)), 4),
           "timestamp": now_iso()}
    await db.liquidity.insert_one(rec)
    return {k: v for k, v in rec.items()}


@api_router.get("/stake/products")
async def stake_products():
    return STAKE_PRODUCTS


@api_router.post("/stake")
async def do_stake(req: StakeRequest):
    prod = next((p for p in STAKE_PRODUCTS if p["id"] == req.product_id), None)
    if not prod:
        raise HTTPException(400, "Invalid product")
    end = datetime.now(timezone.utc) + timedelta(days=prod["lock_days"])
    rec = {"id": uid(), "address": req.address, "product_id": req.product_id, "product": prod["name"],
           "amount": req.amount, "apy": prod["apy"], "status": "active",
           "start": now_iso(), "end": end.isoformat(),
           "est_reward": round(req.amount * prod["apy"] / 100 * max(prod["lock_days"], 30) / 365, 4)}
    await db.stakes.insert_one(rec)
    return {k: v for k, v in rec.items()}


@api_router.get("/stake/positions")
async def stake_positions(address: str):
    items = await db.stakes.find({"address": address}, {"_id": 0}).to_list(200)
    total = sum(i["amount"] for i in items)
    return {"total_staked": total, "positions": items}


@api_router.get("/bridge/history")
async def bridge_history(address: str):
    items = await db.bridges.find({"address": address}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return items


@api_router.post("/bridge")
async def do_bridge(req: BridgeRequest):
    fee = round(req.amount * 0.001 + 0.5, 4)
    rec = {"id": uid(), "address": req.address, "from_chain": req.from_chain, "to_chain": req.to_chain,
           "token": req.token, "amount": req.amount, "fee": fee, "received": round(req.amount - fee, 4),
           "status": "completed", "tx_hash": "0x" + uuid.uuid4().hex, "timestamp": now_iso()}
    await db.bridges.insert_one(rec)
    return {k: v for k, v in rec.items()}


@api_router.get("/dashboard")
async def dashboard(address: str = ""):
    distribution = [
        {"asset": "ION", "value": 48200, "pct": 42, "color": "#00ffff"},
        {"asset": "USDT", "value": 28400, "pct": 25, "color": "#00ff88"},
        {"asset": "BNB", "value": 18600, "pct": 16, "color": "#6020ff"},
        {"asset": "BTC", "value": 12400, "pct": 11, "color": "#ffd166"},
        {"asset": "ETH", "value": 6800, "pct": 6, "color": "#ff00ff"},
    ]
    total = sum(d["value"] for d in distribution)
    burn = await db.burn.find_one({"id": "global"}, {"_id": 0})
    return {"total_value": total, "pnl24h": 8.4, "pnl_value": round(total * 0.084, 2),
            "distribution": distribution, "burn": burn}


@api_router.get("/burn/stats")
async def burn_stats():
    burn = await db.burn.find_one({"id": "global"}, {"_id": 0})
    return burn


@api_router.get("/ai/strategies")
async def ai_strategies():
    return AI_STRATEGIES


@api_router.post("/ai/subscribe-strategy")
async def sub_strategy(req: SubscribeRequest):
    rec = {"id": uid(), "address": req.address, "strategy_id": req.tier, "timestamp": now_iso()}
    await db.strategy_subs.insert_one(rec)
    return {k: v for k, v in rec.items()}


@api_router.get("/copytrade/traders")
async def copy_traders():
    return TRADERS


@api_router.post("/copytrade")
async def do_copy(req: CopyRequest):
    rec = {"id": uid(), "address": req.address, "trader_id": req.trader_id,
           "allocation": req.allocation, "status": "active", "timestamp": now_iso()}
    await db.copytrades.insert_one(rec)
    return {k: v for k, v in rec.items()}


@api_router.get("/subscription/tiers")
async def sub_tiers():
    return SUB_TIERS


@api_router.post("/subscription/subscribe")
async def subscribe(req: SubscribeRequest):
    tier = next((t for t in SUB_TIERS if t["id"] == req.tier), None)
    if not tier:
        raise HTTPException(400, "Invalid tier")
    rec = {"id": uid(), "address": req.address, "tier": req.tier, "price_ion": tier["price_ion"],
           "burned": round(tier["price_ion"] * 0.5, 2), "timestamp": now_iso()}
    await db.subscriptions.insert_one(rec)
    return {k: v for k, v in rec.items()}


@api_router.get("/orderbook")
async def orderbook(pair: str = "ION/USDT"):
    mid = 4.82
    bids, asks = [], []
    for i in range(15):
        bp = round(mid - (i + 1) * 0.004, 4)
        ap = round(mid + (i + 1) * 0.004, 4)
        bids.append({"price": bp, "amount": round(random.uniform(100, 8000), 2), "total": round(bp * random.uniform(100, 8000), 2)})
        asks.append({"price": ap, "amount": round(random.uniform(100, 8000), 2), "total": round(ap * random.uniform(100, 8000), 2)})
    return {"pair": pair, "mid": mid, "bids": bids, "asks": asks}


@api_router.post("/orders")
async def place_order(req: OrderRequest):
    rec = {"id": uid(), "address": req.address, "pair": req.pair, "side": req.side,
           "order_type": req.order_type, "price": req.price, "amount": req.amount,
           "status": "open" if req.order_type == "limit" else "filled", "timestamp": now_iso()}
    await db.orders.insert_one(rec)
    return {k: v for k, v in rec.items()}


@api_router.get("/orders")
async def get_orders(address: str):
    return await db.orders.find({"address": address}, {"_id": 0}).sort("timestamp", -1).to_list(100)


@api_router.get("/liquiditymine/pools")
async def lm_pools():
    return LP_POOLS


@api_router.get("/vault/list")
async def vault_list():
    total = sum(v["tvl"] for v in VAULTS)
    return {"total_tvl": total, "vaults": VAULTS}


@api_router.post("/vault/deposit")
async def vault_deposit(req: VaultRequest):
    rec = {"id": uid(), "address": req.address, "vault_id": req.vault_id, "amount": req.amount,
           "shares": round(req.amount * 0.98, 4), "timestamp": now_iso()}
    await db.vault_deposits.insert_one(rec)
    return {k: v for k, v in rec.items()}


@api_router.get("/business/modules")
async def business():
    return BUSINESS_MODULES


@api_router.get("/domains")
async def get_domains(address: str):
    return await db.domains.find({"address": address}, {"_id": 0}).to_list(100)


@api_router.post("/domains")
async def register_domain(req: DomainRequest):
    existing = await db.domains.find_one({"name": req.name})
    if existing:
        raise HTTPException(400, "Domain already registered")
    fee = req.years * 5
    rec = {"id": uid(), "address": req.address, "name": f"{req.name}.ion", "years": req.years,
           "fee_ion": fee, "burned": round(fee * 0.5, 2),
           "expires": (datetime.now(timezone.utc) + timedelta(days=365 * req.years)).isoformat(),
           "timestamp": now_iso()}
    await db.domains.insert_one(rec)
    return {k: v for k, v in rec.items()}


@api_router.post("/batchtransfer")
async def batch_transfer(req: BatchTransferRequest):
    total = sum(r.get("amount", 0) for r in req.recipients)
    fee = round(total * 0.001, 6)
    rec = {"id": uid(), "address": req.address, "token": req.token, "count": len(req.recipients),
           "total": total, "fee_ion": fee, "status": "completed",
           "tx_hash": "0x" + uuid.uuid4().hex, "timestamp": now_iso()}
    await db.batch_transfers.insert_one(rec)
    return {k: v for k, v in rec.items()}


@api_router.get("/approvals")
async def get_approvals(address: str):
    return [
        {"id": "a1", "token": "USDT", "spender": "DexSwap", "spender_addr": "0x10ED...a3F2", "amount": "Unlimited", "risk": "high"},
        {"id": "a2", "token": "ION", "spender": "StakeReward", "spender_addr": "0x88aB...91C4", "amount": "50,000", "risk": "low"},
        {"id": "a3", "token": "BNB", "spender": "BridgeRelay", "spender_addr": "0x77c9...4d11", "amount": "Unlimited", "risk": "medium"},
        {"id": "a4", "token": "ETH", "spender": "LiquidityPool", "spender_addr": "0x4f5a...88e0", "amount": "12.5", "risk": "low"},
    ]


@api_router.post("/approvals/revoke")
async def revoke(payload: dict):
    return {"status": "revoked", "id": payload.get("id"), "tx_hash": "0x" + uuid.uuid4().hex}


@api_router.get("/settings")
async def get_settings(address: str):
    s = await db.settings.find_one({"address": address}, {"_id": 0})
    if not s:
        return {"address": address, "slippage": 0.5, "gas_mode": "standard", "oracle": "dual", "multisig_threshold": 3}
    return s


@api_router.post("/settings")
async def save_settings(req: SettingsRequest):
    await db.settings.update_one({"address": req.address}, {"$set": req.model_dump()}, upsert=True)
    return req.model_dump()


MARKET = [
    {"symbol": "ION", "name": "ION Token", "price": 4.82, "change24h": 12.4, "volume": 18420000, "mcap": 482000000, "chain": "ION", "cat": "trending", "icon": "ion.svg"},
    {"symbol": "BTC", "name": "Bitcoin", "price": 71250.0, "change24h": 3.2, "volume": 88400000, "mcap": 1402000000000, "chain": "BSC", "cat": "trending", "icon": "btc.svg"},
    {"symbol": "ETH", "name": "Ethereum", "price": 3845.0, "change24h": 1.8, "volume": 54300000, "mcap": 462000000000, "chain": "ETH", "cat": "trending", "icon": "eth.svg"},
    {"symbol": "BNB", "name": "BNB", "price": 612.3, "change24h": -2.1, "volume": 31200000, "mcap": 89000000000, "chain": "BSC", "cat": "trending", "icon": "bnb.svg"},
    {"symbol": "TON", "name": "Toncoin", "price": 5.42, "change24h": 6.7, "volume": 12800000, "mcap": 18900000000, "chain": "ION", "cat": "gainer", "icon": "ton.svg"},
    {"symbol": "CAKE", "name": "PancakeSwap", "price": 2.31, "change24h": -4.3, "volume": 6700000, "mcap": 690000000, "chain": "BSC", "cat": "loser", "icon": "cake.svg"},
    {"symbol": "USDT", "name": "Tether USD", "price": 1.0, "change24h": 0.01, "volume": 42100000, "mcap": 112000000000, "chain": "BSC", "cat": "stable", "icon": "usdt.svg"},
    {"symbol": "USDC", "name": "USD Coin", "price": 1.0, "change24h": 0.0, "volume": 22100000, "mcap": 34000000000, "chain": "ETH", "cat": "stable", "icon": "usdc.svg"},
    {"symbol": "NOVA", "name": "Nova Finance", "price": 0.084, "change24h": 48.2, "volume": 2400000, "mcap": 8400000, "chain": "ION", "cat": "new", "icon": "ion.svg"},
    {"symbol": "PULSAR", "name": "Pulsar DAO", "price": 1.92, "change24h": 31.5, "volume": 5100000, "mcap": 19200000, "chain": "ION", "cat": "gainer", "icon": "ion.svg"},
    {"symbol": "VOID", "name": "Void Protocol", "price": 0.0042, "change24h": 124.0, "volume": 980000, "mcap": 4200000, "chain": "ION", "cat": "new", "icon": "ion.svg"},
    {"symbol": "QUANT", "name": "Quantum", "price": 18.4, "change24h": -8.7, "volume": 3200000, "mcap": 184000000, "chain": "ETH", "cat": "loser", "icon": "eth.svg"},
    {"symbol": "AURO", "name": "Aurora Cash", "price": 0.62, "change24h": 19.3, "volume": 1800000, "mcap": 31000000, "chain": "ION", "cat": "gainer", "icon": "ion.svg"},
    {"symbol": "NEBL", "name": "Nebula", "price": 3.18, "change24h": -12.4, "volume": 2600000, "mcap": 95000000, "chain": "BSC", "cat": "loser", "icon": "bnb.svg"},
]


@api_router.get("/market")
async def market(cat: str = "all", q: str = ""):
    items = MARKET
    if cat and cat != "all":
        if cat == "gainer":
            items = sorted([m for m in MARKET], key=lambda x: -x["change24h"])[:8]
        elif cat == "loser":
            items = sorted([m for m in MARKET], key=lambda x: x["change24h"])[:8]
        else:
            items = [m for m in MARKET if m["cat"] == cat]
    if q:
        ql = q.lower()
        items = [m for m in items if ql in m["symbol"].lower() or ql in m["name"].lower()]
    return items


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await seed()
    logger.info("ION DEX API seeded and ready")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
