# OpenClaw 龙虾统一启动入口（节流调度）
import asyncio
from openclaw.config import openclaw_cfg
from openclaw.emergency_watch import emergency_watch
from core.logger import logger


async def start_openclaw():
    if not openclaw_cfg.OPENCLAW_ENABLE:
        logger.info("🦞 龙虾运维系统已关闭")
        return

    logger.info("===== 🦞 OpenClaw 龙虾【单人极致节流版】运维系统启动 =====")

    asyncio.create_task(emergency_watch.loop())

    logger.info("🦞 龙虾节流监控全部运行中，RPC调用已压至最低")
