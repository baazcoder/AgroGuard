from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    language: Optional[str] = "English"
    farm_id: Optional[int] = None
    field_id: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    timestamp: str
