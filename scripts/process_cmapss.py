from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

import numpy as np


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR = PROJECT_ROOT / "processed"
DATASET_IDS = ("FD001", "FD002", "FD003", "FD004")
DATASET_INFO = {
    "FD001": {
        "fault_mode": "HPC Degradation",
        "operating_conditions": "ONE (Sea Level)",
    },
    "FD002": {
        "fault_mode": "HPC Degradation",
        "operating_conditions": "SIX",
    },
    "FD003": {
        "fault_mode": "HPC Degradation, Fan Degradation",
        "operating_conditions": "ONE (Sea Level)",
    },
    "FD004": {
        "fault_mode": "HPC Degradation, Fan Degradation",
        "operating_conditions": "SIX",
    },
}

BASE_COLUMNS = (
    ["unit", "cycle"]
    + [f"op_setting_{i}" for i in range(1, 4)]
    + [f"sensor_{i}" for i in range(1, 22)]
)
SENSOR_COLUMNS = [f"sensor_{i}" for i in range(1, 22)]
TRAIN_COLUMNS = BASE_COLUMNS + ["RUL"]


def load_split(dataset_id: str, split: str) -> np.ndarray:
    path = DATA_DIR / f"{split}_{dataset_id}.txt"
    return np.loadtxt(path)[:, :26]


def load_test_rul(dataset_id: str) -> np.ndarray:
    rul = np.loadtxt(DATA_DIR / f"RUL_{dataset_id}.txt")
    if rul.ndim == 0:
        return np.array([float(rul)])
    return rul


def engine_cycle_lengths(data: np.ndarray) -> dict[int, int]:
    units = data[:, 0].astype(int)
    cycles = data[:, 1].astype(int)
    return {unit: int(cycles[units == unit].max()) for unit in np.unique(units)}


def add_training_rul(train: np.ndarray) -> np.ndarray:
    lengths = engine_cycle_lengths(train)
    rul = np.array([lengths[int(unit)] - int(cycle) for unit, cycle in train[:, :2]])
    return np.column_stack([train, rul])


