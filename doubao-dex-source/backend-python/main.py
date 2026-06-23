import asyncio
from fastapi import FastAPI
from core.config import settings
from api.init import api_router
from spiders.ws_listener import start_all_ws
from spiders.block_scanner import start_block_scanner
from spiders.price_scanner import start_price_scanner
from core.logger import logger

app = FastAPI(title="ION DEX Backend", version="1.0")
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.on_event("startup")
async def startup():
    logger.info("service starting, launching spiders...")
    asyncio.create_task(start_all_ws())
    await start_block_scanner()
    await start_price_scanner()
    logger.info("all spiders started")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.SERVER_HOST, port=settings.SERVER_PORT, reload=False)
