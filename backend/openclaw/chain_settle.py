# 链下撮合 → 链上自动批量结算（节流版）
import asyncio
from web3 import AsyncWeb3
from pydantic import BaseModel
from typing import List
from openclaw.config import openclaw_cfg
from core.match_engine import match_engine, Order
from core.config import settings
from spiders.rpc_pool import CHAIN_RPC_MAP
from openclaw.alert import alert
from core.logger import logger
from core.gas_manager import gas_manager


class SettleTask(BaseModel):
    order_id: str
    user: str
    is_buy: bool
    price: float
    fill_amount: float


class ChainSettle:
    def __init__(self):
        self.pending_settle: List[SettleTask] = []
        self.rpc = CHAIN_RPC_MAP["ION"]
        self.w3: AsyncWeb3 = None
        self.order_book_abi = [
            "function matchOrder(uint256 id,uint256 fillAmt) external"
        ]
        self.order_book_addr = settings.ORDER_BOOK_CONTRACT
        self.private_key = settings.OWNER_PRIVATE_KEY
        self.retry_max = 3

    async def init(self):
        self.w3 = await self.rpc.get_w3()

    def add_task(self, order: Order):
        if order.amount_filled > 0:
            self.pending_settle.append(SettleTask(
                order_id=order.order_id,
                user=order.user,
                is_buy=order.is_buy,
                price=order.price,
                fill_amount=order.amount_filled
            ))

    async def batch_settle(self):
        if not self.pending_settle:
            return
        try:
            # 单次最多结算10条，避免Gas拥堵+RPC暴打
            batch = self.pending_settle[:10]
            for task in batch:
                contract = self.w3.eth.contract(address=self.order_book_addr, abi=self.order_book_abi)
                fill_wei = int(task.fill_amount * 10**18)
                tx = await contract.functions.matchOrder(
                    int(task.order_id.replace("ord_", "")), fill_wei
                ).build_transaction({
                    "from": settings.OWNER_WALLET,
                    "gas": 150000,
                    "gasPrice": await gas_manager.get_gas_price(self.w3, "standard")
                })
                await gas_manager.send_with_retry(self.w3, tx, self.private_key, self.retry_max)
                logger.info(f"链上结算成功 {task.order_id}")
            self.pending_settle = self.pending_settle[10:]
        except Exception as e:
            logger.error(f"批量结算异常: {str(e)}")
            alert.push("⚠️ 链上订单结算失败", str(e))

    async def loop(self):
        await self.init()
        while True:
            await self.batch_settle()
            await asyncio.sleep(openclaw_cfg.SETTLE_INTERVAL)


chain_settle = ChainSettle()
