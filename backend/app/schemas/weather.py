from pydantic import BaseModel
from typing import List, Optional

class DailyForecast(BaseModel):
    day: str
    temp_high: int
    temp_low: int
    condition: str
    icon: str
    rain_probability: int

class WeatherResponse(BaseModel):
    location: str
    temperature: int
    condition: str
    humidity: int
    wind_speed: float
    rain_probability: int
    uv_index: int
    agricultural_warnings: List[str]
    forecast: List[DailyForecast]
    is_live: bool = False
    message: Optional[str] = None
