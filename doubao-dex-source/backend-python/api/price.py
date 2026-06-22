from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from models.token_price import TokenPrice

router = APIRouter(prefix="/price", tags=["price"])


@router.get("/token")
async def get_token_price(chain: str, contract: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(TokenPrice)
        .where(TokenPrice.chain_type == chain, TokenPrice.contract_address == contract)
        .order_by(TokenPrice.timestamp.desc())
        .limit(1)
    )
    res = await db.execute(stmt)
    return {"code": 0, "data": res.scalar_one_or_none()}


@router.get("/kline/data")
async def get_kline_data(chain: str, contract: str, period: str = "1m", db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    from datetime import datetime, timedelta
    from spiders.rpc_pool import CHAIN_RPC_MAP

    now = datetime.utcnow()
    if period == "1d":
        start = now - timedelta(days=30)
    elif period == "1h":
        start = now - timedelta(days=7)
    else:
        start = now - timedelta(days=1)

    stmt = (
        select(TokenPrice)
        .where(
            TokenPrice.chain_type == chain,
            TokenPrice.contract_address == contract,
            TokenPrice.timestamp >= start
        )
        .order_by(TokenPrice.timestamp)
    )
    res = await db.execute(stmt)
    price_rows = res.scalars().all()

    kline = []
    for row in price_rows:
        ts = int(row.timestamp.timestamp() * 1000)
        price = float(row.price_usd)
        vol = float(row.volume_24h or 0)
        kline.append([ts, price, price, price, price, vol])

    return {"code": 0, "kline": kline}
