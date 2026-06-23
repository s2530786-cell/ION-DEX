from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Numeric, Text
from models.base import Base
from datetime import datetime


class UserProfile(Base):
    __tablename__ = "user_profile"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    wallet_address = Column(String(42), unique=True, nullable=False)
    chain_type = Column(String(20), nullable=False)
    nickname = Column(String(100))
    theme = Column(String(20), default="dark")
    lang = Column(String(10), default="en")
    default_slippage = Column(Numeric(5, 2), default=0.5)
    default_gas_mode = Column(String(20), default="standard")
    create_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    update_time = Column(DateTime, nullable=False, default=datetime.utcnow)


class UserNotice(Base):
    __tablename__ = "user_notice"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    wallet_address = Column(String(42), nullable=False)
    chain_type = Column(String(20), nullable=False)
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String(30), nullable=False)
    is_read = Column(Boolean, default=False)
    create_time = Column(DateTime, nullable=False, default=datetime.utcnow)


class GlobalStats(Base):
    __tablename__ = "global_stats"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    stat_date = Column(Date, nullable=False, unique=True)
    total_users = Column(BigInteger, default=0)
    total_volume = Column(Numeric(30, 8), default=0)
    total_fee = Column(Numeric(30, 8), default=0)
    total_lp = Column(Numeric(30, 8), default=0)
    create_time = Column(DateTime, nullable=False, default=datetime.utcnow)
