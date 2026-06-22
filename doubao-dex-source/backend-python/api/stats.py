from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from models.global_stats import GlobalStats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/global")
async def get_global_stats(db=Depends(get_db)):
    res = await db.execute(select(GlobalStats).order_by(GlobalStats.stat_date.desc()).limit(30))
    return {"code": 0, "data": [dict(i.__dict__) for i in res.scalars()]}
