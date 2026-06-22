from web3 import AsyncWeb3
from core.config import settings
from core.logger import logger


CHAIN_CONFIG = {
    "ION": {"rpc_list": [settings.ION_RPC_MAIN, settings.ION_RPC_BACKUP], "ws_url": settings.ION_WS_WSS},
    "BSC": {"rpc_list": [settings.BSC_RPC_MAIN, settings.BSC_RPC_BACKUP], "ws_url": settings.BSC_WS_WSS},
    "ETH": {"rpc_list": [settings.ETH_RPC_MAIN, settings.ETH_RPC_BACKUP], "ws_url": settings.ETH_WS_WSS},
}


class MultiChainRPC:
    def __init__(self, chain_type: str):
        self.chain_type = chain_type
        self.rpc_list = CHAIN_CONFIG[chain_type]["rpc_list"]
        self.ws_url = CHAIN_CONFIG[chain_type]["ws_url"]
        self.current_rpc_idx = 0
        self.w3: AsyncWeb3 | None = None

    async def init_w3(self) -> AsyncWeb3:
        for idx, rpc in enumerate(self.rpc_list):
            try:
                w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(rpc))
                if await w3.is_connected():
                    self.current_rpc_idx = idx
                    self.w3 = w3
                    logger.success(f"【{self.chain_type}】RPC OK: {rpc}")
                    return self.w3
            except Exception as e:
                logger.warning(f"【{self.chain_type}】RPC fail {rpc}: {str(e)}")
        raise ConnectionError(f"{self.chain_type} all RPC unavailable")

    async def get_w3(self) -> AsyncWeb3:
        if not self.w3 or not await self.w3.is_connected():
            self.current_rpc_idx = (self.current_rpc_idx + 1) % len(self.rpc_list)
            await self.init_w3()
        return self.w3


ion_rpc = MultiChainRPC("ION")
bsc_rpc = MultiChainRPC("BSC")
eth_rpc = MultiChainRPC("ETH")
CHAIN_RPC_MAP = {"ION": ion_rpc, "BSC": bsc_rpc, "ETH": eth_rpc}
