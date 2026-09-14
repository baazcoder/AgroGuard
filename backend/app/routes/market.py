from fastapi import APIRouter, Query
from typing import Optional
from app.services.market_service import get_market_prices
from app.schemas.market import MarketResponse

router = APIRouter(prefix="/api", tags=["Market & Mandi Prices"])

@router.get("/market", response_model=MarketResponse)
async def fetch_market_prices(
    crop: Optional[str] = Query(None, description="Filter by crop name"),
    state: Optional[str] = Query(None, description="Filter by state name")
):
    """
    Get live/demonstration Mandi market commodity prices across India.
    """
    return await get_market_prices(crop_filter=crop, state_filter=state)
