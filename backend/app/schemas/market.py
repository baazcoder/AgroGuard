from pydantic import BaseModel
from typing import List, Optional

class MarketPriceItem(BaseModel):
    crop: str
    mandi: str
    state: str
    district: str
    min_price: float
    max_price: float
    modal_price: float
    unit: str = "₹ / Quintal"
    trend: str  # "up", "down", "stable"
    date: str

class MarketResponse(BaseModel):
    location: str
    updated_at: str
    prices: List[MarketPriceItem]
    is_live: bool = False
    status_message: str = "Demonstration Mandi Data (Live API endpoint configurable)"
