# 合约暂停监控 — 三位一体风控（节流版）
import asyncio
from web3 import AsyncWeb3
from openclaw.config import openclaw_cfg
from openclaw.alert import alert
from core.match_engine import match_engine
from core.logger import logger
from spiders.rpc_pool import CHAIN_RPC_MAP

ADMIN_ABI = ["function paused() view returns(bool)"]


class EmergencyWatch:
    def __init__(self):
        self.w3 = None
        self.last_paused = False
        self.admin_addr = openclaw_cfg.ADMIN_CONTRACT

    async def init(self):
        self.w3 = await CHAIN_RPC_MAP["ION"].get_w3()

    async def check_pause_status(self):
        contract = self.w3.eth.contract(address=self.admin_addr, abi=ADMIN_ABI)
        paused = await contract.functions.paused().call()
        if paused and not self.last_paused:
            alert.push("🚨 合约紧急暂停触发", "DEX 已全局冻结，后端撮合已关闭")
            match_engine.buy_orders.clear()
            match_engine.sell_orders.clear()
            self.last_paused = True
        elif not paused and self.last_paused:
            alert.push("✅ 合约已解除暂停，恢复正常交易")
            self.last_paused = False

    async def loop(self):
        await self.init()
        while True:
            await self.check_pause_status()
            await asyncio.sleep(openclaw_cfg.EMERGENCY_WATCH_INTERVAL)


emergency_watch = EmergencyWatch()
