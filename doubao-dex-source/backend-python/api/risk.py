from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from models.risk_address import RiskAddress

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("/check-address")
async def check_address(addr: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(RiskAddress).where(RiskAddress.address == addr))
    hit = res.scalar_one_or_none()
    return {"code": 0, "is_risk": bool(hit), "info": hit}
