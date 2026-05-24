from sqlalchemy import Column, BigInteger, String, Numeric, DateTime
from models.base import Base
from datetime import datetime


class UserAsset(Base):
    __tablename__ = "user_asset"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    wallet_address = Column(String(42), nullable=False)
    chain_type = Column(String(20), nullable=False)
    contract_address = Column(String(42), nullable=False)
    token_symbol = Column(String(50))
    token_name = Column(String(100))
    balance = Column(Numeric(78, 18), nullable=False, default=0)
    usd_value = Column(Numeric(20, 8), default=0)
    update_time = Column(DateTime, nullable=False, default=datetime.utcnow)
