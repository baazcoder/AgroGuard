from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class DailyForecast(BaseModel):
    day: str
    temp_high: int
    temp_low: int
    condition: str
    icon: str
    rain_probability: int

class WeatherAdvisory(BaseModel):
    category: str  # 'spraying' | 'irrigation' | 'disease_risk' | 'field_ops'
    status: str    # 'SAFE' | 'CAUTION' | 'UNSAFE' | 'RECOMMENDED' | 'DELAY' | 'INFO'
    title: str
    recommendations: List[str]
    reasons: List[str]

class WeatherResponse(BaseModel):
    location: str
    temperature: int
    feels_like: int = 28
    condition: str
    humidity: int
    wind_speed: float
    rain_probability: int
    precipitation_mm: float = 0.0
    uv_index: int
    agricultural_warnings: List[str]
    forecast: List[DailyForecast]
    is_live: bool = False
    is_unavailable: bool = False
    message: Optional[str] = None
    last_updated: Optional[str] = None
    weather_source: Optional[str] = "Open-Meteo Real-Time Weather Station"
    agroguard_intelligence: List[WeatherAdvisory] = []
    farm_context_summary: Optional[Dict[str, Any]] = None

