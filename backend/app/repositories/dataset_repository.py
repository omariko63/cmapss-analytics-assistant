from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from backend.app.config import get_settings


class DatasetRepository:
    """Read processed dataset artifacts from disk."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def _load_json_artifact(self, dataset_id: str, suffix: str) -> dict[str, Any] | list[dict[str, Any]] | None:
        normalized_id = dataset_id.upper()
        artifact_path = self.settings.processed_dir / f"{normalized_id.lower()}_{suffix}.json"
        if not artifact_path.exists():
            return None
        with artifact_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def get_metadata(self, dataset_id: str) -> dict[str, Any] | None:
        payload = self._load_json_artifact(dataset_id, "metadata")
        return payload if isinstance(payload, dict) else None

    def list_metadata(self) -> list[dict[str, Any]]:
        datasets: list[dict[str, Any]] = []
        for metadata_path in sorted(self.settings.processed_dir.glob("fd*_metadata.json")):
            with metadata_path.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
            if isinstance(payload, dict):
                datasets.append(payload)
        return datasets

    def get_sensor_rankings(self, dataset_id: str) -> list[dict[str, Any]] | None:
        payload = self._load_json_artifact(dataset_id, "sensor_rankings")
        return payload if isinstance(payload, list) else None

    def get_engine_summaries(self, dataset_id: str) -> list[dict[str, Any]] | None:
        payload = self._load_json_artifact(dataset_id, "engine_summaries")
        return payload if isinstance(payload, list) else None
