import json
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import AsyncSessionLocal
from core.logger import logger
from models.event_log import ContractEventLog
from models.transaction import ChainTransaction
from models.asset import UserAsset
from models.lp_stake import UserLpStake
from web3 import AsyncWeb3
from datetime import datetime


async def parse_chain_event(chain_type: str, event: dict):
    async with AsyncSessionLocal() as db:
        try:
            tx_hash = event["transactionHash"].hex()
            block_num = event["blockNumber"]
            contract_addr = event["address"]
            topics = [t.hex() for t in event["topics"]]
            event_name = ""

            sig_map = {
                AsyncWeb3.keccak(text="Transfer(address,address,uint256)").hex(): "Transfer",
                AsyncWeb3.keccak(text="Approval(address,address,uint256)").hex(): "Approval",
                AsyncWeb3.keccak(text="Swap(address,address,uint256,uint256,uint256,uint256)").hex(): "Swap",
                AsyncWeb3.keccak(text="AddLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)").hex(): "AddLiquidity",
                AsyncWeb3.keccak(text="RemoveLiquidity(address,address,uint256,uint256,uint256,address,uint256)").hex(): "RemoveLiquidity",
                AsyncWeb3.keccak(text="Stake(address,uint256)").hex(): "Stake",
                AsyncWeb3.keccak(text="Unstake(address,uint256)").hex(): "Unstake",
                AsyncWeb3.keccak(text="RewardClaim(address,uint256)").hex(): "RewardClaim",
            }
            if topics and topics[0] in sig_map:
                event_name = sig_map[topics[0]]

            log = ContractEventLog(
                chain_type=chain_type,
                tx_hash=tx_hash,
                block_number=block_num,
                contract_address=contract_addr,
                event_name=event_name,
                event_data=json.dumps(event, default=str),
                create_time=datetime.utcnow()
            )
            db.add(log)
            await db.commit()
            logger.info(f"[{chain_type}] event saved {event_name} {tx_hash}")
        except Exception as e:
            logger.error(f"parse_chain_event failed: {str(e)}")
