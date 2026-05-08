from __future__ import annotations

from fastapi import APIRouter

from backend.app.schemas.nlp import NLPProcessRequest, NLPProcessResponse
from backend.app.services.nlp_service import NLPService


router = APIRouter(prefix="/nlp")
nlp_service = NLPService()


@router.post("/process", response_model=NLPProcessResponse)
def process_nlp(payload: NLPProcessRequest) -> NLPProcessResponse:
    return nlp_service.process(payload)
