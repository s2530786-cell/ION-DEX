from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Numeric, Integer
from models.base import Base
from datetime import datetime


class ChainTransaction(Base):
    __tablename__ = "chain_transaction"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    chain_type = Column(String(20), nullable=False)
    tx_hash = Column(String(66), unique=True, nullable=False)
    block_number = Column(BigInteger, nullable=False)
    block_time = Column(DateTime, nullable=False)
    from_address = Column(String(42), nullable=False)
    to_address = Column(String(42))
    contract_address = Column(String(42))
    tx_type = Column(String(30), nullable=False)
    token_symbol = Column(String(50))
    token_decimals = Column(Integer, default=18)
    amount = Column(Numeric(78, 18), default=0)
    gas_used = Column(Numeric(78, 18), default=0)
    status = Column(Boolean, nullable=False)
    create_time = Column(DateTime, nullable=False, default=datetime.utcnow)
