import asyncio
from web3 import AsyncWeb3
from core.logger import logger
from core.redis_client import redis_client
from spiders.rpc_pool import CHAIN_CONFIG
from spiders.event_parser import parse_chain_event
from core.config import settings

WATCH_EVENTS = ["Transfer", "Approval", "Swap", "AddLiquidity", "RemoveLiquidity", "Stake", "Unstake", "RewardClaim"]


class WebSocketEventListener:
    def __init__(self, chain_type: str):
        self.chain_type = chain_type
        self.ws_url = CHAIN_CONFIG[chain_type]["ws_url"]
        if not self.ws_url:
            logger.warning(f"[{chain_type}] no WS URL configured, skipping WS listener")
        self.w3: AsyncWeb3 | None = None
        self.is_running = True

    async def connect(self):
        self.w3 = AsyncWeb3(AsyncWeb3.AsyncWebsocketProvider(self.ws_url))
        await self.w3.is_connected()
        logger.info(f"[{self.chain_type}] WS connected")

    async def event_filter(self):
        sigs = [self.w3.keccak(text=e).hex() for e in WATCH_EVENTS]
        return await self.w3.eth.filter({"topics": [sigs]})

    async def handle_event(self, event: dict):
        tx_hash = event["transactionHash"].hex()
        dup_key = f"event:dup:{self.chain_type}:{tx_hash}"
        if await redis_client.exists(dup_key):
            return
        await redis_client.setex(dup_key, settings.EVENT_DUPLICATE_EXPIRE, "1")
        await parse_chain_event(self.chain_type, event)

    async def run(self):
        if not self.ws_url:
            return
        while self.is_running:
            try:
                await self.connect()
                evt_filter = await self.event_filter()
                while True:
                    events = await self.w3.eth.get_filter_changes(evt_filter.filter_id)
                    for e in events:
                        await self.handle_event(e)
                    await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"WS error {self.chain_type}: {str(e)}, reconnecting in 3s")
                await asyncio.sleep(3)


async def start_all_ws():
    tasks = [WebSocketEventListener(c).run() for c in ["ION", "BSC", "ETH"]]
    await asyncio.gather(*tasks)
