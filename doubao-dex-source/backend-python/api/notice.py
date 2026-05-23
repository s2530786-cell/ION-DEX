from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from models.user_notice import UserNotice
from core.auth import get_current_address

router = APIRouter(prefix="/notice", tags=["notifications"])


@router.get("/list")
async def get_notices(
    chain: str, page: int = 1, size: int = 20, db=Depends(get_db), addr=Depends(get_current_address)
):
    stmt = (
        select(UserNotice)
        .where(UserNotice.wallet_address == addr, UserNotice.chain_type == chain)
        .order_by(UserNotice.create_time.desc())
        .limit(size)
        .offset((page - 1) * size)
    )
    res = await db.execute(stmt)
    return {"code": 0, "data": [dict(i.__dict__) for i in res.scalars()]}


@router.post("/read-all")
async def read_all(chain: str, db=Depends(get_db), addr=Depends(get_current_address)):
    await db.execute(
        update(UserNotice).where(
            UserNotice.wallet_address == addr, UserNotice.chain_type == chain
        ).values(is_read=True)
    )
    await db.commit()
    return {"code": 0}
