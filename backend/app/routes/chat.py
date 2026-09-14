from fastapi import APIRouter
from datetime import datetime
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.gemini_service import generate_chat_response

router = APIRouter(prefix="/api", tags=["AI Farming Assistant"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(req: ChatRequest):
    """
    Conversational AI assistant endpoint for farmer Q&A.
    """
    reply = await generate_chat_response(prompt=req.message, history=req.history)
    return ChatResponse(
        reply=reply,
        timestamp=datetime.now().strftime("%I:%M %p")
    )
