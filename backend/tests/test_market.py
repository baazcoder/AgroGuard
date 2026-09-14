import pytest
import asyncio
from app.services.market_service import (
    get_market_prices, 
    get_market_intelligence, 
    _generate_historical_points, 
    _calculate_trend,
    _process_and_sort_market_items,
    _get_raw_market_items
)
from app.utils.geo_utils import calculate_haversine_distance

def test_haversine_distance_calculation():
    """Verify Haversine distance between known coordinates (Rajpura to Khanna ~32km)."""
    dist = calculate_haversine_distance(30.4842, 76.5936, 30.7022, 76.2205)
    assert 40.0 <= dist <= 46.0

def test_haversine_distance_invalid_coordinates():
    """Verify invalid coordinates return 99999.9 without crashing."""
    assert calculate_haversine_distance(999, 999, 30.0, 75.0) == 99999.9
    assert calculate_haversine_distance("invalid", None, 30.0, 75.0) == 99999.9

def test_market_trend_ascending_calculation():
    """Verify ascending price trend calculations over 7 days."""
    hist = _generate_historical_points(2450.0, "up")
    trend, trend_display, pct_change = _calculate_trend(hist)
    assert trend == "up"
    assert "Increasing" in trend_display
    assert pct_change > 0

def test_market_trend_descending_calculation():
    """Verify descending price trend calculations over 7 days."""
    hist = _generate_historical_points(5550.0, "down")
    trend, trend_display, pct_change = _calculate_trend(hist)
    assert trend == "down"
    assert "Decreasing" in trend_display
    assert pct_change < 0

def test_market_trend_stable_calculation():
    """Verify stable price trend calculations."""
    hist = _generate_historical_points(6850.0, "stable")
    trend, trend_display, pct_change = _calculate_trend(hist)
    assert trend == "stable"
    assert "Stable" in trend_display

def test_farm_a_to_farm_b_mandi_proximity_switch():
    """
    Test 1 & 2:
    Farm A (Punjab) -> nearby mandis reflect Punjab mandis (Rajpura, Khanna).
    Farm B (Rajasthan) -> nearby mandis reflect Rajasthan mandis (Bharatpur, Alwar).
    Verify Farm A data does not leak into Farm B.
    """
    raw_items = _get_raw_market_items()

    # Farm A (Rajpura, Patiala, Punjab)
    farm_a_items = _process_and_sort_market_items(
        raw_items=[item.model_copy() for item in raw_items],
        farm_lat=30.4842,
        farm_lon=76.5936,
        farm_crops=["Wheat"]
    )
    assert farm_a_items[0].mandi == "Rajpura Mandi"
    assert farm_a_items[0].distance_km == 0.0

    # Farm B (Bharatpur, Rajasthan)
    farm_b_items = _process_and_sort_market_items(
        raw_items=[item.model_copy() for item in raw_items],
        farm_lat=27.2170,
        farm_lon=77.4895,
        farm_crops=["Mustard (Sarson)"]
    )
    assert farm_b_items[0].mandi == "Bharatpur Mandi"
    assert farm_b_items[0].distance_km == 0.0

    # Verify lists are different and independent
    assert farm_a_items[0].mandi != farm_b_items[0].mandi

def test_change_crop_relevant_mandi_prices():
    """Test 3: Changing crop filter returns relevant mandi prices."""
    raw_items = _get_raw_market_items()

    mustard_items = _process_and_sort_market_items(
        raw_items=[item.model_copy() for item in raw_items],
        farm_lat=27.2170,
        farm_lon=77.4895,
        crop_filter="Mustard"
    )
    assert len(mustard_items) > 0
    assert "Mustard" in mustard_items[0].crop

    wheat_items = _process_and_sort_market_items(
        raw_items=[item.model_copy() for item in raw_items],
        farm_lat=30.4842,
        farm_lon=76.5936,
        crop_filter="Wheat"
    )
    assert len(wheat_items) > 0
    assert "Wheat" in wheat_items[0].crop

def test_price_data_unavailable_for_unknown_crop():
    """Test 5 & 6: Verify clear 'Price data unavailable' state without fake price fabrication."""
    raw_items = _get_raw_market_items()

    exotic_items = _process_and_sort_market_items(
        raw_items=[item.model_copy() for item in raw_items],
        farm_lat=30.4842,
        farm_lon=76.5936,
        crop_filter="ExoticDragonFruit"
    )
    assert len(exotic_items) == 1
    assert exotic_items[0].is_price_available is False
    assert exotic_items[0].price_status == "Price data unavailable"
    assert exotic_items[0].modal_price == 0.0

def test_market_intelligence_nearby_market_comparison():
    """Verify nearby market comparison correctly populates best nearby mandi."""
    res = asyncio.run(get_market_intelligence(crop_filter="Wheat"))
    assert res.is_unavailable is False
    assert len(res.prices) > 0
    wheat = res.prices[0]
    assert wheat.crop == "Wheat"
    assert wheat.best_nearby_market is not None
    assert wheat.best_nearby_market.price > 0.0

def test_market_intelligence_api_unavailable_state():
    """Verify market service returns is_unavailable=True when service is unreachable or offline."""
    res = asyncio.run(get_market_intelligence(force_unavailable=True))
    assert res.is_unavailable is True
    assert res.is_live is False
    assert len(res.prices) == 0
    assert "unavailable" in res.agroguard_insight.lower()

