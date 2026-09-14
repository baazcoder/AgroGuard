from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class HistoricalPricePoint(BaseModel):
    date: str
    price: float

class BestNearbyMarket(BaseModel):
    mandi: str
    district: str
    state: str
    price: float
    difference_pct: float

class MarketPriceItem(BaseModel):
    crop: str
    mandi: str
    state: str
    district: str
    mandi_lat: Optional[float] = None
    mandi_lon: Optional[float] = None
    distance_km: Optional[float] = None
    min_price: float
    max_price: float
    modal_price: float
    unit: str = "₹ / Quintal"
    trend: str  # "up", "down", "stable"
    trend_display: str = "➔ Stable"  # "↗ Increasing", "↘ Decreasing", "➔ Stable"
    seven_day_change_pct: float = 0.0
    historical_prices: List[HistoricalPricePoint] = []
    best_nearby_market: Optional[BestNearbyMarket] = None
    data_source: str = "AGMARKNET / Verified Mandi Network"
    date: str
    updated_minutes_ago: Optional[int] = 15
    is_price_available: bool = True
    price_status: str = "AVAILABLE"  # "AVAILABLE" or "Price data unavailable"

class MarketResponse(BaseModel):
    location: str
    updated_at: str
    prices: List[MarketPriceItem]
    farm_id: Optional[int] = None
    farm_name: Optional[str] = None
    is_live: bool = False
    is_unavailable: bool = False
    status_message: str = "Demonstration Mandi Data (Live API endpoint configurable)"

class MarketIntelligenceResponse(BaseModel):
    location: str
    updated_at: str
    prices: List[MarketPriceItem]
    agroguard_insight: str
    farm_context_summary: Optional[Dict[str, Any]] = None
    farm_id: Optional[int] = None
    farm_name: Optional[str] = None
    is_live: bool = False
    is_unavailable: bool = False
    status_message: str = "Market Intelligence Report Generated"


