from typing import Optional, List, Dict, Any
from app.utils import unit_converter
from app.data.agri_standards import get_crop_agri_benchmark
from app.services import market_service
from app.schemas.economics import FarmEconomicsResponse, CostBreakdownItem

DISCLAIMER_TEXT = (
  "IMPORTANT SAFETY DISCLAIMER: All figures are estimated based on supplied agricultural standards "
  "and market reference prices. Actual production, costs, and revenues vary depending on microclimate, "
  "weather anomalies, pest attacks, soil fertility, and local mandi price fluctuations. Profit is never guaranteed."
)

async def calculate_farm_economics(
    crop: str,
    land_area: float,
    land_unit: str = "acre",
    custom_market_price: Optional[float] = None
) -> FarmEconomicsResponse:
    """
    Pure Python deterministic calculation engine for land-personalized farm economics.
    Scales seed, fertilizer, irrigation, labor, yields, revenue, and profit margins
    specifically to the farmer's total land size.
    """
    # 1. Land Conversions
    acres = unit_converter.to_acres(land_area, land_unit)
    hectares = unit_converter.to_hectares(land_area, land_unit)
    sqm = unit_converter.to_sqm(land_area, land_unit)

    missing_fields: List[str] = []
    formulas_breakdown: List[str] = []
    cost_breakdown: List[CostBreakdownItem] = []

    # Handle Zero or Negative Land Area
    if acres <= 0:
        return FarmEconomicsResponse(
            crop_name=crop or "Unspecified Crop",
            land_area=0.0,
            land_unit=land_unit,
            land_area_acres=0.0,
            land_area_hectares=0.0,
            land_area_sqm=0.0,
            total_input_cost=0.0,
            cost_range={"min": 0.0, "max": 0.0},
            cost_breakdown=[],
            expected_production_qtl=0.0,
            expected_production_kg=0.0,
            production_range_qtl={"min": 0.0, "max": 0.0},
            market_price_per_qtl=0.0,
            market_price_source="None",
            gross_revenue=0.0,
            revenue_range={"min": 0.0, "max": 0.0},
            estimated_margin=0.0,
            margin_range={"min": 0.0, "max": 0.0},
            is_verified_crop=False,
            data_status="UNAVAILABLE DATA",
            missing_fields=["Valid Land Area (> 0)"],
            calculation_breakdown=["Land area is 0 or negative. Calculations require positive land area."],
            disclaimer=DISCLAIMER_TEXT
        )

    # 2. Check Verified Agricultural Benchmark
    agri = get_crop_agri_benchmark(crop)
    
    # 3. Determine Market Price & Source
    market_price = 0.0
    price_source = "Unavailable"
    
    if custom_market_price and custom_market_price > 0:
        market_price = float(custom_market_price)
        price_source = "User Provided Custom Price"
    else:
        # Check live mandi data
        try:
            mandi_data = await market_service.get_market_prices(crop_filter=crop)
            if mandi_data and mandi_data.prices and len(mandi_data.prices) > 0:
                market_price = mandi_data.prices[0].modal_price
                price_source = f"Live Mandi Rate ({mandi_data.prices[0].mandi}, {mandi_data.prices[0].state})"
        except Exception:
            pass

        if market_price <= 0 and agri and "benchmark_price_per_qtl" in agri:
            market_price = agri["benchmark_price_per_qtl"]
            price_source = f"MSP / ICAR Benchmark Reference Rate"

    if market_price <= 0:
        missing_fields.append("Market Price per Quintal")
        price_source = "Market price unavailable for this crop"

    # 4. Perform Deterministic Calculations
    if agri and agri.get("verified"):
        crop_display_name = agri["crop_name"]
        is_verified_crop = True
        
        # Seed
        seed_rate = agri["seed_rate_kg_per_acre"]
        seed_cost_kg = agri["seed_cost_per_kg"]
        total_seed_kg = round(seed_rate * acres, 2)
        total_seed_cost = round(total_seed_kg * seed_cost_kg, 2)
        cost_breakdown.append(CostBreakdownItem(
            category="Seed",
            item_name=f"Certified Seed ({seed_rate} kg/acre × {acres} acres)",
            quantity=total_seed_kg,
            unit="kg",
            cost_per_unit=seed_cost_kg,
            total_cost=total_seed_cost,
            is_verified=True
        ))

        # Fertilizers
        ferts = agri["fertilizers"]
        fert_prices = agri["fertilizer_prices_per_kg"]
        
        urea_kg = round(ferts.get("urea_kg_per_acre", 0) * acres, 2)
        urea_cost = round(urea_kg * fert_prices.get("urea", 6.0), 2)
        if urea_kg > 0:
            cost_breakdown.append(CostBreakdownItem(
                category="Fertilizer",
                item_name=f"Urea ({ferts['urea_kg_per_acre']} kg/acre)",
                quantity=urea_kg,
                unit="kg",
                cost_per_unit=fert_prices.get("urea", 6.0),
                total_cost=urea_cost,
                is_verified=True
            ))

        dap_kg = round(ferts.get("dap_kg_per_acre", 0) * acres, 2)
        dap_cost = round(dap_kg * fert_prices.get("dap", 27.0), 2)
        if dap_kg > 0:
            cost_breakdown.append(CostBreakdownItem(
                category="Fertilizer",
                item_name=f"DAP ({ferts['dap_kg_per_acre']} kg/acre)",
                quantity=dap_kg,
                unit="kg",
                cost_per_unit=fert_prices.get("dap", 27.0),
                total_cost=dap_cost,
                is_verified=True
            ))

        mop_kg = round(ferts.get("mop_kg_per_acre", 0) * acres, 2)
        mop_cost = round(mop_kg * fert_prices.get("mop", 34.0), 2)
        if mop_kg > 0:
            cost_breakdown.append(CostBreakdownItem(
                category="Fertilizer",
                item_name=f"MOP ({ferts['mop_kg_per_acre']} kg/acre)",
                quantity=mop_kg,
                unit="kg",
                cost_per_unit=fert_prices.get("mop", 34.0),
                total_cost=mop_cost,
                is_verified=True
            ))

        zinc_kg = round(ferts.get("zinc_kg_per_acre", 0) * acres, 2)
        zinc_cost = round(zinc_kg * fert_prices.get("zinc", 70.0), 2)
        if zinc_kg > 0:
            cost_breakdown.append(CostBreakdownItem(
                category="Fertilizer",
                item_name=f"Zinc Sulphate ({ferts['zinc_kg_per_acre']} kg/acre)",
                quantity=zinc_kg,
                unit="kg",
                cost_per_unit=fert_prices.get("zinc", 70.0),
                total_cost=zinc_cost,
                is_verified=True
            ))

        # Irrigation
        irr_cost_acre = agri.get("irrigation_cost_per_acre", 0)
        total_irr_cost = round(irr_cost_acre * acres, 2)
        cost_breakdown.append(CostBreakdownItem(
            category="Irrigation",
            item_name=f"Pumping & Fuel ({agri.get('irrigation_count', 0)} Irrigations)",
            quantity=acres,
            unit="acre",
            cost_per_unit=irr_cost_acre,
            total_cost=total_irr_cost,
            is_verified=True
        ))

        # Plant Protection
        pp_cost_acre = agri.get("plant_protection_cost_per_acre", 0)
        total_pp_cost = round(pp_cost_acre * acres, 2)
        cost_breakdown.append(CostBreakdownItem(
            category="Plant Protection",
            item_name="Weedicide & Fungicide Treatments",
            quantity=acres,
            unit="acre",
            cost_per_unit=pp_cost_acre,
            total_cost=total_pp_cost,
            is_verified=True
        ))

        # Labor
        labor_cost_acre = agri.get("labor_cost_per_acre", 0)
        total_labor_cost = round(labor_cost_acre * acres, 2)
        cost_breakdown.append(CostBreakdownItem(
            category="Labor",
            item_name="Field Prep, Weeding & Harvest Labor",
            quantity=acres,
            unit="acre",
            cost_per_unit=labor_cost_acre,
            total_cost=total_labor_cost,
            is_verified=True
        ))

        # Other
        other_cost_acre = agri.get("other_inputs_cost_per_acre", 0)
        total_other_cost = round(other_cost_acre * acres, 2)
        cost_breakdown.append(CostBreakdownItem(
            category="Other Inputs",
            item_name="Tractor Machinery & Compost",
            quantity=acres,
            unit="acre",
            cost_per_unit=other_cost_acre,
            total_cost=total_other_cost,
            is_verified=True
        ))

        total_input_cost = sum(item.total_cost for item in cost_breakdown)
        cost_min = round(total_input_cost * 0.92, 2)
        cost_max = round(total_input_cost * 1.08, 2)

        # Production
        avg_yield_acre = agri["average_yield_qtl_per_acre"]
        min_yield_acre, max_yield_acre = agri["yield_qtl_per_acre_range"]

        expected_prod_qtl = round(avg_yield_acre * acres, 2)
        expected_prod_kg = round(expected_prod_qtl * 100, 2)
        
        prod_min_qtl = round(min_yield_acre * acres, 2)
        prod_max_qtl = round(max_yield_acre * acres, 2)

        # Revenue & Margin
        gross_revenue = round(expected_prod_qtl * market_price, 2)
        rev_min = round(prod_min_qtl * market_price, 2)
        rev_max = round(prod_max_qtl * market_price, 2)

        estimated_margin = round(gross_revenue - total_input_cost, 2)
        margin_min = round(rev_min - cost_max, 2)
        margin_max = round(rev_max - cost_min, 2)

        data_status = "VERIFIED DATA" if not missing_fields else "PARTIAL DATA"

        # Build Formulas Explanation
        formulas_breakdown = [
            f"1. Land Standardized: {land_area} {land_unit} = {acres} Acres ({hectares} Hectares / {sqm} sq.m)",
            f"2. Verified Agronomic Source: {agri['source']}",
            f"3. Seed Requirement: {seed_rate} kg/acre × {acres} acres = {total_seed_kg} kg (₹{total_seed_cost})",
            f"4. Fertilizers: Urea {urea_kg} kg, DAP {dap_kg} kg, MOP {mop_kg} kg, Zinc {zinc_kg} kg (Total: ₹{urea_cost + dap_cost + mop_cost + zinc_cost})",
            f"5. Total Input Cost Formula: Seed + Fertilizers + Irrigation + Plant Protection + Labor + Machinery = ₹{total_input_cost:,.2f}",
            f"6. Expected Production: {avg_yield_acre} Qtl/acre × {acres} acres = {expected_prod_qtl} Qtl ({expected_prod_kg:,.0f} kg)",
            f"7. Gross Revenue Formula: {expected_prod_qtl} Qtl × ₹{market_price:,.2f}/Qtl ({price_source}) = ₹{gross_revenue:,.2f}",
            f"8. Estimated Profit Margin Formula: Gross Revenue (₹{gross_revenue:,.2f}) - Total Input Cost (₹{total_input_cost:,.2f}) = ₹{estimated_margin:,.2f}"
        ]

    else:
        # Unverified / Custom Crop
        crop_display_name = crop or "Custom Crop"
        is_verified_crop = False
        missing_fields.extend([
            "Official Seed Rate (kg/acre)",
            "Official Fertilizer Package (Urea/DAP/MOP)",
            "Yield Range Benchmark (Quintals/acre)"
        ])
        
        total_input_cost = 0.0
        cost_min, cost_max = 0.0, 0.0
        expected_prod_qtl, expected_prod_kg = 0.0, 0.0
        prod_min_qtl, prod_max_qtl = 0.0, 0.0
        gross_revenue, rev_min, rev_max = 0.0, 0.0, 0.0
        estimated_margin, margin_min, margin_max = 0.0, 0.0, 0.0

        data_status = "UNAVAILABLE DATA"

        formulas_breakdown = [
            f"1. Land Standardized: {land_area} {land_unit} = {acres} Acres ({hectares} Hectares)",
            f"2. Data Status: Verified agronomic benchmark rates not available for '{crop_display_name}'.",
            f"3. Note: AgroGuard strictly does not fabricate agricultural application rates when verified sources are unavailable.",
            f"4. Market Price Status: {price_source} (₹{market_price}/Qtl)" if market_price > 0 else "4. Market Price Status: Market price unavailable for this custom crop."
        ]

    return FarmEconomicsResponse(
        crop_name=crop_display_name,
        land_area=land_area,
        land_unit=land_unit,
        land_area_acres=acres,
        land_area_hectares=hectares,
        land_area_sqm=sqm,
        total_input_cost=total_input_cost,
        cost_range={"min": cost_min, "max": cost_max},
        cost_breakdown=cost_breakdown,
        expected_production_qtl=expected_prod_qtl,
        expected_production_kg=expected_prod_kg,
        production_range_qtl={"min": prod_min_qtl, "max": prod_max_qtl},
        market_price_per_qtl=market_price,
        market_price_source=price_source,
        gross_revenue=gross_revenue,
        revenue_range={"min": rev_min, "max": rev_max},
        estimated_margin=estimated_margin,
        margin_range={"min": margin_min, "max": margin_max},
        is_verified_crop=is_verified_crop,
        data_status=data_status,
        missing_fields=missing_fields,
        calculation_breakdown=formulas_breakdown,
        disclaimer=DISCLAIMER_TEXT
    )
