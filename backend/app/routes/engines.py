from __future__ import annotations

from fastapi import APIRouter

from backend.app.schemas.dataset import EngineSummaryResponse
from backend.app.services.dataset_service import DatasetService


router = APIRouter(prefix="/datasets")
dataset_service = DatasetService()


@router.get("/{dataset_id}/engines/{engine_id}", response_model=EngineSummaryResponse)
def get_engine_summary(dataset_id: str, engine_id: int) -> EngineSummaryResponse:
    return dataset_service.get_engine_summary(dataset_id, engine_id)
