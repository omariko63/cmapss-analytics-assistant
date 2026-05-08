from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from backend.app.config import get_settings


class DatasetRepository:
    """Read processed dataset artifacts from disk."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def get_metadata(self, dataset_id: str) -> dict[str, Any] | None:
        normalized_id = dataset_id.upper()
        metadata_path = self.settings.processed_dir / f"{normalized_id.lower()}_metadata.json"
        if not metadata_path.exists():
            return None
        with metadata_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
