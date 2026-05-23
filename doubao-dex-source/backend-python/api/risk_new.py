from fastapi import APIRouter, Depends
from spiders.risk_service import risk_check
from core.auth import get_current_address

router = APIRouter(prefix="/risk-new", tags=["advanced risk"])


@router.get("/check-trade")
async def check_trade(
    chain: str, to_addr: str, amount: float, tx_type: str, addr=Depends(get_current_address)
):
    return await risk_check(chain, addr, to_addr, amount, tx_type)
