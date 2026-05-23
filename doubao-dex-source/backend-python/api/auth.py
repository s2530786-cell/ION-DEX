from fastapi import APIRouter, Depends
from core.auth import create_access_token, verify_signature, WalletLogin
from slowapi import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
@limiter.limit("10/minute")
async def wallet_login(body: WalletLogin):
    if not verify_signature(body.address, body.signature, body.message):
        return {"code": 401, "detail": "signature verification failed"}
    token = create_access_token(body.address.lower())
    return {"code": 0, "token": token, "address": body.address.lower()}
