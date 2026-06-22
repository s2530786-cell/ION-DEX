from core.database import AsyncSessionLocal
from models.risk_address import RiskAddress
from core.logger import logger

LARGE_AMOUNT = 10000


async def risk_check(chain: str, from_addr: str, to_addr: str, amount: float, tx_type: str) -> dict:
    async with AsyncSessionLocal() as db:
        res = await db.execute(RiskAddress.__table__.select().where(RiskAddress.address == to_addr.lower()))
        hit = res.scalar_one_or_none()
        risk = False
        risk_msg = ""
        if hit:
            risk = True
            risk_msg = f"target address on blacklist: {hit.risk_type}"
        if amount >= LARGE_AMOUNT:
            risk = True
            risk_msg = f"large transaction, amount: {amount}"
        return {"risk": risk, "msg": risk_msg}
