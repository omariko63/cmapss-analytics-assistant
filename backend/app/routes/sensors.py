from __future__ import annotations

from fastapi import APIRouter

from backend.app.schemas.dataset import SensorRankingResponse
from backend.app.services.dataset_service import DatasetService


router = APIRouter(prefix="/datasets")
dataset_service = DatasetService()


@router.get("/{dataset_id}/sensors/rankings", response_model=list[SensorRankingResponse])
def get_sensor_rankings(dataset_id: str) -> list[SensorRankingResponse]:
    return dataset_service.get_sensor_rankings(dataset_id)


@router.get("/{dataset_id}/sensors/informative", response_model=list[SensorRankingResponse])
def get_informative_sensors(dataset_id: str) -> list[SensorRankingResponse]:
    return dataset_service.get_informative_sensors(dataset_id)


@router.get("/{dataset_id}/sensors/stable", response_model=list[SensorRankingResponse])
def get_stable_sensors(dataset_id: str) -> list[SensorRankingResponse]:
    return dataset_service.get_stable_sensors(dataset_id)
