from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path


class Settings:
    """Application settings derived from the local environment."""

    def __init__(self) -> None:
        self.app_name = "NASA CMAPSS Backend"
        self.app_version = "0.1.0"
        self.api_v1_prefix = "/api/v1"
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        self.project_root = Path(__file__).resolve().parents[2]
        self.data_dir = self.project_root / "data"
        self.processed_dir = self.project_root / "processed"
        self.cors_origins = self._parse_cors_origins()

    @staticmethod
    def _parse_cors_origins() -> list[str]:
        raw_origins = os.getenv("CORS_ORIGINS", "*").strip()
        if not raw_origins:
            return ["*"]
        return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
