from __future__ import annotations

from fastapi import APIRouter

from backend.app.schemas.dataset import DatasetMetadataResponse
from backend.app.services.dataset_service import DatasetService


router = APIRouter(prefix="/datasets")
dataset_service = DatasetService()


@router.get("/{dataset_id}/metadata", response_model=DatasetMetadataResponse)
def get_dataset_metadata(dataset_id: str) -> DatasetMetadataResponse:
    return dataset_service.get_metadata(dataset_id)
