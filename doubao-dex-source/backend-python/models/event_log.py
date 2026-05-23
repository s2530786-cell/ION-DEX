from sqlalchemy import Column, BigInteger, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from models.base import Base
from datetime import datetime


class ContractEventLog(Base):
    __tablename__ = "contract_event_log"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    chain_type = Column(String(20), nullable=False)
    tx_hash = Column(String(66), nullable=False)
    block_number = Column(BigInteger, nullable=False)
    contract_address = Column(String(42), nullable=False)
    event_name = Column(String(50), nullable=False)
    event_data = Column(JSONB, nullable=False)
    create_time = Column(DateTime, nullable=False, default=datetime.utcnow)
