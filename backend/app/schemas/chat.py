from __future__ import annotations
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class NlpDebug(BaseModel):
    intent: str
    unit_ids: list[int]
    split: str
    lemmas: list[str]


class ChatResponse(BaseModel):
    reply: str
    history: list[ChatMessage]
    debug: NlpDebug