def write_csv(path: Path, data: np.ndarray, columns: list[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(columns)
        writer.writerows(data.tolist())


def rounded(value: float) -> float:
    return round(float(value), 6)


def min_max_normalize(values: list[float]) -> list[float]:
    minimum = min(values)
    maximum = max(values)
    if abs(maximum - minimum) < 1e-12:
        return [0.0 for _ in values]
    return [(value - minimum) / (maximum - minimum) for value in values]


def summarize_sensor_stats(train_with_rul: np.ndarray) -> list[dict[str, Any]]:
    train = train_with_rul[:, :26]
    rul = train_with_rul[:, 26]
    stats: list[dict[str, Any]] = []

    early_mask = rul >= np.percentile(rul, 75)
    late_mask = rul <= np.percentile(rul, 25)

    for index, name in enumerate(BASE_COLUMNS[2:], start=2):
        values = train[:, index]
        std = float(values.std())
        corr = None
        if std >= 1e-12 and rul.std() >= 1e-12:
            corr = float(np.corrcoef(values, rul)[0, 1])

        early_mean = float(values[early_mask].mean())
        late_mean = float(values[late_mask].mean())
        stats.append(
            {
                "feature": name,
                "std": rounded(std),
                "min": rounded(values.min()),
                "max": rounded(values.max()),
                "mean": rounded(values.mean()),
                "rul_correlation": None if corr is None else rounded(corr),
                "early_mean": rounded(early_mean),
                "late_mean": rounded(late_mean),
                "mean_shift_early_to_late": rounded(late_mean - early_mean),
                "is_constant": std < 1e-12,
                "is_near_constant": std < 1e-3,
            }
        )
    return stats


def rank_sensors(train_with_rul: np.ndarray) -> list[dict[str, Any]]:
    train = train_with_rul[:, :26]
    rul = train_with_rul[:, 26]
    units = train[:, 0].astype(int)
    cycles = train[:, 1]
    cycle_lengths = engine_cycle_lengths(train)
    progress = np.array([cycle / cycle_lengths[int(unit)] for unit, cycle in zip(units, cycles)])

    early_mask = rul >= np.percentile(rul, 75)
    late_mask = rul <= np.percentile(rul, 25)
    feature_index = {name: index for index, name in enumerate(BASE_COLUMNS)}

    raw_rankings: list[dict[str, Any]] = []
    for name in SENSOR_COLUMNS:
        column_index = feature_index[name]
        values = train[:, column_index]
        std = float(values.std())
        early_mean = float(values[early_mask].mean())
        late_mean = float(values[late_mask].mean())
        mean_shift = late_mean - early_mean

        rul_corr = 0.0
        if std >= 1e-12 and rul.std() >= 1e-12:
            rul_corr = float(np.corrcoef(values, rul)[0, 1])

        engine_corrs: list[float] = []
        engine_slopes: list[float] = []
        for unit in np.unique(units):
            engine_mask = units == unit
            engine_values = values[engine_mask]
            engine_progress = progress[engine_mask]
            if engine_values.std() < 1e-12 or engine_progress.std() < 1e-12:
                engine_corrs.append(0.0)
                engine_slopes.append(0.0)
                continue
            engine_corrs.append(float(np.corrcoef(engine_values, engine_progress)[0, 1]))
            engine_slopes.append(float(np.polyfit(engine_progress, engine_values, 1)[0]))

        expected_direction = 0
        if abs(mean_shift) >= 1e-12:
            expected_direction = 1 if mean_shift > 0 else -1

        informative_slopes = [slope for slope in engine_slopes if abs(slope) >= 1e-12]
        if expected_direction == 0 or not informative_slopes:
            sign_consistency = 0.0
        else:
            consistent = sum(
                1 for slope in informative_slopes if (1 if slope > 0 else -1) == expected_direction
            )
            sign_consistency = consistent / len(informative_slopes)

        raw_rankings.append(
            {
                "feature": name,
                "rul_correlation": rounded(rul_corr),
                "abs_rul_correlation_raw": abs(rul_corr),
                "mean_shift_early_to_late": rounded(mean_shift),
                "effect_size_raw": 0.0 if std < 1e-12 else abs(mean_shift) / std,
                "median_abs_engine_corr_raw": float(np.median(np.abs(engine_corrs))),
                "trend_sign_consistency_raw": float(sign_consistency),
                "std": rounded(std),
                "is_constant": std < 1e-12,
                "is_near_constant": std < 1e-3,
                "degradation_direction": (
                    "increases_toward_failure"
                    if mean_shift > 0
                    else "decreases_toward_failure"
                    if mean_shift < 0
                    else "flat"
                ),
            }
        )

    abs_corr_scores = min_max_normalize(
        [item["abs_rul_correlation_raw"] for item in raw_rankings]
    )
    effect_scores = min_max_normalize(
        [item["effect_size_raw"] for item in raw_rankings]
    )
    engine_corr_scores = min_max_normalize(
        [item["median_abs_engine_corr_raw"] for item in raw_rankings]
    )
    consistency_scores = min_max_normalize(
        [item["trend_sign_consistency_raw"] for item in raw_rankings]
    )

    rankings: list[dict[str, Any]] = []
    for index, item in enumerate(raw_rankings):
        informativeness_score = (
            0.4 * abs_corr_scores[index]
            + 0.3 * effect_scores[index]
            + 0.2 * engine_corr_scores[index]
            + 0.1 * consistency_scores[index]
        )

        if item["is_constant"] or item["is_near_constant"] or informativeness_score < 0.2:
            label = "stable"
        elif informativeness_score >= 0.55:
            label = "informative"
        else:
            label = "moderate_signal"

        rankings.append(
            {
                "feature": item["feature"],
                "label": label,
                "informativeness_score": rounded(informativeness_score),
                "rul_correlation": item["rul_correlation"],
                "mean_shift_early_to_late": item["mean_shift_early_to_late"],
                "median_abs_engine_corr": rounded(item["median_abs_engine_corr_raw"]),
                "trend_sign_consistency": rounded(item["trend_sign_consistency_raw"]),
                "std": item["std"],
                "degradation_direction": item["degradation_direction"],
                "is_constant": item["is_constant"],
                "is_near_constant": item["is_near_constant"],
            }
        )

    return sorted(rankings, key=lambda item: item["informativeness_score"], reverse=True)


def summarize_engines(
    dataset_id: str, train_with_rul: np.ndarray, sensor_rankings: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    train = train_with_rul[:, :26]
    rul = train_with_rul[:, 26]
    units = train[:, 0].astype(int)
    cycles = train[:, 1].astype(int)
    feature_index = {name: index for index, name in enumerate(BASE_COLUMNS)}
    top_sensor_names = [item["feature"] for item in sensor_rankings[:8]]
    summaries: list[dict[str, Any]] = []

    for unit in np.unique(units):
        engine_mask = units == unit
        engine_train = train[engine_mask]
        engine_rul = rul[engine_mask]
        engine_cycles = cycles[engine_mask]
        cycle_count = int(engine_cycles.max())

        early_window_size = max(5, min(30, cycle_count // 5 if cycle_count >= 5 else cycle_count))
        late_window_size = max(5, min(30, cycle_count // 5 if cycle_count >= 5 else cycle_count))
        early_window = engine_train[:early_window_size]
        late_window = engine_train[-late_window_size:]

        drift_entries: list[dict[str, Any]] = []
        onset_scores: list[float] = []
        onset_cycles: list[int] = []

        for feature in top_sensor_names:
            col_idx = feature_index[feature]
            series = engine_train[:, col_idx]
            baseline = float(early_window[:, col_idx].mean())
            late_mean = float(late_window[:, col_idx].mean())
            early_std = float(early_window[:, col_idx].std())
            drift = late_mean - baseline
            normalized_drift = 0.0 if early_std < 1e-12 else abs(drift) / early_std

            drift_entries.append(
                {
                    "feature": feature,
                    "early_mean": rounded(baseline),
                    "late_mean": rounded(late_mean),
                    "absolute_drift": rounded(abs(drift)),
                    "normalized_drift": rounded(normalized_drift),
                    "direction": (
                        "increasing"
                        if drift > 0
                        else "decreasing"
                        if drift < 0
                        else "flat"
                    ),
                }
            )

            deviation_series = np.abs(series - baseline)
            threshold = max(early_std * 2.0, 1e-6)
            above_threshold = np.where(deviation_series > threshold)[0]
            if above_threshold.size > 0:
                onset_index = int(above_threshold[0])
                onset_cycles.append(int(engine_cycles[onset_index]))
                onset_scores.append(float(deviation_series[onset_index]))

        top_drifting = sorted(
            drift_entries, key=lambda item: item["normalized_drift"], reverse=True
        )[:5]

        onset_cycle = int(min(onset_cycles)) if onset_cycles else cycle_count
        onset_fraction = rounded(onset_cycle / cycle_count) if cycle_count else 1.0
        onset_stage = (
            "early"
            if onset_fraction <= 0.33
            else "mid"
            if onset_fraction <= 0.66
            else "late"
        )

        summaries.append(
            {
                "dataset_id": dataset_id,
                "engine_id": int(unit),
                "cycles_recorded": cycle_count,
                "starting_rul": int(engine_rul.max()),
                "ending_rul": int(engine_rul.min()),
                "early_window_size": early_window_size,
                "late_window_size": late_window_size,
                "top_drifting_sensors": top_drifting,
                "degradation_onset_cycle": onset_cycle,
                "degradation_onset_fraction": onset_fraction,
                "degradation_onset_stage": onset_stage,
            }
        )

    return summaries


def summarize_metadata(
    dataset_id: str,
    train: np.ndarray,
    test: np.ndarray,
    test_rul: np.ndarray,
    sensor_stats: list[dict[str, Any]],
    sensor_rankings: list[dict[str, Any]],
) -> dict[str, Any]:
    train_lengths = np.array(list(engine_cycle_lengths(train).values()))
    test_lengths = np.array(list(engine_cycle_lengths(test).values()))
    dataset_info = DATASET_INFO[dataset_id]

    return {
        "dataset_id": dataset_id,
        "source": "NASA CMAPSS",
        "fault_mode": dataset_info["fault_mode"],
        "operating_conditions": dataset_info["operating_conditions"],
        "train_rows": int(train.shape[0]),
        "test_rows": int(test.shape[0]),
        "train_engines": int(np.unique(train[:, 0]).size),
        "test_engines": int(np.unique(test[:, 0]).size),
        "columns": BASE_COLUMNS,
        "train_cycle_length": {
            "min": int(train_lengths.min()),
            "median": float(np.median(train_lengths)),
            "max": int(train_lengths.max()),
        },
        "test_cycle_length": {
            "min": int(test_lengths.min()),
            "median": float(np.median(test_lengths)),
            "max": int(test_lengths.max()),
        },
        "test_rul": {
            "min": int(test_rul.min()),
            "median": float(np.median(test_rul)),
            "max": int(test_rul.max()),
        },
        "constant_features": [
            item["feature"] for item in sensor_stats if item["is_constant"]
        ],
        "near_constant_features": [
            item["feature"] for item in sensor_stats if item["is_near_constant"]
        ],
        "top_negative_rul_correlations": sorted(
            [
                {
                    "feature": item["feature"],
                    "rul_correlation": item["rul_correlation"],
                }
                for item in sensor_stats
                if item["rul_correlation"] is not None
            ],
            key=lambda item: item["rul_correlation"],
        )[:5],
        "top_positive_rul_correlations": sorted(
            [
                {
                    "feature": item["feature"],
                    "rul_correlation": item["rul_correlation"],
                }
                for item in sensor_stats
                if item["rul_correlation"] is not None
            ],
            key=lambda item: item["rul_correlation"],
            reverse=True,
        )[:5],
        "top_informative_sensors": [
            {
                "feature": item["feature"],
                "informativeness_score": item["informativeness_score"],
            }
            for item in sensor_rankings
            if item["label"] == "informative"
        ][:5],
        "stable_sensors": [
            item["feature"] for item in sensor_rankings if item["label"] == "stable"
        ],
    }


def write_json(path: Path, payload: Any) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def process_dataset(dataset_id: str) -> list[Path]:
    train = load_split(dataset_id, "train")
    test = load_split(dataset_id, "test")
    test_rul = load_test_rul(dataset_id)
    train_with_rul = add_training_rul(train)
    sensor_stats = summarize_sensor_stats(train_with_rul)
    sensor_rankings = rank_sensors(train_with_rul)
    engine_summaries = summarize_engines(dataset_id, train_with_rul, sensor_rankings)
    metadata = summarize_metadata(
        dataset_id,
        train,
        test,
        test_rul,
        sensor_stats,
        sensor_rankings,
    )

    output_paths = [
        OUTPUT_DIR / f"{dataset_id.lower()}_train_processed.csv",
        OUTPUT_DIR / f"{dataset_id.lower()}_test_processed.csv",
        OUTPUT_DIR / f"{dataset_id.lower()}_test_rul.json",
        OUTPUT_DIR / f"{dataset_id.lower()}_metadata.json",
        OUTPUT_DIR / f"{dataset_id.lower()}_sensor_stats.json",
        OUTPUT_DIR / f"{dataset_id.lower()}_sensor_rankings.json",
        OUTPUT_DIR / f"{dataset_id.lower()}_engine_summaries.json",
    ]

    write_csv(output_paths[0], train_with_rul, TRAIN_COLUMNS)
    write_csv(output_paths[1], test, BASE_COLUMNS)
    write_json(output_paths[2], test_rul.astype(int).tolist())
    write_json(output_paths[3], metadata)
    write_json(output_paths[4], sensor_stats)
    write_json(output_paths[5], sensor_rankings)
    write_json(output_paths[6], engine_summaries)
    return output_paths


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    print("Wrote:")
    for dataset_id in DATASET_IDS:
        for output_path in process_dataset(dataset_id):
            print(output_path)


if __name__ == "__main__":
    main()
