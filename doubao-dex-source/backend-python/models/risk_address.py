from sqlalchemy import Column, BigInteger, String, DateTime
from models.base import Base
from datetime import datetime


class RiskAddress(Base):
    __tablename__ = "risk_address"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    address = Column(String(42), unique=True, nullable=False)
    risk_type = Column(String(30), nullable=False)
    remark = Column(String(255))
    create_time = Column(DateTime, nullable=False, default=datetime.utcnow)
