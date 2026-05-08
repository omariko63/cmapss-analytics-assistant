from __future__ import annotations

from fastapi import HTTPException, status

from backend.app.repositories.dataset_repository import DatasetRepository
from backend.app.schemas.dataset import DatasetMetadataResponse


class DatasetService:
    """Business logic for dataset-level backend operations."""

    def __init__(self, repository: DatasetRepository | None = None) -> None:
        self.repository = repository or DatasetRepository()

    def get_metadata(self, dataset_id: str) -> DatasetMetadataResponse:
        payload = self.repository.get_metadata(dataset_id)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Metadata for dataset '{dataset_id.upper()}' was not found.",
            )
        return DatasetMetadataResponse.model_validate(payload)
