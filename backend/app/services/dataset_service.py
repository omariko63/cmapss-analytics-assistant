from __future__ import annotations

from fastapi import HTTPException, status

from backend.app.repositories.dataset_repository import DatasetRepository
from backend.app.schemas.dataset import (
    DatasetListItemResponse,
    DatasetListResponse,
    DatasetMetadataResponse,
    EngineSummaryResponse,
    SensorRankingResponse,
)


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

    def list_datasets(self) -> DatasetListResponse:
        payload = self.repository.list_metadata()
        return DatasetListResponse(
            datasets=[
                DatasetListItemResponse(
                    dataset_id=item["dataset_id"],
                    source=item["source"],
                    fault_mode=item["fault_mode"],
                    operating_conditions=item["operating_conditions"],
                    train_engines=item["train_engines"],
                    test_engines=item["test_engines"],
                )
                for item in payload
            ]
        )

    def get_sensor_rankings(self, dataset_id: str) -> list[SensorRankingResponse]:
        payload = self.repository.get_sensor_rankings(dataset_id)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sensor rankings for dataset '{dataset_id.upper()}' were not found.",
            )
        return [SensorRankingResponse.model_validate(item) for item in payload]

    def get_informative_sensors(self, dataset_id: str) -> list[SensorRankingResponse]:
        return [
            item for item in self.get_sensor_rankings(dataset_id) if item.label == "informative"
        ]

    def get_stable_sensors(self, dataset_id: str) -> list[SensorRankingResponse]:
        return [item for item in self.get_sensor_rankings(dataset_id) if item.label == "stable"]

    def get_engine_summary(self, dataset_id: str, engine_id: int) -> EngineSummaryResponse:
        payload = self.repository.get_engine_summaries(dataset_id)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Engine summaries for dataset '{dataset_id.upper()}' were not found.",
            )

        for item in payload:
            if int(item["engine_id"]) == int(engine_id):
                return EngineSummaryResponse.model_validate(item)

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Engine '{engine_id}' was not found in dataset '{dataset_id.upper()}'."
            ),
        )
