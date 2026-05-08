from fastapi import APIRouter

from backend.app.routes.datasets import router as datasets_router
from backend.app.routes.health import router as health_router


api_router = APIRouter()
api_router.include_router(datasets_router, tags=["datasets"])
api_router.include_router(health_router, tags=["health"])
