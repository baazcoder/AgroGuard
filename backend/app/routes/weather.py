from fastapi import APIRouter, Query
from typing import Optional
from app.services.weather_service import get_weather_data
from app.schemas.weather import WeatherResponse

router = APIRouter(prefix="/api", tags=["Weather"])

@router.get("/weather", response_model=WeatherResponse)
async def fetch_weather(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    location: Optional[str] = Query(None, description="City or Region Name")
):
    """
    Get agricultural weather report and crop risk warnings.
    """
    return await get_weather_data(lat=lat, lon=lon, location_name=location)
