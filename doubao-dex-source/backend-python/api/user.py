from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from models.user_profile import UserProfile
from core.auth import get_current_address

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/profile")
async def get_profile(chain: str, db=Depends(get_db), addr=Depends(get_current_address)):
    res = await db.execute(
        select(UserProfile).where(UserProfile.wallet_address == addr, UserProfile.chain_type == chain)
    )
    p = res.scalar_one_or_none()
    if not p:
        p = UserProfile(wallet_address=addr, chain_type=chain)
        db.add(p)
        await db.commit()
    return {"code": 0, "data": dict(p.__dict__)}


@router.post("/setting")
async def update_setting(
    theme: str = None, lang: str = None, slippage: float = None,
    gas_mode: str = None, chain: str = None, db=Depends(get_db), addr=Depends(get_current_address)
):
    stmt = update(UserProfile).where(UserProfile.wallet_address == addr, UserProfile.chain_type == chain)
    if theme:
        stmt = stmt.values(theme=theme)
    if lang:
        stmt = stmt.values(lang=lang)
    if slippage:
        stmt = stmt.values(default_slippage=slippage)
    if gas_mode:
        stmt = stmt.values(default_gas_mode=gas_mode)
    await db.execute(stmt)
    await db.commit()
    return {"code": 0, "msg": "updated"}
