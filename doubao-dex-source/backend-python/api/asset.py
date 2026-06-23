from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from models.asset import UserAsset

router = APIRouter(prefix="/asset", tags=["assets"])


@router.get("/list")
async def get_user_assets(wallet: str, chain: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(UserAsset).where(UserAsset.wallet_address == wallet, UserAsset.chain_type == chain)
    )
    return {"code": 0, "data": [dict(a.__dict__) for a in res.scalars()]}
