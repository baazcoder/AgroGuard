from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.market_service import get_market_prices, get_market_intelligence
from app.services import active_farm_service, profile_service
from app.schemas.market import MarketResponse, MarketIntelligenceResponse

router = APIRouter(prefix="/api", tags=["Market & Mandi Prices"])

@router.get("/market", response_model=MarketResponse)
async def fetch_market_prices(
    crop: Optional[str] = Query(None, description="Filter by crop name"),
    state: Optional[str] = Query(None, description="Filter by state name"),
    farm_id: Optional[int] = Query(None, description="Active Farm ID"),
    db: Session = Depends(get_db)
):
    """
    Get Mandi market commodity prices ranked by active farm coordinates.
    """
    farm_ctx = None
    try:
        active_farm_ctx = active_farm_service.get_active_farm_context(db, farm_id=farm_id)
        if active_farm_ctx:
            farm_ctx = active_farm_ctx.model_dump()
    except Exception:
        farm_ctx = profile_service.get_farmer_context(db)

    return await get_market_prices(crop_filter=crop, state_filter=state, farm_context=farm_ctx)

@router.get("/market/intelligence", response_model=MarketIntelligenceResponse)
async def fetch_market_intelligence(
    crop: Optional[str] = Query(None, description="Filter by crop name"),
    state: Optional[str] = Query(None, description="Filter by state name"),
    farm_id: Optional[int] = Query(None, description="Active Farm ID"),
    force_unavailable: bool = Query(False, description="Simulate offline / API failure state"),
    db: Session = Depends(get_db)
):
    """
    Get Market Intelligence report: proximity-ranked nearby mandis, 7-day price trends, and AI market insight.
    """
    farm_ctx = None
    try:
        active_farm_ctx = active_farm_service.get_active_farm_context(db, farm_id=farm_id)
        if active_farm_ctx:
            farm_ctx = active_farm_ctx.model_dump()
    except Exception:
        farm_ctx = profile_service.get_farmer_context(db)

    if not farm_ctx:
        farm_ctx = profile_service.get_farmer_context(db)

    return await get_market_intelligence(
        crop_filter=crop,
        state_filter=state,
        farm_context=farm_ctx,
        language=farm_ctx.get("language", "English") if farm_ctx else "English",
        force_unavailable=force_unavailable
    )


