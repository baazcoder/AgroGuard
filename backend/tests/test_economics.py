import pytest
import asyncio
from app.utils import unit_converter
from app.services import economics_service

# 1. UNIT CONVERSION TESTS
def test_unit_conversions_acre_to_hectare():
    assert unit_converter.to_hectares(1.0, "acre") == pytest.approx(0.4047, abs=1e-3)
    assert unit_converter.to_acres(1.0, "hectare") == pytest.approx(2.4711, abs=1e-3)
    assert unit_converter.to_acres(10.0, "ha") == pytest.approx(24.7105, abs=1e-3)

def test_unit_conversions_sqm():
    assert unit_converter.to_acres(10000.0, "sqm") == pytest.approx(2.4711, abs=1e-3)
    assert unit_converter.to_hectares(10000.0, "sqm") == pytest.approx(1.0, abs=1e-3)
    assert unit_converter.to_sqm(1.0, "acre") == pytest.approx(4046.86, abs=1e-1)
    assert unit_converter.to_sqm(1.0, "hectare") == pytest.approx(10000.0, abs=1e-1)

def test_zero_and_negative_land_conversion():
    assert unit_converter.to_acres(0.0, "acre") == 0.0
    assert unit_converter.to_acres(-5.0, "acre") == 0.0
    assert unit_converter.to_hectares(-10.0, "hectare") == 0.0
    assert unit_converter.to_sqm(-100.0, "sqm") == 0.0

# 2. DETERMINISTIC ECONOMICS CALCULATIONS TESTS
def test_different_land_sizes_4_acres_wheat():
    res = asyncio.run(economics_service.calculate_farm_economics(
        crop="Wheat",
        land_area=4.0,
        land_unit="acre"
    ))
    assert res.land_area_acres == 4.0
    assert res.is_verified_crop is True
    assert res.data_status == "VERIFIED DATA"
    
    # Wheat seed rate = 40 kg/acre -> 4 acres = 160 kg
    seed_item = next(i for i in res.cost_breakdown if i.category == "Seed")
    assert seed_item.quantity == 160.0  # 4 * 40
    
    # Expected production: 20 Qtl/acre -> 4 acres = 80 Qtl
    assert res.expected_production_qtl == 80.0
    assert res.expected_production_kg == 8000.0
    
    # Financial consistency: Margin = Revenue - Cost
    assert res.total_input_cost > 0
    assert res.gross_revenue > 0
    assert res.estimated_margin == round(res.gross_revenue - res.total_input_cost, 2)

def test_hectares_and_sqm_land_sizes():
    # 2 Hectares Wheat (≈ 4.9421 Acres)
    res_ha = asyncio.run(economics_service.calculate_farm_economics(
        crop="Wheat",
        land_area=2.0,
        land_unit="hectare"
    ))
    assert res_ha.land_area_acres == pytest.approx(4.9421, abs=1e-3)
    assert res_ha.total_input_cost > 0

    # 5,000 sqm Wheat (≈ 1.2355 Acres)
    res_sqm = asyncio.run(economics_service.calculate_farm_economics(
        crop="Wheat",
        land_area=5000.0,
        land_unit="sqm"
    ))
    assert res_sqm.land_area_acres == pytest.approx(1.2355, abs=1e-3)
    assert res_sqm.total_input_cost > 0

def test_zero_or_negative_land_input():
    res_zero = asyncio.run(economics_service.calculate_farm_economics(
        crop="Wheat",
        land_area=0.0,
        land_unit="acre"
    ))
    assert res_zero.total_input_cost == 0.0
    assert res_zero.expected_production_qtl == 0.0
    assert res_zero.gross_revenue == 0.0
    assert res_zero.estimated_margin == 0.0
    assert res_zero.data_status == "UNAVAILABLE DATA"

    res_neg = asyncio.run(economics_service.calculate_farm_economics(
        crop="Wheat",
        land_area=-5.0,
        land_unit="acre"
    ))
    assert res_neg.total_input_cost == 0.0
    assert res_neg.gross_revenue == 0.0

def test_missing_price_scenario():
    # Force custom_market_price = 0.0 for an unknown crop
    res = asyncio.run(economics_service.calculate_farm_economics(
        crop="Unknown Exotic Dragon Fruit",
        land_area=3.0,
        land_unit="acre",
        custom_market_price=0.0
    ))
    assert res.is_verified_crop is False
    assert res.market_price_per_qtl == 0.0
    assert "Market Price per Quintal" in res.missing_fields
    assert res.gross_revenue == 0.0
    assert res.data_status == "UNAVAILABLE DATA"

def test_unverified_crop_missing_agricultural_rate():
    # Unverified crop: system should NOT fabricate seed/fertilizer rates
    res = asyncio.run(economics_service.calculate_farm_economics(
        crop="Kiwi",
        land_area=2.0,
        land_unit="acre"
    ))
    assert res.is_verified_crop is False
    assert any("Official Seed Rate" in field for field in res.missing_fields)
    assert res.total_input_cost == 0.0  # Application rates marked unavailable, not fabricated!
    assert res.data_status == "UNAVAILABLE DATA"
