from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.economics import FarmEconomicsRequest, FarmEconomicsResponse
from app.services import economics_service, profile_service
from typing import Optional

router = APIRouter(prefix="/api", tags=["Land-Area Farm Economics Engine"])

@router.get("/farm-economics", response_model=FarmEconomicsResponse)
async def get_farmer_economics(
    crop: Optional[str] = None,
    land_area: Optional[float] = None,
    land_unit: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve land-area personalized farm economics automatically using saved Farmer Profile context from DB.
    Allows optional override via query params.
    """
    farmer_ctx = profile_service.get_farmer_context(db)
    
    target_crop = crop or farmer_ctx.get("current_crop") or "Wheat"
    target_area = land_area if land_area is not None else farmer_ctx.get("land_area", 4.0)
    target_unit = land_unit or farmer_ctx.get("land_unit", "acre")

    response = await economics_service.calculate_farm_economics(
        crop=target_crop,
        land_area=target_area,
        land_unit=target_unit
    )
    return response

@router.post("/farm-economics", response_model=FarmEconomicsResponse)
async def calculate_custom_economics(req: FarmEconomicsRequest):
    """
    Calculate deterministic farm economics for custom land area, unit, crop, or custom price.
    """
    response = await economics_service.calculate_farm_economics(
        crop=req.crop,
        land_area=req.land_area,
        land_unit=req.land_unit,
        custom_market_price=req.custom_market_price
    )
    return response
