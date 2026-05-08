from __future__ import annotations

import json
from pathlib import Path

from backend.app.config import get_settings
from backend.app.schemas.suggestions import SuggestionItem


class SuggestionService:
    """Generates autocomplete suggestions from processed dataset artifacts."""

    def __init__(self) -> None:
        self._cache: list[SuggestionItem] | None = None

    def _load_json(self, path: Path) -> dict | list | None:
        if not path.exists():
            return None
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def _build_suggestions(self) -> list[SuggestionItem]:
        settings = get_settings()
        processed = settings.processed_dir
        items: list[SuggestionItem] = []

        dataset_ids = ["FD001", "FD002", "FD003", "FD004"]
        metadata_by_ds: dict[str, dict] = {}
        rankings_by_ds: dict[str, list] = {}
        engines_by_ds: dict[str, list] = {}

        for ds in dataset_ids:
            meta = self._load_json(processed / f"{ds.lower()}_metadata.json")
            if isinstance(meta, dict):
                metadata_by_ds[ds] = meta
            ranks = self._load_json(processed / f"{ds.lower()}_sensor_rankings.json")
            if isinstance(ranks, list):
                rankings_by_ds[ds] = ranks
            engs = self._load_json(processed / f"{ds.lower()}_engine_summaries.json")
            if isinstance(engs, list):
                engines_by_ds[ds] = engs

        items.extend(self._dataset_suggestions(metadata_by_ds))
        items.extend(self._sensor_suggestions(metadata_by_ds, rankings_by_ds))
        items.extend(self._engine_suggestions(engines_by_ds))
        items.extend(self._cross_dataset_suggestions(metadata_by_ds))
        items.extend(self._static_suggestions())

        return items

    def _dataset_suggestions(
        self, metadata: dict[str, dict]
    ) -> list[SuggestionItem]:
        items: list[SuggestionItem] = []
        for ds, meta in metadata.items():
            items.append(SuggestionItem(
                text=f"Give me a summary of {ds}",
                category="dataset",
            ))
            fault = meta.get("fault_mode", "")
            if fault:
                items.append(SuggestionItem(
                    text=f"What failure mode does {ds} represent?",
                    category="dataset",
                ))
            conds = meta.get("operating_conditions", "")
            if "SIX" in conds.upper():
                items.append(SuggestionItem(
                    text=f"What are the operating conditions in {ds}?",
                    category="dataset",
                ))
            items.append(SuggestionItem(
                text=f"How many engines are in {ds}?",
                category="dataset",
            ))
        return items

    def _sensor_suggestions(
        self,
        metadata: dict[str, dict],
        rankings: dict[str, list],
    ) -> list[SuggestionItem]:
        items: list[SuggestionItem] = []
        for ds in rankings:
            items.append(SuggestionItem(
                text=f"Which sensors are most informative in {ds}?",
                category="sensor",
            ))
            items.append(SuggestionItem(
                text=f"Which sensors are stable in {ds}?",
                category="sensor",
            ))
            items.append(SuggestionItem(
                text=f"Which sensors predict failure best in {ds}?",
                category="sensor",
            ))

            has_increasing = any(
                r.get("degradation_direction") == "increases_toward_failure"
                for r in rankings[ds]
                if r.get("label") == "informative"
            )
            has_decreasing = any(
                r.get("degradation_direction") == "decreases_toward_failure"
                for r in rankings[ds]
                if r.get("label") == "informative"
            )
            if has_increasing:
                items.append(SuggestionItem(
                    text=f"Which sensors increase toward failure in {ds}?",
                    category="sensor",
                ))
            if has_decreasing:
                items.append(SuggestionItem(
                    text=f"Which sensors decrease toward failure in {ds}?",
                    category="sensor",
                ))

            meta = metadata.get(ds, {})
            constant = meta.get("constant_features", [])
            if constant:
                items.append(SuggestionItem(
                    text=f"Which sensors are constant or useless in {ds}?",
                    category="sensor",
                ))
            items.append(SuggestionItem(
                text=f"Which sensors have the strongest RUL correlation in {ds}?",
                category="sensor",
            ))
        return items

    def _engine_suggestions(
        self, engines: dict[str, list]
    ) -> list[SuggestionItem]:
        items: list[SuggestionItem] = []
        for ds, eng_list in engines.items():
            if not eng_list:
                continue

            sorted_by_rul = sorted(eng_list, key=lambda e: e.get("starting_rul", 999))
            shortest = sorted_by_rul[:3]
            longest = sorted_by_rul[-3:]

            for eng in shortest:
                eid = eng["engine_id"]
                items.append(SuggestionItem(
                    text=f"Tell me about engine {eid} in {ds}",
                    category="engine",
                ))
                items.append(SuggestionItem(
                    text=f"Which sensors drift most for engine {eid} in {ds}?",
                    category="engine",
                ))

            for eng in longest:
                eid = eng["engine_id"]
                items.append(SuggestionItem(
                    text=f"Tell me about engine {eid} in {ds}",
                    category="engine",
                ))

            early_onset = [e for e in eng_list if e.get("degradation_onset_stage") == "early"]
            for eng in early_onset[:3]:
                eid = eng["engine_id"]
                items.append(SuggestionItem(
                    text=f"When does degradation start for engine {eid} in {ds}?",
                    category="engine",
                ))

            late_onset = [e for e in eng_list if e.get("degradation_onset_stage") == "late"]
            for eng in late_onset[:2]:
                eid = eng["engine_id"]
                items.append(SuggestionItem(
                    text=f"What is the degradation onset for engine {eid} in {ds}?",
                    category="engine",
                ))

            items.append(SuggestionItem(
                text=f"Which engines failed earliest in {ds}?",
                category="engine",
            ))
            items.append(SuggestionItem(
                text=f"Which engines have the longest life in {ds}?",
                category="engine",
            ))

            sample_ids = [e["engine_id"] for e in eng_list[:50]]
            for eid in sample_ids:
                items.append(SuggestionItem(
                    text=f"Summarize engine {eid} in {ds}",
                    category="engine",
                ))

        return items

    def _cross_dataset_suggestions(
        self, metadata: dict[str, dict]
    ) -> list[SuggestionItem]:
        items: list[SuggestionItem] = []

        multi_fault = [ds for ds, m in metadata.items() if "," in m.get("fault_mode", "")]
        multi_cond = [ds for ds, m in metadata.items() if "SIX" in m.get("operating_conditions", "").upper()]

        if multi_fault:
            items.append(SuggestionItem(
                text="Which datasets model fan degradation?",
                category="comparison",
            ))
        if multi_cond:
            items.append(SuggestionItem(
                text="Which datasets have multiple operating conditions?",
                category="comparison",
            ))

        ds_list = list(metadata.keys())
        if len(ds_list) >= 2:
            items.append(SuggestionItem(
                text=f"How do {ds_list[0]} and {ds_list[-1]} differ?",
                category="comparison",
            ))
            items.append(SuggestionItem(
                text=f"Compare informative sensors in {ds_list[0]} and {ds_list[-1]}",
                category="comparison",
            ))
            items.append(SuggestionItem(
                text=f"Compare informative sensors in {ds_list[0]} and {ds_list[2]}",
                category="comparison",
            ))

        return items

    def _static_suggestions(self) -> list[SuggestionItem]:
        return [
            SuggestionItem(text="Give me a fleet summary", category="fleet"),
            SuggestionItem(text="What is the CMAPSS dataset?", category="general"),
            SuggestionItem(text="What does RUL mean?", category="general"),
            SuggestionItem(text="How is sensor informativeness calculated?", category="general"),
            SuggestionItem(text="What is degradation onset?", category="general"),
            SuggestionItem(text="How many datasets are available?", category="fleet"),
        ]

    def get_suggestions(self, query: str, limit: int = 8) -> list[SuggestionItem]:
        if self._cache is None:
            self._cache = self._build_suggestions()
            seen: set[str] = set()
            deduped: list[SuggestionItem] = []
            for item in self._cache:
                if item.text not in seen:
                    seen.add(item.text)
                    deduped.append(item)
            self._cache = deduped

        if not query or len(query) < 2:
            return []

        words = query.lower().split()
        scored: list[tuple[float, SuggestionItem]] = []

        for item in self._cache:
            text_lower = item.text.lower()
            score = 0.0
            all_match = True
            for word in words:
                if word in text_lower:
                    if text_lower.startswith(word) or f" {word}" in text_lower:
                        score += 2.0
                    else:
                        score += 1.0
                else:
                    all_match = False

            if not all_match and len(words) > 1:
                continue
            if score == 0:
                continue

            if text_lower.startswith(query.lower()):
                score += 3.0

            scored.append((score, item))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in scored[:limit]]
