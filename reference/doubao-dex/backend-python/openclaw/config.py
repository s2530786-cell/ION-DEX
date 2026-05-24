# OpenClaw 龙虾·极致节流版核心配置
from pydantic_settings import BaseSettings

class OpenClawConfig(BaseSettings):
    # 总开关
    OPENCLAW_ENABLE: bool = True
    AUTO_RESTART: bool = True
    RISK_AUTO_BLOCK: bool = True

    # 单人主钱包
    OWNER_WALLET: str = "0x你的主钱包地址"
    ALERT_WALLET: str = "0x备用告警钱包"

    # 告警渠道
    WECOM_WEBHOOK: str = ""
    ALERT_EMAIL: str = ""
    ALERT_EMAIL_PASS: str = ""

    # 风控阈值
    LARGE_USD_THRESHOLD: float = 10000.0
    RPC_DOWN_THRESHOLD: int = 5
    BALANCE_WARN_THRESHOLD: float = 500.0

    # 合约地址（部署后填写）
    ADMIN_CONTRACT: str = ""
    DEX_CONTRACT: str = ""
    STAKE_CONTRACT: str = ""

    # ====================== 【极致节流·单人省钱核心】 ======================
    MONITOR_INTERVAL: int = 15        # 系统监控15s一次
    CHAIN_WATCH_INTERVAL: int = 10    # 链上交易监控10s一次
    PRICE_UPDATE_INTERVAL: int = 5    # 价格预言机5s更新一次
    SETTLE_INTERVAL: int = 12         # 链上订单结算12s一次
    EMERGENCY_WATCH_INTERVAL: int = 5 # 合约暂停监听5s一次
    MEV_SCAN_INTERVAL: int = 20       # MEV套利扫描20s一次
    COLLECT_INTERVAL: int = 86400     # 国库归集/灰尘资产 1天1次
    # ====================================================================

    class Config:
        env_file = ".env"
        env_prefix = "OPENCLAW_"

openclaw_cfg = OpenClawConfig()
