from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from web3 import Web3

SECRET_KEY = "your-prod-secret-key-replace-this-32bit-long-random-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class WalletLogin(BaseModel):
    address: str
    signature: str
    message: str


def create_access_token(address: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": address, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_signature(address: str, signature: str, message: str) -> bool:
    try:
        recovered = Web3().eth.account.recover_message(message, signature=signature)
        return recovered.lower() == address.lower()
    except Exception:
        return False


async def get_current_address(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        addr: str = payload.get("sub")
        if addr is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return addr.lower()
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")
