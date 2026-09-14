import httpx
import logging
import time
import datetime
from typing import Optional, Dict, Any, Tuple
from app.schemas.weather import WeatherResponse, DailyForecast
from app.services.weather_intelligence import generate_weather_intelligence

logger = logging.getLogger(__name__)

# In-memory weather cache: key -> (timestamp, WeatherResponse)
# Cache TTL = 10 minutes (600 seconds)
WEATHER_CACHE: Dict[str, Tuple[float, WeatherResponse]] = {}
CACHE_TTL_SECONDS = 600.0

async def get_weather_data(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    location_name: Optional[str] = None,
    farm_context: Optional[Dict[str, Any]] = None,
    farm_id: Optional[int] = None
) -> WeatherResponse:
    """
    Connects to Open-Meteo API for real-time agricultural weather.
    Prioritizes active farm coordinates -> geocoded locality -> default fallback.
    Implements 10-minute TTL caching per coordinate pair.
    """
    context = farm_context or {}

    # Extract coordinates from farm_context if available and lat/lon not provided
    if (lat is None or lon is None) and context.get("latitude") and context.get("longitude"):
        lat = context.get("latitude")
        lon = context.get("longitude")

    if not location_name:
        loc_name_ctx = context.get("location_name")
        district = context.get("district")
        state = context.get("state")
        village = context.get("village_locality")

        if loc_name_ctx:
            location_name = loc_name_ctx
        elif village and state:
            location_name = f"{village}, {state}"
        elif district and state:
            location_name = f"{district}, {state}"
        elif district or state:
            location_name = district or state

    loc_display = location_name or "Punjab Agricultural Zone"

    # Geocoding fallback if no lat/lon
    if (lat is None or lon is None) and location_name:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                geo_resp = await client.get(
                    f"https://geocoding-api.open-meteo.com/v1/search?name={location_name}&count=1&language=en&format=json"
                )
                if geo_resp.status_code == 200:
                    geo_data = geo_resp.json()
                    if "results" in geo_data and len(geo_data["results"]) > 0:
                        res = geo_data["results"][0]
                        lat, lon = res["latitude"], res["longitude"]
                        loc_display = f'{res["name"]}, {res.get("admin1", "")}'
        except Exception as e:
            logger.error(f"Geocoding failed for '{location_name}': {e}")

    # Fallback coordinates (Ludhiana, Punjab) if none available
    if lat is None or lon is None:
        lat, lon = 30.9, 75.85
        loc_display = loc_display if location_name else "Ludhiana, Punjab"

    # Check Cache
    cache_key = f"{round(lat, 3)}_{round(lon, 3)}"
    now = time.time()
    if cache_key in WEATHER_CACHE:
        cached_time, cached_resp = WEATHER_CACHE[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            logger.info(f"Serving cached weather response for coordinates ({lat}, {lon})")
            # Update farm context summary in cached response if needed
            cached_resp.farm_context_summary = _build_farm_summary(context, loc_display)
            return cached_resp

    farm_summary = _build_farm_summary(context, loc_display)

    # Validate lat/lon range
    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
        return WeatherResponse(
            location=loc_display,
            temperature=0,
            feels_like=0,
            condition="Invalid Coordinates",
            humidity=0,
            wind_speed=0.0,
            rain_probability=0,
            precipitation_mm=0.0,
            uv_index=0,
            agricultural_warnings=["Invalid farm location coordinates."],
            forecast=[],
            is_live=False,
            is_unavailable=True,
            message="Invalid geographic coordinates provided for farm location.",
            last_updated=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            weather_source="Open-Meteo Real-Time Weather Station",
            agroguard_intelligence=[],
            farm_context_summary=farm_summary
        )

    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current_weather=true&"
            f"hourly=relative_humidity_2m,apparent_temperature,precipitation,dew_point_2m,wind_speed_10m,precipitation_probability,uv_index&"
            f"daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&"
            f"timezone=auto"
        )
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise ValueError(f"Open-Meteo API returned HTTP status {resp.status_code}")

            data = resp.json()
            curr = data.get("current_weather", {})
            hourly = data.get("hourly", {})
            daily = data.get("daily", {})

            # Current metrics
            temp = round(curr.get("temperature", 28))
            wind_speed = round(curr.get("windspeed", 12.4), 1)

            # Apparent temperature (feels-like)
            apparent_list = hourly.get("apparent_temperature", [temp])
            feels_like = round(apparent_list[0]) if apparent_list else temp

            # Current precipitation mm
            precip_list = hourly.get("precipitation", [0.0])
            precipitation_mm = round(float(precip_list[0]), 2) if precip_list else 0.0

            # Humidity & Dew Point
            humidity_list = hourly.get("relative_humidity_2m", [65])
            humidity = round(humidity_list[0]) if humidity_list else 65

            dew_point_list = hourly.get("dew_point_2m", [15])
            dew_point = dew_point_list[0] if dew_point_list else 15

            rain_prob_list = hourly.get("precipitation_probability", [0])
            rain_prob = round(rain_prob_list[0]) if rain_prob_list else 0

            uv_index_list = hourly.get("uv_index", [5])
            uv_index = round(uv_index_list[0]) if uv_index_list else 5

            # Map WMO codes
            wmo_code = curr.get("weathercode", 0)
            condition = _map_wmo_code(wmo_code)

            # Agricultural Warnings
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
            daily_times = daily.get("time", [])
            daily_max = daily.get("temperature_2m_max", [])
            daily_min = daily.get("temperature_2m_min", [])
            daily_wmo = daily.get("weathercode", [])
            daily_rain = daily.get("precipitation_probability_max", [])

            for i in range(min(5, len(daily_times))):
                date_str = daily_times[i]
                d = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
                if d == today_date:
                    day_name = "Today"
                elif d == today_date + datetime.timedelta(days=1):
                    day_name = "Tomorrow"
                else:
                    day_name = d.strftime("%A")

                f_wmo = daily_wmo[i] if i < len(daily_wmo) else 0
                f_cond = _map_wmo_code(f_wmo)

                high_val = daily_max[i] if i < len(daily_max) else 30
                low_val = daily_min[i] if i < len(daily_min) else 20
                rain_val = daily_rain[i] if i < len(daily_rain) and daily_rain[i] is not None else 0

                forecasts.append(
                    DailyForecast(
                        day=day_name,
                        temp_high=round(high_val),
                        temp_low=round(low_val),
                        condition=f_cond,
                        icon=_map_wmo_icon(f_wmo),
                        rain_probability=round(rain_val)
                    )
                )

            # Generate Weather Intelligence
            intelligence = generate_weather_intelligence(
                temperature=float(temp),
                humidity=float(humidity),
                wind_speed=float(wind_speed),
                rain_probability=rain_prob,
                condition=condition,
                farm_context=context
            )

            last_updated_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

            weather_resp = WeatherResponse(
                location=loc_display,
                temperature=temp,
                feels_like=feels_like,
                condition=condition,
                humidity=humidity,
                wind_speed=wind_speed,
                rain_probability=rain_prob,
                precipitation_mm=precipitation_mm,
                uv_index=round(uv_index),
                agricultural_warnings=warnings,
                forecast=forecasts,
                is_live=True,
                is_unavailable=False,
                message="Live agricultural weather from Open-Meteo.",
                last_updated=last_updated_str,
                weather_source="Open-Meteo Real-Time Weather Station",
                agroguard_intelligence=intelligence,
                farm_context_summary=farm_summary
            )

            # Store in cache
            WEATHER_CACHE[cache_key] = (now, weather_resp)
            return weather_resp

    except Exception as e:
        logger.error(f"Open-Meteo weather fetch error for ({lat}, {lon}): {e}")
        # Real weather API failure state (No fabricated fake live weather)
        return WeatherResponse(
            location=loc_display,
            temperature=0,
            feels_like=0,
            condition="Unavailable",
            humidity=0,
            wind_speed=0.0,
            rain_probability=0,
            precipitation_mm=0.0,
            uv_index=0,
            agricultural_warnings=["Weather service is currently unavailable for this farm."],
            forecast=[],
            is_live=False,
            is_unavailable=True,
            message="Live weather service is currently unavailable. Please check your network connection.",
            last_updated=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            weather_source="Open-Meteo Real-Time Weather Station",
            agroguard_intelligence=[],
            farm_context_summary=farm_summary
        )

def _build_farm_summary(context: Dict[str, Any], loc_display: str) -> Dict[str, Any]:
    crops_list = context.get("crops") or [context.get("crop")] if context.get("crop") else ["Crop"]
    return {
        "farm_id": context.get("farm_id"),
        "farm_name": context.get("name") or "Farm",
        "crop": ", ".join(crops_list) if isinstance(crops_list, list) else str(crops_list),
        "growth_stage": ", ".join(context.get("crop_stages", [])) if context.get("crop_stages") else "Vegetative",
        "location": context.get("district") or context.get("state") or loc_display,
        "soil_type": ", ".join(context.get("soil_information", [])) if context.get("soil_information") else "Alluvial"
    }

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
