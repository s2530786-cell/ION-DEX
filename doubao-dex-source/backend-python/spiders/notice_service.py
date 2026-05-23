from core.database import AsyncSessionLocal
from models.user_notice import UserNotice
from core.logger import logger
from datetime import datetime


async def push_notice(chain: str, address: str, title: str, content: str, n_type: str):
    async with AsyncSessionLocal() as db:
        notice = UserNotice(
            wallet_address=address.lower(),
            chain_type=chain,
            title=title,
            content=content,
            type=n_type,
            create_time=datetime.utcnow()
        )
        db.add(notice)
        await db.commit()
        logger.info(f"notice pushed {address}: {title}")
