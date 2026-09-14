import pytest
import asyncio
from unittest.mock import patch, AsyncMock
from app.services.weather_intelligence import generate_weather_intelligence
from app.services.weather_service import get_weather_data

def test_weather_intelligence_rain_warning():
    """Verify rain > 50% triggers UNSAFE spraying & DELAY irrigation advisories."""
    farm_ctx = {"crop": "Wheat", "growth_stage": "Vegetative", "district": "Ludhiana"}
    advisories = generate_weather_intelligence(
        temperature=28.0,
        humidity=60.0,
        wind_speed=10.0,
        rain_probability=65,
        condition="Rain",
        farm_context=farm_ctx
    )
    
    spraying = next(a for a in advisories if a.category == "spraying")
    assert spraying.status == "UNSAFE"
    assert "High Rain Risk" in spraying.title
    
    irrigation = next(a for a in advisories if a.category == "irrigation")
    assert irrigation.status == "DELAY"

def test_weather_intelligence_planting_and_harvesting():
    """Verify high rain triggers DELAY planting and CAUTION harvesting advisories."""
    farm_ctx = {"crop": "Wheat", "growth_stage": "Harvesting"}
    advisories = generate_weather_intelligence(
        temperature=25.0,
        humidity=70.0,
        wind_speed=12.0,
        rain_probability=65,
        condition="Rain",
        farm_context=farm_ctx
    )

    planting = next(a for a in advisories if a.category == "planting")
    assert planting.status == "DELAY"
    assert "Delay Sowing" in planting.title

    harvesting = next(a for a in advisories if a.category == "harvesting")
    assert harvesting.status == "CAUTION"

def test_weather_intelligence_high_wind_drift():
    """Verify wind >= 20 km/h triggers UNSAFE spraying advisory."""
    farm_ctx = {"crop": "Cotton", "growth_stage": "Flowering"}
    advisories = generate_weather_intelligence(
        temperature=30.0,
        humidity=50.0,
        wind_speed=22.5,
        rain_probability=10,
        condition="Clear Sky",
        farm_context=farm_ctx
    )
    
    spraying = next(a for a in advisories if a.category == "spraying")
    assert spraying.status == "UNSAFE"
    assert "High Wind Drift" in spraying.title

def test_weather_intelligence_fungal_spore_risk():
    """Verify humidity >= 75% and temp 20-32°C triggers HIGH_RISK disease advisory."""
    farm_ctx = {"crop": "Rice", "growth_stage": "Tillering"}
    advisories = generate_weather_intelligence(
        temperature=26.0,
        humidity=85.0,
        wind_speed=8.0,
        rain_probability=20,
        condition="Partly Cloudy",
        farm_context=farm_ctx
    )
    
    disease = next(a for a in advisories if a.category == "disease_risk")
    assert disease.status == "HIGH_RISK"
    assert "High Fungal Threat" in disease.title

def test_weather_intelligence_extreme_heat():
    """Verify temp >= 38°C triggers heat stress irrigation recommendation."""
    farm_ctx = {"crop": "Sugarcane", "growth_stage": "Grand Growth"}
    advisories = generate_weather_intelligence(
        temperature=41.0,
        humidity=40.0,
        wind_speed=12.0,
        rain_probability=5,
        condition="Clear Sky",
        farm_context=farm_ctx
    )
    
    irrigation = next(a for a in advisories if a.category == "irrigation")
    assert irrigation.status == "RECOMMENDED"
    assert "Heat Stress" in irrigation.title

def test_weather_service_api_failure_state():
    """Verify API failure returns is_unavailable=True and does not fabricate live weather data."""
    with patch("httpx.AsyncClient.get", side_effect=Exception("Network Connection Failed")):
        resp = asyncio.run(get_weather_data(lat=30.9, lon=75.85, location_name="Test District"))
        assert resp.is_unavailable is True
        assert resp.is_live is False
        assert resp.condition == "Unavailable"
        assert resp.agroguard_intelligence == []
        assert "unavailable" in resp.message.lower()
