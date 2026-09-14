from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.auth_deps import get_optional_current_user
from app.db.models import User
from app.schemas.decision import FarmActionPlanResponse
from app.services.decision_engine import get_daily_farm_action_plan

router = APIRouter(prefix="/api", tags=["AgroGuard AI Farm Decision Engine"])

@router.get("/farm-decision-engine", response_model=FarmActionPlanResponse)
async def fetch_daily_farm_action_plan(
    farm_id: Optional[int] = Query(None, description="Active farm ID filter"),
    force_fallback: bool = Query(False, description="Force deterministic rule fallback generation"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Primary AgroGuard Endpoint: Synthesizes Farmer Profile, Active Farm, Fields, Crops, Growth Stages,
    Disease Observations, Real-Time Weather, Forecast, Mandi Prices, Market Trends, Farm Area, Soil,
    and Irrigation into a structured, prioritized Daily Farm Action Plan answering: 'What should I do today?'
    """
    u_id = current_user.id if current_user else None
    return await get_daily_farm_action_plan(db=db, farm_id=farm_id, user_id=u_id, force_fallback=force_fallback)
