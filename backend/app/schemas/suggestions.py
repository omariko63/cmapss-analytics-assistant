from __future__ import annotations

from __future__ import annotations

from pydantic import BaseModel


class SuggestionItem(BaseModel):
    text: str
    category: str


class SuggestionResponse(BaseModel):
    suggestions: list[SuggestionItem]
