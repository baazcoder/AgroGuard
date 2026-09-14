from typing import Optional, List
from app.schemas.market import MarketResponse, MarketPriceItem
from datetime import datetime

async def get_market_prices(crop_filter: Optional[str] = None, state_filter: Optional[str] = None) -> MarketResponse:
    """
    Modular Mandi Market service.
    Returns structured market price data for Indian agricultural commodities.
    """
    current_date = datetime.now().strftime("%Y-%m-%d")
    
    all_prices = [
        MarketPriceItem(
            crop="Wheat (Kanak)",
            mandi="Khanna Mandi",
            state="Punjab",
            district="Ludhiana",
            min_price=2275.0,
            max_price=2450.0,
            modal_price=2350.0,
            trend="up",
            date=current_date
        ),
        MarketPriceItem(
            crop="Paddy (Basmati 1121)",
            mandi="Karnal Mandi",
            state="Haryana",
            district="Karnal",
            min_price=3800.0,
            max_price=4250.0,
            modal_price=4100.0,
            trend="up",
            date=current_date
        ),
        MarketPriceItem(
            crop="Cotton (Medium Staple)",
            mandi="Abohar Mandi",
            state="Punjab",
            district="Fazilka",
            min_price=6600.0,
            max_price=7100.0,
            modal_price=6850.0,
            trend="stable",
            date=current_date
        ),
        MarketPriceItem(
            crop="Mustard (Sarson)",
            mandi="Bharatpur Mandi",
            state="Rajasthan",
            district="Bharatpur",
            min_price=5300.0,
            max_price=5750.0,
            modal_price=5550.0,
            trend="down",
            date=current_date
        ),
        MarketPriceItem(
            crop="Potato (Jyoti)",
            mandi="Agra Mandi",
            state="Uttar Pradesh",
            district="Agra",
            min_price=1450.0,
            max_price=1700.0,
            modal_price=1600.0,
            trend="stable",
            date=current_date
        ),
        MarketPriceItem(
            crop="Tomato",
            mandi="Azadpur Mandi",
            state="Delhi",
            district="North Delhi",
            min_price=2100.0,
            max_price=2600.0,
            modal_price=2350.0,
            trend="up",
            date=current_date
        ),
        MarketPriceItem(
            crop="Soybean",
            mandi="Indore Mandi",
            state="Madhya Pradesh",
            district="Indore",
            min_price=4400.0,
            max_price=4800.0,
            modal_price=4650.0,
            trend="stable",
            date=current_date
        )
    ]
    
    filtered = all_prices
    if crop_filter:
        filtered = [p for p in filtered if crop_filter.lower() in p.crop.lower()]
    if state_filter:
        filtered = [p for p in filtered if state_filter.lower() in p.state.lower()]
        
    return MarketResponse(
        location="India Agro-Market Network",
        updated_at=datetime.now().strftime("%d %b %Y, %I:%M %p"),
        prices=filtered,
        is_live=False,
        status_message="Demonstration Mandi Data (AGMARKNET API integration ready)"
    )
