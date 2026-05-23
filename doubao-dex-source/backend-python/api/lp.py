from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from models.lp_stake import UserLpStake

router = APIRouter(prefix="/lp", tags=["LP farming"])


@router.get("/list")
async def get_lp_list(wallet: str, chain: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(UserLpStake).where(UserLpStake.wallet_address == wallet, UserLpStake.chain_type == chain)
    )
    return {"code": 0, "data": [dict(i.__dict__) for i in res.scalars()]}
