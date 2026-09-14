from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.gemini_service import generate_chat_response
from app.services import chat_context_service

router = APIRouter(prefix="/api", tags=["AI Farming Assistant"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Conversational AI assistant endpoint integrated with Active Farm System.
    Automatically resolves Active Farm, selected field, live weather, nearby mandis, and disease observations.
    """
    farm_context = await chat_context_service.get_unified_chat_context(
        db,
        farm_id=req.farm_id,
        field_id=req.field_id
    )
    
    farmer_meta = farm_context.get("farmer", {})
    preferred_lang = req.language or farmer_meta.get("preferred_language", "English")

    reply = await generate_chat_response(
        prompt=req.message,
        history=req.history,
        farmer_context=farm_context,
        language=preferred_lang
    )
    return ChatResponse(
        reply=reply,
        timestamp=datetime.now().strftime("%I:%M %p")
    )

