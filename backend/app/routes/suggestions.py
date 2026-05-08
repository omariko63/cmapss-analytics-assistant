from __future__ import annotations

from fastapi import APIRouter, Query

from backend.app.schemas.suggestions import SuggestionResponse
from backend.app.services.suggestion_service import SuggestionService


router = APIRouter(prefix="/suggestions")
suggestion_service = SuggestionService()


@router.get("", response_model=SuggestionResponse)
def get_suggestions(
    q: str = Query("", min_length=0),
    limit: int = Query(8, ge=1, le=20),
) -> SuggestionResponse:
    return SuggestionResponse(
        suggestions=suggestion_service.get_suggestions(q, limit)
    )
