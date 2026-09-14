import httpx
import logging
from typing import Optional
from app.schemas.weather import WeatherResponse, DailyForecast
import datetime

logger = logging.getLogger(__name__)

async def get_weather_data(lat: Optional[float] = None, lon: Optional[float] = None, location_name: Optional[str] = None) -> WeatherResponse:
    """
    Connects to Open-Meteo API for real-time weather and forecast.
    Calculates agricultural risks like fungal spore warnings.
    """
    loc_display = location_name or "Punjab Agricultural Zone"
    
    # If location_name is provided but no lat/lon, try to geocode
    if location_name and not (lat and lon):
        try:
            async with httpx.AsyncClient() as client:
                geo_resp = await client.get(f"https://geocoding-api.open-meteo.com/v1/search?name={location_name}&count=1&language=en&format=json")
                geo_data = geo_resp.json()
                if "results" in geo_data and len(geo_data["results"]) > 0:
                    res = geo_data["results"][0]
                    lat, lon = res["latitude"], res["longitude"]
                    loc_display = f'{res["name"]}, {res.get("admin1", "")}'
        except Exception as e:
            logger.error(f"Geocoding failed: {e}")

    # Fallback coordinates if none provided/found
    if not lat or not lon:
        lat, lon = 30.9, 75.85 # Ludhiana, Punjab
        loc_display = "Ludhiana, Punjab (Default)"
    
    if location_name and not loc_display:
        loc_display = location_name

    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current_weather=true&"
            f"hourly=relative_humidity_2m,dew_point_2m,wind_speed_10m,precipitation_probability,uv_index&"
            f"daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&"
            f"timezone=auto"
        )
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            data = resp.json()
            
            curr = data.get("current_weather", {})
            hourly = data.get("hourly", {})
            daily = data.get("daily", {})

            # Current metrics
            temp = curr.get("temperature", 28)
            wind_speed = curr.get("windspeed", 12.4)
            
            # Extract first hourly value as current proxy
            humidity = hourly.get("relative_humidity_2m", [65])[0]
            dew_point = hourly.get("dew_point_2m", [15])[0]
            rain_prob = hourly.get("precipitation_probability", [0])[0]
            uv_index = hourly.get("uv_index", [5])[0]
            
            # Map WMO codes to conditions
            wmo_code = curr.get("weathercode", 0)
            condition = _map_wmo_code(wmo_code)
            
            # Agricultural Warnings logic
            warnings = []
            if humidity > 85 or (temp - dew_point < 2.5):
                warnings.append("High humidity and dew risk. Elevated risk of fungal spore germination (e.g. rust, blight).")
            if wind_speed < 15 and rain_prob < 30:
                warnings.append("Ideal conditions for foliar spraying (Wind speed < 15 km/h).")
            elif wind_speed >= 20:
                warnings.append("Avoid spraying due to high wind drift risk.")
            if rain_prob > 60:
                warnings.append("Postpone foliar spraying due to high rain wash-off risk.")
                
            # 5-Day Forecast
            forecasts = []
            today_date = datetime.date.today()
            for i in range(min(5, len(daily.get("time", [])))):
                date_str = daily["time"][i]
                d = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
                if d == today_date:
                    day_name = "Today"
                elif d == today_date + datetime.timedelta(days=1):
                    day_name = "Tomorrow"
                else:
                    day_name = d.strftime("%A")
                
                f_wmo = daily.get("weathercode", [])[i]
                f_cond = _map_wmo_code(f_wmo)
                
                forecasts.append(
                    DailyForecast(
                        day=day_name,
                        temp_high=daily.get("temperature_2m_max", [])[i],
                        temp_low=daily.get("temperature_2m_min", [])[i],
                        condition=f_cond,
                        icon=_map_wmo_icon(f_wmo),
                        rain_probability=daily.get("precipitation_probability_max", [])[i]
                    )
                )

            return WeatherResponse(
                location=loc_display,
                temperature=temp,
                condition=condition,
                humidity=humidity,
                wind_speed=wind_speed,
                rain_probability=rain_prob,
                uv_index=round(uv_index),
                agricultural_warnings=warnings,
                forecast=forecasts,
                is_live=True,
                message="Live agricultural weather from Open-Meteo."
            )
    except Exception as e:
        logger.error(f"Open-Meteo API failed: {e}")
        # Fallback
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
            message="Could not fetch live data. Displaying fallback regional data."
        )

def _map_wmo_code(code: int) -> str:
    if code == 0: return "Clear Sky"
    elif code in [1, 2, 3]: return "Partly Cloudy"
    elif code in [45, 48]: return "Foggy"
    elif code in [51, 53, 55]: return "Drizzle"
    elif code in [61, 63, 65]: return "Rain"
    elif code in [71, 73, 75]: return "Snow"
    elif code in [95, 96, 99]: return "Thunderstorm"
    return "Unknown"

def _map_wmo_icon(code: int) -> str:
    if code == 0: return "sun"
    elif code in [1, 2, 3]: return "cloud-sun"
    elif code in [45, 48]: return "cloud-fog"
    elif code in [51, 53, 55, 61, 63, 65]: return "cloud-rain"
    elif code in [95, 96, 99]: return "cloud-lightning"
    return "cloud"
