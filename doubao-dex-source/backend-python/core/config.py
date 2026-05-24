from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseSettings):
    ENV: str = os.getenv("ENV", "dev")
    SERVER_HOST: str = os.getenv("SERVER_HOST", "127.0.0.1")
    SERVER_PORT: int = int(os.getenv("SERVER_PORT", "8000"))
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")

    DB_URL: str = f"{os.getenv('DB_DRIVER', 'postgresql+asyncpg')}://{os.getenv('DB_USER', 'postgres')}:{os.getenv('DB_PASSWORD', '123456')}@{os.getenv('DB_HOST', '127.0.0.1')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'dex_db')}"

    REDIS_HOST: str = os.getenv("REDIS_HOST", "127.0.0.1")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))

    SCAN_START_OFFSET: int = int(os.getenv("SCAN_START_OFFSET", "1000"))
    SCAN_BLOCK_BATCH: int = int(os.getenv("SCAN_BLOCK_BATCH", "100"))
    BLOCK_SCAN_INTERVAL: int = int(os.getenv("BLOCK_SCAN_INTERVAL", "300"))
    PRICE_SCAN_INTERVAL: int = int(os.getenv("PRICE_SCAN_INTERVAL", "60"))
    EVENT_DUPLICATE_EXPIRE: int = int(os.getenv("EVENT_DUPLICATE_EXPIRE", "86400"))

    ION_RPC_MAIN: str = os.getenv("ION_RPC_MAIN", "")
    ION_RPC_BACKUP: str = os.getenv("ION_RPC_BACKUP", "")
    ION_WS_WSS: str = os.getenv("ION_WS_WSS", "")
    BSC_RPC_MAIN: str = os.getenv("BSC_RPC_MAIN", "")
    BSC_RPC_BACKUP: str = os.getenv("BSC_RPC_BACKUP", "")
    BSC_WS_WSS: str = os.getenv("BSC_WS_WSS", "")
    ETH_RPC_MAIN: str = os.getenv("ETH_RPC_MAIN", "")
    ETH_RPC_BACKUP: str = os.getenv("ETH_RPC_BACKUP", "")
    ETH_WS_WSS: str = os.getenv("ETH_WS_WSS", "")

    DEX_CONTRACT_ADDRESS: str = os.getenv("DEX_CONTRACT_ADDRESS", "")
    LP_POOL_CONTRACT_ADDRESS: str = os.getenv("LP_POOL_CONTRACT_ADDRESS", "")
    STAKING_CONTRACT_ADDRESS: str = os.getenv("STAKING_CONTRACT_ADDRESS", "")
    COINGECKO_API: str = os.getenv("COINGECKO_API", "https://api.coingecko.com/api/v3")


settings = Settings()
