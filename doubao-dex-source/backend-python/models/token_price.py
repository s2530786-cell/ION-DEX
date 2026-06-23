from sqlalchemy import Column, BigInteger, String, Numeric, DateTime
from models.base import Base


class TokenPrice(Base):
    __tablename__ = "token_price"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    chain_type = Column(String(20), nullable=False)
    contract_address = Column(String(42), nullable=False)
    symbol = Column(String(50), nullable=False)
    price_usd = Column(Numeric(20, 8), nullable=False, default=0)
    price_change_24h = Column(Numeric(10, 4), default=0)
    volume_24h = Column(Numeric(30, 8), default=0)
    timestamp = Column(DateTime, nullable=False)
