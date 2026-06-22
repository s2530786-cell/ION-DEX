from sqlalchemy import Column, BigInteger, String, DateTime
from models.base import Base
from datetime import datetime


class UserWallet(Base):
    __tablename__ = "user_wallet"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    wallet_address = Column(String(42), nullable=False)
    chain_type = Column(String(20), nullable=False)
    bind_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    is_main = Column(Boolean, nullable=False, default=False)
    remark = Column(String(255))
