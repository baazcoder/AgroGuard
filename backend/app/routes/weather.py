from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import active_farm_service, profile_service
from app.services.weather_service import get_weather_data
from app.schemas.weather import WeatherResponse

router = APIRouter(prefix="/api", tags=["Weather"])

@router.get("/weather", response_model=WeatherResponse)
async def fetch_weather(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    location: Optional[str] = Query(None, description="City or Region Name"),
    farm_id: Optional[int] = Query(None, description="Active Farm ID"),
    db: Session = Depends(get_db)
):
    """
    Get agricultural weather report, crop risk warnings, and personalized AgroGuard weather intelligence
    automatically mapped to the farmer's active farm.
    """
    active_ctx = await active_farm_service.get_active_farm_context(db, farm_id=farm_id, farmer_id=1)
    farm_dict = active_ctx.model_dump()

    # Prioritize exact coordinates from active farm if lat/lon not explicitly passed
    req_lat = lat if lat is not None else active_ctx.latitude
    req_lon = lon if lon is not None else active_ctx.longitude

    return await get_weather_data(
        lat=req_lat,
        lon=req_lon,
        location_name=location or active_ctx.location_name,
        farm_context=farm_dict,
        farm_id=active_ctx.farm_id
    )

