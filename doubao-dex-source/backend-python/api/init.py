from fastapi import APIRouter
from api import asset, transaction, lp, price, risk

api_router = APIRouter()
api_router.include_router(asset.router)
api_router.include_router(transaction.router)
api_router.include_router(lp.router)
api_router.include_router(price.router)
api_router.include_router(risk.router)
