from __future__ import annotations

from fastapi import APIRouter

from backend.app.config import get_settings
from backend.app.schemas.health import HealthResponse


router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        version=settings.app_version,
        data_dir_exists=settings.data_dir.exists(),
        processed_dir_exists=settings.processed_dir.exists(),
    )
