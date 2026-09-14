import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.schemas.decision import FarmActionPlanResponse, FarmStatusSummary, ActionItem
from app.services import chat_context_service, gemini_service

logger = logging.getLogger(__name__)

async def get_daily_farm_action_plan(
    db: Session,
    farm_id: Optional[int] = None,
    user_id: Optional[int] = None,
    force_fallback: bool = False
) -> FarmActionPlanResponse:
    """
    Unified AgroGuard AI Farm Decision Engine.
    Synthesizes the complete Active Farm Context:
      1. Farmer profile
      2. Active farm metadata & boundaries
      3. Fields on active farm
      4. Crops & varieties
      5. Growth stages
      6. Disease observations & severity
      7. Current weather
      8. Weather forecast & rain/wind warnings
      9. Nearby mandi prices & trends
      10. Market trends
      11. Total farm area
      12. Soil types
      13. Irrigation methods
      14. Existing decision advisories

    Outputs a structured, prioritized daily farm action plan answering: "What should I do today?" for the Active Farm.
    """
    current_time_str = datetime.now().strftime("%d %b %Y, %I:%M %p")

    # 1. Fetch Unified Context for Active Farm
    unified_ctx = await chat_context_service.get_unified_chat_context(db, farm_id=farm_id, user_id=user_id)

    farmer = unified_ctx.get("farmer", {})
    active_farm = unified_ctx.get("active_farm", {})
    fields = unified_ctx.get("fields", [])
    crops = unified_ctx.get("crops", [])
    weather = unified_ctx.get("weather", {})
    nearby_mandis = unified_ctx.get("nearby_mandis", [])
    disease_obs = unified_ctx.get("disease_observations", [])
    economics = unified_ctx.get("economics", {})

    # Extract farm summary numbers
    farm_id_resolved = active_farm.get("farm_id") or 0
    is_farm_mapped = bool(farm_id_resolved > 0 and (fields or active_farm.get("total_area_acres", 0) > 0))

    farm_name = active_farm.get("name") if is_farm_mapped else "No Farm Mapped"
    total_area_acres = float(active_farm.get("total_area_acres") or 0.0)
    primary_crop = ", ".join(crops) if (crops and crops != ["No Crop Mapped"]) else ("No Crop Mapped" if not is_farm_mapped else "Unassigned Crop")
    
    # Formulate health status summary
    if not is_farm_mapped:
        health_status = "No Farm Mapped"
    elif not fields:
        health_status = "No Fields Mapped"
    else:
        health_status = "Healthy"
        field_risks = [f for f in fields if f.get("health_status") in ["Disease Risk", "High Disease Risk", "Monitor"]]
        if field_risks:
            highest_risk = field_risks[0]
            health_status = f"{highest_risk.get('health_status')} ({highest_risk.get('field_name')}: {highest_risk.get('disease_status') or 'Inspect'})"

    # Formulate weather summary
    if weather.get("is_unavailable"):
        weather_summary = "Weather Data Unavailable"
    else:
        temp = weather.get("temperature_celsius", 25.0)
        cond = weather.get("condition", "Clear")
        rain_p = weather.get("rain_probability_percent", 0)
        weather_summary = f"{temp}°C • {cond} • Rain: {rain_p}%"

    # Formulate market summary
    market_summary = "Mandi Prices Unavailable"
    if nearby_mandis:
        first_mandi = nearby_mandis[0]
        price_val = first_mandi.get("modal_price", 0)
        market_summary = f"{first_mandi.get('mandi')}: ₹{price_val}/Qtl ({first_mandi.get('trend_display', 'Stable')})"

    # Formulate economics summary
    econ_summary = "No Farm Mapped" if not is_farm_mapped else "Economics Unavailable"
    if is_farm_mapped and economics and economics.get("total_input_cost"):
        cost = economics.get("total_input_cost", 0)
        margin = economics.get("estimated_margin", 0)
        econ_summary = f"Cost: ₹{cost:,.0f} • Est. Margin: ₹{margin:,.0f}"

    farm_status = FarmStatusSummary(
        crop=primary_crop,
        land_area=f"{total_area_acres:.1f} acres" if total_area_acres > 0 else "0.0 acres",
        health_status=health_status,
        weather_summary=weather_summary,
        market_summary=market_summary,
        economics_summary=econ_summary,
        farm_id=farm_id_resolved,
        farm_name=farm_name
    )

    # Handle unmapped farm case cleanly
    if not is_farm_mapped:
        return FarmActionPlanResponse(
            farm_status=farm_status,
            today_actions=[
                ActionItem(
                    priority="HIGH",
                    action="Map your virtual farm boundary on the GIS Farm Map",
                    reason="No farm boundary or fields are mapped for your account yet. Search your location and draw your field boundary polygon on the interactive GIS map to unlock localized satellite weather alerts, AI leaf pathology scans, and field-level crop advisories.",
                    timing="Today",
                    affected_field="Setup Required",
                    source_context="Farm Map Setup",
                    supporting_data_source="AgroGuard GIS Engine",
                    confidence="High"
                )
            ],
            next_3_days=[
                ActionItem(
                    priority="MEDIUM",
                    action="Define crop type and sowing date for each field",
                    reason="Adding crop details to your mapped fields allows AgroGuard to calculate growth stages, precise irrigation needs, and disease risks.",
                    timing="Next 3 Days",
                    affected_field="Setup Required",
                    source_context="Crop Config",
                    supporting_data_source="AgroGuard Crop Database",
                    confidence="High"
                )
            ],
            next_7_days=[
                ActionItem(
                    priority="LOW",
                    action="Track Mandi market rates for your target harvest crops",
                    reason="Once your crops and district are set, AgroGuard compares market rates across nearby mandis to calculate your estimated revenue.",
                    timing="Next 7 Days",
                    affected_field="Setup Required",
                    source_context="Market Setup",
                    supporting_data_source="AGMARKNET Prices",
                    confidence="High"
                )
            ],
            watch_for=["Draw field boundaries on the Virtual Farm Map tab to activate custom crop protection."],
            avoid=["Do not rely on generic crop advisories until your actual farm coordinates and crops are configured."],
            expert_help_when=["Need assistance drawing field boundaries on mobile or GPS."],
            is_live_ai=False,
            generated_at=current_time_str
        )

    # 2. AI Reasoning via Gemini (if configured and not force_fallback)
    if gemini_service.gemini_is_configured() and not force_fallback:
        ai_plan = await gemini_service.generate_farm_action_plan(
            farmer_context=unified_ctx,
            language=farmer.get("preferred_language", "English")
        )
        if ai_plan:
            try:
                today_items = [ActionItem(**item) for item in ai_plan.get("today_actions", [])]
                n3_items = [ActionItem(**item) for item in ai_plan.get("next_3_days", [])]
                n7_items = [ActionItem(**item) for item in ai_plan.get("next_7_days", [])]
                return FarmActionPlanResponse(
                    farm_status=farm_status,
                    today_actions=today_items,
                    next_3_days=n3_items,
                    next_7_days=n7_items,
                    watch_for=ai_plan.get("watch_for", []),
                    avoid=ai_plan.get("avoid", []),
                    expert_help_when=ai_plan.get("expert_help_when", []),
                    is_live_ai=True,
                    generated_at=current_time_str
                )
            except Exception as parse_err:
                logger.error(f"Failed to parse AI action plan response: {parse_err}")

    # 3. Deterministic Rules Pipeline (Reliable Fallback Engine)
    today_items: List[ActionItem] = []
    n3_items: List[ActionItem] = []
    n7_items: List[ActionItem] = []
    watch_for: List[str] = []
    avoid: List[str] = []
    expert_help_when: List[str] = []

    # Rule 1: Field-level Disease Observation & Risk
    for f in fields:
        f_name = f.get("field_name", "Field")
        f_crop = f.get("crop", "Crop")
        f_health = f.get("health_status", "Healthy")
        f_disease = f.get("disease_status", "None")

        if f_health in ["Disease Risk", "High Disease Risk"]:
            today_items.append(ActionItem(
                priority="HIGH",
                action=f"Inspect {f_name} today for {f_disease}",
                reason=f"Field health is flagged as {f_health}. Scan leaves to monitor symptom progression.",
                timing="Today",
                affected_field=f"{f_name} ({f_crop})",
                source_context="Crop Health Pathology",
                supporting_data_source="Virtual Farm Map Scan",
                confidence="High"
            ))
            watch_for.append(f"Spreading symptoms of {f_disease} on leaf canopy in {f_name}.")
            expert_help_when.append(f"Fungal or bacterial damage in {f_name} exceeds 20% of area.")

    # Rule 2: Weather Spray Advisories
    rain_p = weather.get("rain_probability_percent", 0) if weather else 0
    wind_s = weather.get("wind_speed_kmh", 10.0) if weather else 10.0

    if rain_p > 50:
        today_items.append(ActionItem(
            priority="HIGH",
            action="Postpone chemical pesticide & foliar fertilizer applications",
            reason=f"High rain probability of {rain_p}% within 24h will wash off applied chemicals.",
            timing="Today",
            affected_field="All Fields",
            source_context="Weather Intelligence",
            supporting_data_source=f"Live Weather ({weather.get('weather_source', 'Open-Meteo')})",
            confidence="High"
        ))
        avoid.append("Do not spray foliar chemicals or urea before expected rain to avoid wash-off loss.")
        watch_for.append("Field waterlogging and standing water after rainfall.")
    elif wind_s >= 20.0:
        today_items.append(ActionItem(
            priority="HIGH",
            action="Postpone spraying due to high wind velocity",
            reason=f"Wind speed of {wind_s} km/h causes severe spray drift to non-target areas.",
            timing="Today",
            affected_field="All Fields",
            source_context="Weather Intelligence",
            supporting_data_source="Wind Anemometer Data",
            confidence="High"
        ))
        avoid.append("Avoid chemical spraying during high wind hours.")
    else:
        today_items.append(ActionItem(
            priority="LOW",
            action=f"Favorable conditions for routine foliar maintenance across {farm_name}",
            reason=f"Low wind speed ({wind_s} km/h) and minimal rain risk ({rain_p}%).",
            timing="Today",
            affected_field="All Fields",
            source_context="Weather Intelligence",
            supporting_data_source="Live Weather",
            confidence="High"
        ))

    # Rule 3: Irrigation Schedule based on Weather & Growth Stage
    if rain_p > 50:
        n3_items.append(ActionItem(
            priority="MEDIUM",
            action="Hold off on scheduled canal / tube well irrigation",
            reason=f"Forecasted rainfall of {rain_p}% will fulfill soil moisture needs.",
            timing="Next 3 Days",
            affected_field="All Fields",
            source_context="Weather & Irrigation",
            supporting_data_source="Precipitation Forecast",
            confidence="High"
        ))
    else:
        first_field_stage = fields[0].get("growth_stage", "Vegetative") if fields else "Vegetative"
        n3_items.append(ActionItem(
            priority="MEDIUM",
            action=f"Apply scheduled irrigation for active {primary_crop}",
            reason=f"Maintain root zone moisture at {first_field_stage} growth stage.",
            timing="Next 3 Days",
            affected_field=fields[0].get("field_name", "Field 1") if fields else "All Fields",
            source_context="Irrigation Schedule",
            supporting_data_source="Growth Stage Guidelines",
            confidence="High"
        ))

    # Rule 4: Mandi Market Selling Considerations
    if nearby_mandis:
        m = nearby_mandis[0]
        n7_items.append(ActionItem(
            priority="LOW",
            action=f"Monitor modal price trend at {m.get('mandi')} (₹{m.get('modal_price')}/Qtl)",
            reason=f"Track modal price trends ({m.get('trend_display', 'Stable')}) and compare nearby markets before selling.",
            timing="Next 7 Days",
            affected_field="All Fields",
            source_context="Mandi Market Intelligence",
            supporting_data_source=f"Mandi Data ({m.get('data_source', 'AGMARKNET')})",
            confidence="High"
        ))
        avoid.append("Avoid distress selling without comparing nearby mandi prices.")
    else:
        n7_items.append(ActionItem(
            priority="LOW",
            action="Monitor regional mandi arrivals and price trends",
            reason="Compare prices across nearby markets before deciding harvest sale timing.",
            timing="Next 7 Days",
            affected_field="All Fields",
            source_context="Market Intelligence",
            supporting_data_source="Mandi Network",
            confidence="High"
        ))

    if not watch_for:
        watch_for.append("Inspect crop shoots for pest activity and foliage wilting.")
    if not expert_help_when:
        expert_help_when.append("Unidentified pest infestations or sudden crop yellowing occur.")

    return FarmActionPlanResponse(
        farm_status=farm_status,
        today_actions=today_items,
        next_3_days=n3_items,
        next_7_days=n7_items,
        watch_for=watch_for,
        avoid=avoid,
        expert_help_when=expert_help_when,
        is_live_ai=False,
        generated_at=current_time_str
    )
