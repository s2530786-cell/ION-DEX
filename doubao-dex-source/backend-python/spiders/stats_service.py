from sqlalchemy import func, select
from core.database import AsyncSessionLocal
from models.global_stats import GlobalStats
from models.user_asset import UserAsset
from models.chain_transaction import ChainTransaction
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, date

scheduler = AsyncIOScheduler(timezone="UTC")


async def daily_stat():
    today = date.today()
    async with AsyncSessionLocal() as db:
        user_cnt = await db.scalar(select(func.count(func.distinct(UserAsset.wallet_address))))
        vol = await db.scalar(select(func.sum(ChainTransaction.amount)).where(ChainTransaction.create_time >= today))
        stat = GlobalStats(
            stat_date=today,
            total_users=user_cnt or 0,
            total_volume=vol or 0
        )
        await db.merge(stat)
        await db.commit()


scheduler.add_job(daily_stat, "cron", hour=0, minute=0)
scheduler.start()
