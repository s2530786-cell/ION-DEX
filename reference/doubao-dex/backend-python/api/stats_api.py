# 收益 & 无常损失统计 API
from fastapi import APIRouter
from core.price_oracle import price_oracle
from core.database import AsyncSessionLocal
from sqlalchemy import text
from core.limiter import limiter

router = APIRouter(prefix="/stats", tags=["收益&无常损失统计"])


@router.get("/il")
@limiter.limit("100/minute")
async def calc_impermanent_loss(price_start: float, price_now: float):
    """LP无常损失计算器"""
    ratio = price_now / price_start
    il = 2 * (ratio ** 0.5) / (1 + ratio) - 1
    return {"code": 0, "il_percent": round(il * 100, 4)}


@router.get("/apy/lp")
@limiter.limit("100/minute")
async def get_lp_apy():
    """实时LP质押APY：24h手续费 / TVL * 365"""
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            text("SELECT SUM(fee_usd) FROM trade_fee WHERE create_time > now() - interval '24 hours'")
        )
        fee_24h = res.scalar() or 0
        tvl = 1000000  # 临时默认值，需替换为链上查询
        apy = (fee_24h / tvl) * 365 * 100
        return {"code": 0, "apy": round(apy, 2)}


@router.get("/treasury")
@limiter.limit("60/minute")
async def get_treasury_income():
    """国库收益可视化统计"""
    async with AsyncSessionLocal() as db:
        day = await db.execute(
            text("SELECT SUM(team_fee_usd) FROM trade_fee WHERE create_time > now() - interval '1 day'")
        )
        week = await db.execute(
            text("SELECT SUM(team_fee_usd) FROM trade_fee WHERE create_time > now() - interval '7 days'")
        )
        total = await db.execute(text("SELECT SUM(team_fee_usd) FROM trade_fee"))
        return {
            "code": 0,
            "day_income": round(day.scalar() or 0, 2),
            "week_income": round(week.scalar() or 0, 2),
            "total_income": round(total.scalar() or 0, 2)
        }
