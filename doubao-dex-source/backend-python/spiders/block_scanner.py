import asyncio
from sqlalchemy import select
from core.logger import logger
from core.config import settings
from core.database import AsyncSessionLocal
from spiders.rpc_pool import CHAIN_RPC_MAP
from models.scan_progress import ScanProgress
from spiders.event_parser import parse_chain_event
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler(timezone="UTC")


async def scan_chain_blocks(chain_type: str):
    async with AsyncSessionLocal() as db:
        rpc = CHAIN_RPC_MAP[chain_type]
        w3 = await rpc.get_w3()
        latest_block = await w3.eth.block_number

        res = await db.execute(select(ScanProgress).where(ScanProgress.chain_type == chain_type))
        prog = res.scalar_one_or_none()
        if not prog:
            start_block = latest_block - settings.SCAN_START_OFFSET
            db.add(ScanProgress(chain_type=chain_type, last_scan_block=start_block))
            await db.commit()
        else:
            start_block = prog.last_scan_block + 1

        end_block = min(start_block + settings.SCAN_BLOCK_BATCH, latest_block)
        if start_block > end_block:
            return

        logger.info(f"[{chain_type}] scanning blocks {start_block} ~ {end_block}")
        for bn in range(start_block, end_block + 1):
            try:
                blk = await w3.eth.get_block(bn, full_transactions=True)
                for tx in blk.transactions:
                    rcpt = await w3.eth.get_transaction_receipt(tx["hash"])
                    for log in rcpt.logs:
                        await parse_chain_event(chain_type, log)
            except Exception as e:
                logger.warning(f"block {bn} scan error: {str(e)}")

        if prog:
            prog.last_scan_block = end_block
        else:
            prog = ScanProgress(chain_type=chain_type, last_scan_block=end_block)
            db.add(prog)
        await db.commit()


async def start_block_scanner():
    for c in ["ION", "BSC", "ETH"]:
        scheduler.add_job(scan_chain_blocks, "interval", seconds=settings.BLOCK_SCAN_INTERVAL, args=[c])
    scheduler.start()
    logger.info("block scanner started")
