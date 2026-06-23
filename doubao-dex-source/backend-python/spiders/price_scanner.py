import aiohttp
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import settings
from core.logger import logger
from core.database import AsyncSessionLocal
from models.token_price import TokenPrice
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler

price_scheduler = AsyncIOScheduler(timezone="UTC")


async def fetch_token_prices():
    async with aiohttp.ClientSession() as session:
        try:
            url = f"{settings.COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1"
            async with session.get(url) as resp:
                data = await resp.json()
        except Exception as e:
            logger.error(f"price scanner failed: {str(e)}")
            return

    async with AsyncSessionLocal() as db:
        for item in data:
            tp = TokenPrice(
                chain_type="BSC",
                contract_address=item.get("contract_address", ""),
                symbol=item["symbol"].upper(),
                price_usd=item["current_price"],
                price_change_24h=item.get("price_change_percentage_24h", 0),
                volume_24h=item.get("total_volume", 0),
                timestamp=datetime.utcnow()
            )
            db.add(tp)
        await db.commit()


async def start_price_scanner():
    price_scheduler.add_job(fetch_token_prices, "interval", seconds=settings.PRICE_SCAN_INTERVAL)
    price_scheduler.start()
    logger.info("price scanner started")
