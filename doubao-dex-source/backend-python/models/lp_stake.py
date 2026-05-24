from sqlalchemy import Column, BigInteger, String, Numeric, DateTime
from models.base import Base
from datetime import datetime


class UserLpStake(Base):
    __tablename__ = "user_lp_stake"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    wallet_address = Column(String(42), nullable=False)
    chain_type = Column(String(20), nullable=False)
    pool_address = Column(String(42), nullable=False)
    lp_amount = Column(Numeric(78, 18), default=0)
    stake_amount = Column(Numeric(78, 18), default=0)
    pending_reward = Column(Numeric(78, 18), default=0)
    apy = Column(Numeric(10, 4), default=0)
    create_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    update_time = Column(DateTime, nullable=False, default=datetime.utcnow)
