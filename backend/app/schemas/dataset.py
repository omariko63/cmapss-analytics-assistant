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


class SensorRankingResponse(BaseModel):
    feature: str
    label: str
    informativeness_score: float
    rul_correlation: float
    mean_shift_early_to_late: float
    median_abs_engine_corr: float
    trend_sign_consistency: float
    std: float
    degradation_direction: str
    is_constant: bool
    is_near_constant: bool


class EngineDriftSensor(BaseModel):
    feature: str
    early_mean: float
    late_mean: float
    absolute_drift: float
    normalized_drift: float
    direction: str


class EngineSummaryResponse(BaseModel):
    dataset_id: str
    engine_id: int
    cycles_recorded: int
    starting_rul: int
    ending_rul: int
    early_window_size: int
    late_window_size: int
    top_drifting_sensors: list[EngineDriftSensor]
    degradation_onset_cycle: int
    degradation_onset_fraction: float
    degradation_onset_stage: str


class DatasetListItemResponse(BaseModel):
    dataset_id: str
    source: str
    fault_mode: str
    operating_conditions: str
    train_engines: int
    test_engines: int


class DatasetListResponse(BaseModel):
    datasets: list[DatasetListItemResponse]


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
