# 告警推送模块
import aiohttp
import smtplib
from email.mime.text import MIMEText
from openclaw.config import openclaw_cfg
from core.logger import logger


class Alert:
    def __init__(self):
        self.cfg = openclaw_cfg

    async def push(self, title: str, message: str):
        """统一告警入口，同时推送到所有已配置渠道"""
        logger.warning(f"[ALERT] {title}: {message}")
        if self.cfg.WECOM_WEBHOOK:
            await self._push_wecom(title, message)

    async def _push_wecom(self, title: str, message: str):
        """企业微信机器人推送"""
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    self.cfg.WECOM_WEBHOOK,
                    json={"msgtype": "text", "text": {"content": f"{title}\n{message}"}}
                )
        except Exception as e:
            logger.error(f"企业微信推送失败: {e}")


alert = Alert()
