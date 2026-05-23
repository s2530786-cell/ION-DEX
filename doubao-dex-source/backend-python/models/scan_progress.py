from sqlalchemy import Column, BigInteger, String, DateTime
from models.base import Base
from datetime import datetime


class ScanProgress(Base):
    __tablename__ = "scan_progress"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    chain_type = Column(String(20), unique=True, nullable=False)
    last_scan_block = Column(BigInteger, nullable=False, default=0)
    update_time = Column(DateTime, nullable=False, default=datetime.utcnow)
