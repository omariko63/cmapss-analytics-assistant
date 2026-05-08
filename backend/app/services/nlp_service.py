from __future__ import annotations

import json

from fastapi import HTTPException

from backend.app.schemas.nlp import NLPProcessRequest, NLPProcessResponse
from backend.app.services.dataset_service import DatasetService
from backend.nlp_processor import LLMProcessor, process_prompt


class NLPService:
    """Application service for NLP parsing and LLM generation."""

    def __init__(self, dataset_service: DatasetService | None = None) -> None:
        self.dataset_service = dataset_service or DatasetService()

    @staticmethod
    def _safe_json(value: object) -> str:
        return json.dumps(
            value,
            indent=2,
            default=lambda obj: obj.model_dump() if hasattr(obj, "model_dump") else str(obj),
        )

    def _build_structured_context(self, parsed: dict, user_context: str | None) -> str | None:
        context_parts: list[str] = []
        dataset_id = parsed["dataset_ids"][0] if parsed["dataset_ids"] else None
        intent = parsed["intent"]

        try:
            if intent == "fleet_summary":
                datasets = self.dataset_service.list_datasets()
                context_parts.append(
                    f"Available datasets:\n{self._safe_json(datasets.model_dump())}"
                )

            if dataset_id:
                metadata = self.dataset_service.get_metadata(dataset_id)
                context_parts.append(
                    f"Dataset metadata for {dataset_id}:\n{self._safe_json(metadata.model_dump())}"
                )

                if intent == "sensor_ranking":
                    informative = self.dataset_service.get_informative_sensors(dataset_id)[:8]
                    stable = self.dataset_service.get_stable_sensors(dataset_id)[:8]
                    context_parts.append(
                        "Top informative sensors:\n"
                        f"{self._safe_json([item.model_dump() for item in informative])}"
                    )
                    context_parts.append(
                        "Stable sensors:\n"
                        f"{self._safe_json([item.model_dump() for item in stable])}"
                    )

                if intent == "engine_detail" and parsed["unit_ids"]:
                    engine_id = parsed["unit_ids"][0]
                    engine_summary = self.dataset_service.get_engine_summary(dataset_id, engine_id)
                    context_parts.append(
                        f"Engine summary for {dataset_id} engine {engine_id}:\n"
                        f"{self._safe_json(engine_summary.model_dump())}"
                    )
        except HTTPException:
            pass

        if user_context:
            context_parts.append(f"Caller-provided context:\n{user_context}")

        if not context_parts:
            return None
        return "\n\n".join(context_parts)

    def process(self, payload: NLPProcessRequest) -> NLPProcessResponse:
        parsed = process_prompt(payload.message)
        structured_context = self._build_structured_context(parsed, payload.context)
        llm = LLMProcessor()
        answer = None
        if llm.available:
            try:
                answer = llm.generate(
                    user_message=payload.message,
                    parsed=parsed,
                    context=structured_context,
                )
            except Exception:
                answer = None

        return NLPProcessResponse.model_validate(
            {
                "parsed": parsed,
                "llm_available": llm.available,
                "answer": answer,
                "structured_context": structured_context,
            }
        )
