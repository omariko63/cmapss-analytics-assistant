from __future__ import annotations

from pydantic import BaseModel


class CycleLengthStats(BaseModel):
    min: int
    median: float
    max: int


class SensorCorrelation(BaseModel):
    feature: str
    rul_correlation: float


class InformativeSensor(BaseModel):
    feature: str
    informativeness_score: float


class DatasetMetadataResponse(BaseModel):
    dataset_id: str
    source: str
    fault_mode: str
    operating_conditions: str
    train_rows: int
    test_rows: int
    train_engines: int
    test_engines: int
    columns: list[str]
    train_cycle_length: CycleLengthStats
    test_cycle_length: CycleLengthStats
    test_rul: CycleLengthStats
    constant_features: list[str]
    near_constant_features: list[str]
    top_negative_rul_correlations: list[SensorCorrelation]
    top_positive_rul_correlations: list[SensorCorrelation]
    top_informative_sensors: list[InformativeSensor]
    stable_sensors: list[str]
