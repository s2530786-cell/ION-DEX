from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from models.transaction import ChainTransaction

router = APIRouter(prefix="/tx", tags=["transactions"])


@router.get("/list")
async def get_tx_list(wallet: str, chain: str, page: int = 1, size: int = 20, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(ChainTransaction)
        .where(ChainTransaction.from_address == wallet, ChainTransaction.chain_type == chain)
        .order_by(ChainTransaction.block_number.desc())
        .limit(size)
        .offset((page - 1) * size)
    )
    res = await db.execute(stmt)
    return {"code": 0, "data": [dict(t.__dict__) for t in res.scalars()]}
