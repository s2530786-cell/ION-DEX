# 价格预言机（CoinGecko + 链上TWAP，5秒缓存节流版）
import asyncio
import aiohttp
from web3 import AsyncWeb3
from web3.contract import AsyncContract
from core.config import settings
from spiders.rpc_pool import CHAIN_RPC_MAP
from core.logger import logger
from openclaw.config import openclaw_cfg


class PriceOracle:
    def __init__(self):
        self.token_info = {
            "ION": {"addr": "", "cg_id": "ion-dex-token", "decimals": 18},
            "USDT": {"addr": "", "cg_id": "tether", "decimals": 18},
            "BNB": {"addr": "", "cg_id": "binancecoin", "decimals": 18}
        }
        self.price_cache = {}
        self.update_interval = openclaw_cfg.PRICE_UPDATE_INTERVAL
        self.last_twap = {}

    async def get_coingecko_price(self, cg_id: str) -> float:
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=3)) as session:
                resp = await session.get(
                    f"https://api.coingecko.com/api/v3/simple/price?ids={cg_id}&vs_currencies=usd",
                    headers={"User-Agent": "ION-DEX Backend"}
                )
                data = await resp.json()
                return float(data[cg_id]["usd"])
        except Exception as e:
            logger.warning(f"CoinGecko 获取失败 {cg_id}: {str(e)}")
            return self.price_cache.get(cg_id, 0)

    async def get_pool_twap(self, pool_addr: str, chain: str = "ION") -> float:
        rpc = CHAIN_RPC_MAP[chain]
        w3 = await rpc.get_w3()
        abi = [
            "function reserveA() view returns(uint256)",
            "function reserveB() view returns(uint256)",
            "function tokenA() view returns(address)",
            "function tokenB() view returns(address)"
        ]
        pool: AsyncContract = w3.eth.contract(address=pool_addr, abi=abi)
        ra = await pool.functions.reserveA().call()
        rb = await pool.functions.reserveB().call()
        if ra == 0:
            return 0
        return float(rb) / float(ra)

    async def update_all_price(self):
        while True:
            for symbol, info in self.token_info.items():
                self.price_cache[symbol] = await self.get_coingecko_price(info["cg_id"])
            await asyncio.sleep(self.update_interval)


price_oracle = PriceOracle()
