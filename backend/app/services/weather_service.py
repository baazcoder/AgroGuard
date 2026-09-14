import httpx
import logging
from typing import Optional
from app.schemas.weather import WeatherResponse, DailyForecast

logger = logging.getLogger(__name__)

async def get_weather_data(lat: Optional[float] = None, lon: Optional[float] = None, location_name: Optional[str] = None) -> WeatherResponse:
    """
    Modular weather service.
    Can be connected to OpenWeather API or returns regional agricultural weather data.
    """
    loc_display = location_name or "Punjab Agricultural Zone"
    if lat and lon:
        loc_display = f"Location ({lat:.2f}°, {lon:.2f}°)"

    # Modular response with realistic agricultural parameters & warnings
    return WeatherResponse(
        location=loc_display,
        temperature=28,
        condition="Partly Cloudy",
        humidity=65,
        wind_speed=12.4,
        rain_probability=30,
        uv_index=6,
        agricultural_warnings=[
            "Moderate dew expected tonight. Elevated risk of fungal spore germination.",
            "Ideal conditions for morning spraying (Wind speed < 15 km/h)."
        ],
        forecast=[
            DailyForecast(day="Today", temp_high=30, temp_low=21, condition="Partly Cloudy", icon="cloud-sun", rain_probability=30),
            DailyForecast(day="Tomorrow", temp_high=32, temp_low=22, condition="Sunny", icon="sun", rain_probability=10),
            DailyForecast(day="Day 3", temp_high=29, temp_low=20, condition="Light Rain", icon="cloud-rain", rain_probability=65),
            DailyForecast(day="Day 4", temp_high=27, temp_low=19, condition="Thunderstorm", icon="cloud-lightning", rain_probability=80),
            DailyForecast(day="Day 5", temp_high=31, temp_low=21, condition="Clear", icon="sun", rain_probability=15),
        ],
        is_live=False,
        message="Displaying regional agricultural weather. Connect OPENWEATHER_API_KEY for live data integration."
    )
