from __future__ import annotations

from pydantic import BaseModel


class NLPProcessRequest(BaseModel):
    message: str
    context: str | None = None


class NLPParsedResponse(BaseModel):
    original: str
    tokens: list[str]
    filtered: list[str]
    lemmas: list[str]
    unit_ids: list[int]
    dataset_ids: list[str]
    intent: str
    split: str


class NLPProcessResponse(BaseModel):
    parsed: NLPParsedResponse
    llm_available: bool
    answer: str | None = None
    structured_context: str | None = None
